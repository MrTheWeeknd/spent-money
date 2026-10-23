import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { todayLocal, ymKey } from '../../common/dates';
import { Installment } from '../installments/installment.schema';
import { Person } from '../people/person.schema';
import { Settlement } from '../settlements/settlement.schema';
import { Transaction } from '../transactions/transaction.schema';
import { Charge, computeBalances, Payment, PersonBalance } from './balance';

/**
 * Saldo devedor de terceiros. Considera o que foi gasto em nome da pessoa
 * (parcelas no crédito + despesas em débito/Pix/dinheiro) menos os acertos.
 * Só lançamentos confirmados entram (previstos ainda não aconteceram).
 */
@Injectable()
export class BalancesService {
  constructor(
    @InjectModel(Person.name) private readonly people: Model<Person>,
    @InjectModel(Installment.name) private readonly installments: Model<Installment>,
    @InjectModel(Transaction.name) private readonly transactions: Model<Transaction>,
    @InjectModel(Settlement.name) private readonly settlements: Model<Settlement>,
  ) {}

  async balances(personId?: string): Promise<PersonBalance[]> {
    const others = await this.people
      .find({ isSelf: false, ...(personId && { _id: personId }) }, { _id: 1 })
      .lean();
    const ids = others.map((p) => p._id);
    const currentKey = ymKey(todayLocal());

    const [inst, direct, paid] = await Promise.all([
      this.installments.aggregate<{ _id: { p: Types.ObjectId; future: boolean }; total: number }>([
        { $match: { personId: { $in: ids }, status: 'confirmed' } },
        {
          $group: {
            _id: {
              p: '$personId',
              future: {
                $gt: [
                  { $add: [{ $multiply: ['$invoiceYear', 100] }, '$invoiceMonth'] },
                  currentKey,
                ],
              },
            },
            total: { $sum: '$amount' },
          },
        },
      ]),
      this.transactions.aggregate<{ _id: Types.ObjectId; total: number }>([
        {
          $match: {
            personId: { $in: ids },
            type: 'expense',
            method: { $ne: 'credit_card' },
            status: 'confirmed',
          },
        },
        { $group: { _id: '$personId', total: { $sum: '$amount' } } },
      ]),
      this.settlements.aggregate<{ _id: Types.ObjectId; total: number }>([
        { $match: { personId: { $in: ids } } },
        { $group: { _id: '$personId', total: { $sum: '$amount' } } },
      ]),
    ]);

    const charges: Charge[] = [
      ...inst.map((r) => ({ personId: String(r._id.p), amount: r.total, future: r._id.future })),
      ...direct.map((r) => ({ personId: String(r._id), amount: r.total })),
    ];
    const payments: Payment[] = paid.map((r) => ({ personId: String(r._id), amount: r.total }));
    const result = computeBalances(charges, payments);
    // Inclui quem ainda não tem movimento, com saldo zero.
    for (const id of ids.map(String)) {
      if (!result.some((b) => b.personId === id)) {
        result.push({ personId: id, charged: 0, future: 0, settled: 0, balance: 0 });
      }
    }
    return result;
  }

  /** Extrato da pessoa: gastos (por lançamento) e acertos, do mais recente para o mais antigo. */
  async statement(personId: string) {
    const person = await this.people.findById(personId).lean();
    if (!person) throw new NotFoundException('Pessoa não encontrada');
    const pid = new Types.ObjectId(personId);
    const [[balance], charges, payments] = await Promise.all([
      person.isSelf ? [null] : this.balances(personId),
      this.transactions
        .find({ personId: pid, type: 'expense', status: 'confirmed' })
        .sort({ date: -1, createdAt: -1 })
        .limit(300)
        .lean(),
      this.settlements.find({ personId: pid }).sort({ date: -1 }).lean(),
    ]);
    const items = [
      ...charges.map((t) => ({
        kind: 'charge' as const,
        id: String(t._id),
        date: t.date,
        amount: t.amount,
        description: t.description,
        categoryId: String(t.categoryId),
        method: t.method,
        cardId: t.cardId ? String(t.cardId) : null,
        installments: t.installments,
      })),
      ...payments.map((s) => ({
        kind: 'payment' as const,
        id: String(s._id),
        date: s.date,
        amount: s.amount,
        note: s.note ?? '',
      })),
    ].sort((a, b) => +b.date - +a.date);
    return { personId, balance: balance ?? null, items };
  }
}
