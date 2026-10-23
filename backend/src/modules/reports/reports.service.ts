import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  addMonths,
  APP_TZ,
  formatYm,
  fromYmKey,
  monthRange,
  todayLocal,
  YearMonth,
  ymKey,
} from '../../common/dates';
import { BalancesService } from '../balances/balances.service';
import { Installment } from '../installments/installment.schema';
import { InvoicesService } from '../invoices/invoices.service';
import { Person } from '../people/person.schema';
import { Transaction, TransactionType } from '../transactions/transaction.schema';
import { TransactionsService } from '../transactions/transactions.service';
import { formatLocalDate, localToUtc } from '../../common/dates';
import { Card } from '../cards/card.schema';
import { invoiceByDueMonth } from '../installments/billing';
import { InvoiceDatesService } from '../installments/invoice-dates.service';
import { SettingsService } from '../settings/settings.service';
import { cycleOf, cycleWindow, invoiceMonthsInCycle } from './cycle';
import { addRow, byCategory, emptyTotals, LedgerRow } from './ledger';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Transaction.name) private readonly transactions: Model<Transaction>,
    @InjectModel(Installment.name) private readonly installments: Model<Installment>,
    @InjectModel(Person.name) private readonly people: Model<Person>,
    private readonly invoices: InvoicesService,
    private readonly balances: BalancesService,
    private readonly txService: TransactionsService,
    @InjectModel(Card.name) private readonly cards: Model<Card>,
    private readonly settings: SettingsService,
    private readonly invoiceDates: InvoiceDatesService,
  ) {}

  /** Linhas agregadas por mês/tipo/status/categoria entre dois meses (inclusive). */
  async ledger(from: YearMonth, to: YearMonth): Promise<LedgerRow[]> {
    const self = await this.people.findOne({ isSelf: true }, { _id: 1 }).lean();
    const selfId = self?._id ?? new Types.ObjectId();
    const start = monthRange(from).start;
    const end = monthRange(to).end;
    const fromKey = ymKey(from);
    const toKey = ymKey(to);

    type Agg = {
      _id: {
        ym: number;
        type: TransactionType;
        status: LedgerRow['status'];
        c: Types.ObjectId;
        mine: boolean;
      };
      total: number;
    };
    const [direct, inst] = await Promise.all([
      this.transactions.aggregate<Agg>([
        { $match: { method: { $ne: 'credit_card' }, date: { $gte: start, $lt: end } } },
        { $addFields: { p: { $dateToParts: { date: '$date', timezone: APP_TZ } } } },
        {
          $group: {
            _id: {
              ym: { $add: [{ $multiply: ['$p.year', 100] }, '$p.month'] },
              type: '$type',
              status: '$status',
              c: '$categoryId',
              mine: { $eq: ['$personId', selfId] },
            },
            total: { $sum: '$amount' },
          },
        },
      ]),
      this.installments.aggregate<Agg>([
        { $addFields: { ym: { $add: [{ $multiply: ['$invoiceYear', 100] }, '$invoiceMonth'] } } },
        { $match: { ym: { $gte: fromKey, $lte: toKey } } },
        {
          $group: {
            _id: {
              ym: '$ym',
              type: 'expense',
              status: '$status',
              c: '$categoryId',
              mine: { $eq: ['$personId', selfId] },
            },
            total: { $sum: '$amount' },
          },
        },
      ]),
    ]);
    return [...direct, ...inst].map((r) => ({
      ym: r._id.ym,
      type: r._id.type,
      status: r._id.status,
      categoryId: String(r._id.c),
      mine: r._id.mine,
      total: r.total,
    }));
  }

  async dashboard(month: YearMonth) {
    await this.txService.ensureRecurrenceHorizon();
    const [rows, cards, monthInvoices, balances, recent] = await Promise.all([
      this.ledger(month, month),
      this.invoices.overview(1),
      this.invoices.forMonth(month),
      this.balances.balances(),
      this.transactions
        .find({ date: { $lt: monthRange(todayLocal()).end }, status: 'confirmed' })
        .sort({ date: -1, createdAt: -1 })
        .limit(6)
        .exec(),
    ]);
    const totals = emptyTotals();
    rows.forEach((r) => addRow(totals, r));
    return {
      month: formatYm(month),
      ...totals,
      balance: totals.income - totals.expense,
      forecastBalance:
        totals.income + totals.incomePlanned - totals.expense - totals.expensePlanned,
      expenseByCategory: byCategory(rows, 'expense'),
      cards,
      /** Faturas que vencem no mês (foco do app): total, pago e quanto cada pessoa gastou. */
      invoices: monthInvoices,
      debts: balances.filter((b) => b.balance !== 0),
      recent,
    };
  }

  /**
   * Balanço do "meu mês" (ciclo que fecha no dia configurado): quanto entrou,
   * quanto EU gastei (minha parte nas faturas que vencem no ciclo + débito/Pix/dinheiro
   * no período) e quanto sobrou. Gastos de terceiros nos meus cartões vêm à parte.
   */
  async cycle(month?: YearMonth) {
    await this.txService.ensureRecurrenceHorizon();
    const { cycleEndDay } = await this.settings.get();
    const w = month ? cycleWindow(month, cycleEndDay) : cycleOf(todayLocal(), cycleEndDay);
    const self = await this.people.findOne({ isSelf: true }, { _id: 1 }).lean();
    const selfId = self?._id ?? new Types.ObjectId();
    const start = localToUtc(w.start.year, w.start.month, w.start.day);
    const end = new Date(localToUtc(w.end.year, w.end.month, w.end.day).getTime() + 86_400_000);

    const cards = await this.cards.find().lean();
    const overrides = await this.invoiceDates.load(cards.map((c) => c._id));
    const invoices = cards.flatMap((card) =>
      invoiceMonthsInCycle(card, w).map((ym) => ({
        card,
        ym,
        inv: invoiceByDueMonth(ym, card, overrides.get(String(card._id))),
      })),
    );

    type Key = { status: string; mine: boolean; c: Types.ObjectId; p: Types.ObjectId };
    type TxAgg = { _id: Key & { type: TransactionType }; total: number };
    type InstAgg = { _id: Key & { card: Types.ObjectId; y: number; m: number }; total: number };
    const [txRows, instRows] = await Promise.all([
      this.transactions.aggregate<TxAgg>([
        { $match: { date: { $gte: start, $lt: end }, method: { $ne: 'credit_card' } } },
        {
          $group: {
            _id: {
              type: '$type',
              status: '$status',
              mine: { $eq: ['$personId', selfId] },
              c: '$categoryId',
              p: '$personId',
            },
            total: { $sum: '$amount' },
          },
        },
      ]),
      invoices.length
        ? this.installments.aggregate<InstAgg>([
            {
              $match: {
                $or: invoices.map((i) => ({
                  cardId: i.card._id,
                  invoiceYear: i.ym.year,
                  invoiceMonth: i.ym.month,
                })),
              },
            },
            {
              $group: {
                _id: {
                  card: '$cardId',
                  y: '$invoiceYear',
                  m: '$invoiceMonth',
                  mine: { $eq: ['$personId', selfId] },
                  status: '$status',
                  c: '$categoryId',
                  p: '$personId',
                },
                total: { $sum: '$amount' },
              },
            },
          ])
        : Promise.resolve([] as InstAgg[]),
    ]);

    const income = { received: 0, planned: 0 };
    const mine = { total: 0, confirmed: 0, planned: 0, credit: 0, other: 0 };
    const categories = new Map<string, number>();
    const others = new Map<string, number>();
    const addMine = (amount: number, status: string, categoryId: string, credit: boolean) => {
      mine.total += amount;
      if (status === 'planned') mine.planned += amount;
      else mine.confirmed += amount;
      if (credit) mine.credit += amount;
      else mine.other += amount;
      categories.set(categoryId, (categories.get(categoryId) ?? 0) + amount);
    };
    const addOther = (personId: string, amount: number) =>
      others.set(personId, (others.get(personId) ?? 0) + amount);

    for (const r of txRows) {
      if (r._id.type === 'income') {
        if (r._id.status === 'planned') income.planned += r.total;
        else income.received += r.total;
      } else if (r._id.mine) addMine(r.total, r._id.status, String(r._id.c), false);
      else addOther(String(r._id.p), r.total);
    }
    for (const r of instRows) {
      if (r._id.mine) addMine(r.total, r._id.status, String(r._id.c), true);
      else addOther(String(r._id.p), r.total);
    }

    const byCard = invoices
      .map(({ card, ym, inv }) => {
        const rows = instRows.filter(
          (r) =>
            String(r._id.card) === String(card._id) && r._id.y === ym.year && r._id.m === ym.month,
        );
        return {
          cardId: String(card._id),
          active: card.active,
          month: formatYm(ym),
          dueDate: formatLocalDate(inv.dueDate),
          mine: rows.filter((r) => r._id.mine).reduce((s, r) => s + r.total, 0),
          total: rows.reduce((s, r) => s + r.total, 0),
        };
      })
      .filter((c) => c.total > 0 || c.active)
      .map(({ active: _active, ...c }) => c)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    const incomeTotal = income.received + income.planned;
    return {
      month: formatYm(w.month),
      start: formatLocalDate(w.start),
      end: formatLocalDate(w.end),
      endDay: cycleEndDay,
      isCurrent: formatYm(cycleOf(todayLocal(), cycleEndDay).month) === formatYm(w.month),
      income: { ...income, total: incomeTotal },
      mine,
      /** Receita do ciclo − o que EU gastei (inclui previstos). */
      balance: incomeTotal - mine.total,
      byCard,
      byCategory: [...categories]
        .map(([categoryId, total]) => ({ categoryId, total }))
        .sort((a, b) => b.total - a.total),
      others: {
        total: [...others.values()].reduce((s, v) => s + v, 0),
        byPerson: [...others]
          .map(([personId, amount]) => ({ personId, amount }))
          .sort((a, b) => b.amount - a.amount),
      },
    };
  }

  /** Receitas x despesas (minhas) nos últimos N meses, terminando em `to`. */
  async monthly(months: number, to: YearMonth = todayLocal()) {
    const from = addMonths(to, -(months - 1));
    const rows = await this.ledger(from, to);
    return Array.from({ length: months }, (_, i) => {
      const ym = addMonths(from, i);
      const t = emptyTotals();
      rows.filter((r) => r.ym === ymKey(ym)).forEach((r) => addRow(t, r));
      return { month: formatYm(ym), ...t };
    });
  }

  async categories(from: YearMonth, to: YearMonth, type: TransactionType) {
    const rows = await this.ledger(from, to);
    const months = new Set(rows.map((r) => r.ym));
    return {
      from: formatYm(from),
      to: formatYm(to),
      type,
      months: [...months].sort().map((k) => formatYm(fromYmKey(k))),
      categories: byCategory(rows, type),
    };
  }
}
