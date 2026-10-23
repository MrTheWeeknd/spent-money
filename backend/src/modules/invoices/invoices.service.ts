import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  addMonths,
  compareLocal,
  formatLocalDate,
  formatYm,
  LocalDate,
  parseLocalDate,
  storedDate,
  todayLocal,
  YearMonth,
  ymKey,
} from '../../common/dates';
import { Account } from '../accounts/account.schema';
import { Card } from '../cards/card.schema';
import { Invoice, invoiceByDueMonth, invoiceFor } from '../installments/billing';
import { Installment } from '../installments/installment.schema';
import { InstallmentsService } from '../installments/installments.service';
import { InvoiceDatesService } from '../installments/invoice-dates.service';
import { Transaction, TransactionDocument } from '../transactions/transaction.schema';
import { InvoiceDatesDto, PayInvoiceDto } from './invoice-payment.dto';
import { InvoicePayment } from './invoice-payment.schema';

export type InvoiceStatus = 'open' | 'closed' | 'past' | 'paid';

/** Status pelo calendário; "paga" vence qualquer outro quando os pagamentos cobrem o total. */
export function statusOf(inv: Invoice, today: LocalDate, total = 0, paid = 0): InvoiceStatus {
  if (total > 0 && paid >= total) return 'paid';
  if (compareLocal(today, inv.closingDate) < 0) return 'open';
  if (compareLocal(today, inv.dueDate) <= 0) return 'closed';
  return 'past';
}

function describe(inv: Invoice, total: number, paid: number, today: LocalDate) {
  return {
    month: formatYm(inv),
    closingDate: formatLocalDate(inv.closingDate),
    dueDate: formatLocalDate(inv.dueDate),
    status: statusOf(inv, today, total, paid),
    total,
    paid,
    remaining: Math.max(0, total - paid),
    nominalClosingDate: formatLocalDate(inv.nominalClosingDate),
    nominalDueDate: formatLocalDate(inv.nominalDueDate),
    closingAdjusted: inv.closingAdjusted,
    dueAdjusted: inv.dueAdjusted,
    /** Vencimento levado para o próximo dia útil (fim de semana/feriado). */
    dueShifted: !inv.dueAdjusted && compareLocal(inv.dueDate, inv.nominalDueDate) !== 0,
  };
}

const key = (cardId: unknown, ym: YearMonth) => `${String(cardId)}:${ymKey(ym)}`;

@Injectable()
export class InvoicesService {
  constructor(
    @InjectModel(Card.name) private readonly cards: Model<Card>,
    @InjectModel(Installment.name) private readonly installments: Model<Installment>,
    @InjectModel(InvoicePayment.name) private readonly payments: Model<InvoicePayment>,
    @InjectModel(Transaction.name) private readonly transactions: Model<Transaction>,
    @InjectModel(Account.name) private readonly accounts: Model<Account>,
    private readonly installmentsService: InstallmentsService,
    private readonly invoiceDates: InvoiceDatesService,
  ) {}

  /**
   * Para cada cartão: a fatura anterior quando ainda pede atenção (fechada aguardando
   * vencimento, ou vencida sem pagamento), a fatura aberta (onde cai uma compra de hoje)
   * e as próximas, com totais e valor pago.
   */
  async overview(ahead = 3) {
    const today = todayLocal();
    const cards = await this.cards.find({ active: true }).sort({ name: 1 }).lean();
    if (!cards.length) return [];
    const ids = cards.map((c) => c._id);
    const [totals, paidMap, overrides] = await Promise.all([
      this.totalsByInvoice(ids),
      this.paidByInvoice(ids),
      this.invoiceDates.load(ids),
    ]);

    return cards.map((card) => {
      const ov = overrides.get(String(card._id));
      const open = invoiceFor(today, card, ov);
      const prev = invoiceByDueMonth(addMonths(open, -1), card, ov);
      const d = (inv: Invoice) =>
        describe(
          inv,
          totals.get(key(card._id, inv)) ?? 0,
          paidMap.get(key(card._id, inv)) ?? 0,
          today,
        );
      const previous = d(prev);
      const showPrevious =
        statusOf(prev, today) === 'closed' ||
        (previous.status === 'past' && previous.remaining > 0);
      return {
        cardId: String(card._id),
        closed: showPrevious ? previous : null,
        current: d(open),
        upcoming: Array.from({ length: ahead }, (_, i) =>
          d(invoiceByDueMonth(addMonths(open, i + 1), card, ov)),
        ),
      };
    });
  }

  /**
   * Faturas que vencem no mês, de todos os cartões (ativos, ou inativos com gastos no mês),
   * com o total geral e quanto cada pessoa gastou nelas. É o "quanto deu" do mês.
   */
  async forMonth(ym: YearMonth) {
    const today = todayLocal();
    const filter = { invoiceYear: ym.year, invoiceMonth: ym.month };
    type Row = { _id: { c: Types.ObjectId; p: Types.ObjectId }; total: number };
    const [rows, pays] = await Promise.all([
      this.installments.aggregate<Row>([
        { $match: filter },
        { $group: { _id: { c: '$cardId', p: '$personId' }, total: { $sum: '$amount' } } },
      ]),
      this.payments.aggregate<{ _id: Types.ObjectId; total: number }>([
        { $match: filter },
        { $group: { _id: '$cardId', total: { $sum: '$amount' } } },
      ]),
    ]);
    const withSpending = [...new Set(rows.map((r) => String(r._id.c)))];
    const cards = await this.cards
      .find({ $or: [{ active: true }, { _id: { $in: withSpending } }] })
      .lean();
    const overrides = await this.invoiceDates.load(cards.map((c) => c._id));

    const invoices = cards
      .map((card) => {
        const id = String(card._id);
        const total = rows.filter((r) => String(r._id.c) === id).reduce((s, r) => s + r.total, 0);
        const paid = pays.find((p) => String(p._id) === id)?.total ?? 0;
        return {
          cardId: id,
          ...describe(invoiceByDueMonth(ym, card, overrides.get(id)), total, paid, today),
        };
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || b.total - a.total);

    const byPerson = new Map<string, number>();
    for (const r of rows)
      byPerson.set(String(r._id.p), (byPerson.get(String(r._id.p)) ?? 0) + r.total);
    const total = invoices.reduce((s, i) => s + i.total, 0);
    const paid = invoices.reduce((s, i) => s + Math.min(i.paid, i.total), 0);

    return {
      month: formatYm(ym),
      total,
      paid,
      remaining: Math.max(0, total - paid),
      invoices,
      byPerson: [...byPerson]
        .map(([personId, amount]) => ({ personId, amount }))
        .sort((a, b) => b.amount - a.amount),
    };
  }

  /** Detalhe da fatura de um cartão no mês de vencimento informado. */
  async detail(cardId: string, ym: YearMonth) {
    const card = await this.cards.findById(cardId).lean();
    if (!card) throw new NotFoundException('Cartão não encontrado');
    const ov = await this.invoiceDates.forCard(card._id);
    const inv = invoiceByDueMonth(ym, card, ov);
    const filter = { cardId: card._id, invoiceYear: ym.year, invoiceMonth: ym.month };
    const [items, payments] = await Promise.all([
      this.installments.find(filter).sort({ date: -1, createdAt: -1 }).lean(),
      this.payments.find(filter).sort({ date: -1, createdAt: -1 }).lean(),
    ]);

    const total = items.reduce((s, i) => s + i.amount, 0);
    const paid = payments.reduce((s, p) => s + p.amount, 0);
    const byPerson = new Map<string, number>();
    for (const i of items) {
      byPerson.set(String(i.personId), (byPerson.get(String(i.personId)) ?? 0) + i.amount);
    }
    const today = todayLocal();
    const current = invoiceFor(today, card, ov);

    return {
      cardId,
      ...describe(inv, total, paid, today),
      isCurrent: ymKey(current) === ymKey(inv),
      byPerson: [...byPerson]
        .map(([personId, amount]) => ({ personId, amount }))
        .sort((a, b) => b.amount - a.amount),
      payments: payments.map((p) => ({
        id: String(p._id),
        amount: p.amount,
        date: p.date,
        accountId: p.accountId ? String(p.accountId) : null,
        note: p.note ?? '',
      })),
      items: items.map((i) => ({
        id: String(i._id),
        transactionId: String(i.transactionId),
        number: i.number,
        total: i.total,
        amount: i.amount,
        personId: String(i.personId),
        categoryId: String(i.categoryId),
        description: i.description,
        date: i.date,
        status: i.status,
      })),
    };
  }

  /**
   * Registra um pagamento (total ou parcial). Quando a fatura fica quitada, os
   * lançamentos ainda "previstos" dela (ex.: assinatura recorrente) viram confirmados.
   */
  async pay(cardId: string, ym: YearMonth, dto: PayInvoiceDto) {
    const card = await this.cards.findById(cardId).lean();
    if (!card) throw new NotFoundException('Cartão não encontrado');
    let date: Date;
    try {
      date = storedDate(parseLocalDate(dto.date));
    } catch {
      throw new BadRequestException('Data inválida');
    }
    if (dto.accountId && !(await this.accounts.exists({ _id: dto.accountId }))) {
      throw new BadRequestException('Conta não encontrada');
    }
    await this.payments.create({
      cardId: card._id,
      invoiceYear: ym.year,
      invoiceMonth: ym.month,
      amount: dto.amount,
      date,
      accountId: dto.accountId ? new Types.ObjectId(dto.accountId) : undefined,
      note: dto.note || undefined,
    });

    const result = await this.detail(cardId, ym);
    if (result.status === 'paid') await this.confirmPlanned(card._id, ym);
    return result.status === 'paid' ? this.detail(cardId, ym) : result;
  }

  /**
   * Ajusta as datas reais desta fatura (o banco mudou por fim de semana/feriado).
   * Mudar o fechamento redistribui as compras próximas da data entre as faturas.
   * Enviar null em um campo volta ao dia configurado no cartão.
   */
  async setDates(cardId: string, ym: YearMonth, dto: InvoiceDatesDto) {
    const card = await this.cards.findById(cardId).lean();
    if (!card) throw new NotFoundException('Cartão não encontrado');
    const parse = (v: string | null | undefined, label: string) => {
      if (v === undefined || v === null) return v;
      try {
        return parseLocalDate(v);
      } catch {
        throw new BadRequestException(`${label} inválida`);
      }
    };
    const closingDate = parse(dto.closingDate, 'Data de fechamento');
    const dueDate = parse(dto.dueDate, 'Data de vencimento');

    // Sanidade: perto das datas do cartão e fechamento antes do vencimento.
    const nominal = invoiceByDueMonth(ym, card);
    const days = (a: LocalDate, b: LocalDate) =>
      Math.round(
        (Date.UTC(a.year, a.month - 1, a.day) - Date.UTC(b.year, b.month - 1, b.day)) / 86_400_000,
      );
    if (closingDate && Math.abs(days(closingDate, nominal.nominalClosingDate)) > 15) {
      throw new BadRequestException(
        'O fechamento deve ficar a até 15 dias do dia configurado no cartão',
      );
    }
    if (dueDate && Math.abs(days(dueDate, nominal.nominalDueDate)) > 15) {
      throw new BadRequestException(
        'O vencimento deve ficar a até 15 dias do dia configurado no cartão',
      );
    }
    const effClosing =
      closingDate ??
      (closingDate === null
        ? nominal.nominalClosingDate
        : ((await this.invoiceDates.forCard(card._id)).get(ymKey(ym))?.closingDate ??
          nominal.nominalClosingDate));
    const effDue = dueDate ?? nominal.dueDate;
    if (compareLocal(effClosing, effDue) >= 0) {
      throw new BadRequestException('O fechamento precisa ser antes do vencimento');
    }

    await this.invoiceDates.set(card._id, ym, { closingDate, dueDate });
    if (dto.closingDate !== undefined) await this.installmentsService.recomputeForCard(cardId);
    return this.detail(cardId, ym);
  }

  async removePayment(id: string) {
    const res = await this.payments.deleteOne({ _id: id });
    if (!res.deletedCount) throw new NotFoundException('Pagamento não encontrado');
  }

  private async confirmPlanned(cardId: Types.ObjectId, ym: YearMonth) {
    const planned = await this.installments
      .find(
        { cardId, invoiceYear: ym.year, invoiceMonth: ym.month, status: 'planned' },
        { transactionId: 1 },
      )
      .lean();
    if (!planned.length) return;
    const ids = [...new Set(planned.map((p) => String(p.transactionId)))];
    await this.transactions.updateMany({ _id: { $in: ids } }, { $set: { status: 'confirmed' } });
    const txs = await this.transactions.find({ _id: { $in: ids } });
    await this.installmentsService.syncFor(txs as TransactionDocument[]);
  }

  private async totalsByInvoice(cardIds: Types.ObjectId[]): Promise<Map<string, number>> {
    return this.sumByInvoice(this.installments, cardIds);
  }

  private async paidByInvoice(cardIds: Types.ObjectId[]): Promise<Map<string, number>> {
    return this.sumByInvoice(this.payments, cardIds);
  }

  private async sumByInvoice(
    model: Model<Installment> | Model<InvoicePayment>,
    cardIds: Types.ObjectId[],
  ): Promise<Map<string, number>> {
    const rows = await (model as Model<Installment>).aggregate<{
      _id: { c: Types.ObjectId; y: number; m: number };
      total: number;
    }>([
      { $match: { cardId: { $in: cardIds } } },
      {
        $group: {
          _id: { c: '$cardId', y: '$invoiceYear', m: '$invoiceMonth' },
          total: { $sum: '$amount' },
        },
      },
    ]);
    return new Map(rows.map((r) => [`${r._id.c}:${r._id.y * 100 + r._id.m}`, r.total]));
  }
}
