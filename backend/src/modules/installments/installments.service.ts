import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { toLocalDate } from '../../common/dates';
import { Card } from '../cards/card.schema';
import { Transaction, TransactionDocument } from '../transactions/transaction.schema';
import { planInstallments } from './billing';
import { Installment } from './installment.schema';
import { InvoiceDatesService } from './invoice-dates.service';

@Injectable()
export class InstallmentsService {
  constructor(
    @InjectModel(Installment.name) private readonly installments: Model<Installment>,
    @InjectModel(Card.name) private readonly cards: Model<Card>,
    @InjectModel(Transaction.name) private readonly transactions: Model<Transaction>,
    private readonly invoiceDates: InvoiceDatesService,
  ) {}

  /** Recria as parcelas de transações (só compras no crédito geram parcelas). */
  async syncFor(txs: TransactionDocument[]): Promise<void> {
    if (!txs.length) return;
    await this.installments.deleteMany({ transactionId: { $in: txs.map((t) => t._id) } });

    const credit = txs.filter(
      (t) => t.type === 'expense' && t.method === 'credit_card' && t.cardId,
    );
    if (!credit.length) return;
    const cardIds = [...new Set(credit.map((t) => String(t.cardId)))];
    const overrides = await this.invoiceDates.load(cardIds);
    const cards = new Map(
      (await this.cards.find({ _id: { $in: cardIds } }).lean()).map((c) => [String(c._id), c]),
    );

    const docs = credit.flatMap((t) => {
      const card = cards.get(String(t.cardId));
      if (!card) return [];
      return planInstallments(
        toLocalDate(t.date),
        t.amount,
        t.installments,
        card,
        overrides.get(String(t.cardId)),
      ).map((p) => ({
        ...p,
        transactionId: t._id,
        cardId: t.cardId,
        personId: t.personId,
        categoryId: t.categoryId,
        date: t.date,
        description: t.description,
        status: t.status,
      }));
    });
    if (docs.length) await this.installments.insertMany(docs);
  }

  async removeFor(transactionIds: Types.ObjectId[]): Promise<void> {
    await this.installments.deleteMany({ transactionId: { $in: transactionIds } });
  }

  /** Recalcula as faturas de um cartão (ex.: mudou o dia de fechamento). */
  async recomputeForCard(cardId: string): Promise<void> {
    const txs = await this.transactions.find({ cardId, method: 'credit_card' });
    await this.syncFor(txs);
  }
}
