import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { storedDate, toLocalDate, YearMonth, ymKey } from '../../common/dates';
import { InvoiceOverrides } from './billing';
import { InvoiceDatesOverride } from './invoice-dates.schema';

@Injectable()
export class InvoiceDatesService {
  constructor(
    @InjectModel(InvoiceDatesOverride.name) private readonly model: Model<InvoiceDatesOverride>,
  ) {}

  /** Ajustes de datas por cartão, prontos para as funções de billing. */
  async load(cardIds: (Types.ObjectId | string)[]): Promise<Map<string, InvoiceOverrides>> {
    const rows = await this.model.find({ cardId: { $in: cardIds } }).lean();
    const byCard = new Map<string, InvoiceOverrides>();
    for (const r of rows) {
      const id = String(r.cardId);
      if (!byCard.has(id)) byCard.set(id, new Map());
      byCard.get(id)!.set(r.invoiceYear * 100 + r.invoiceMonth, {
        closingDate: r.closingDate ? toLocalDate(r.closingDate) : undefined,
        dueDate: r.dueDate ? toLocalDate(r.dueDate) : undefined,
      });
    }
    return byCard;
  }

  async forCard(cardId: Types.ObjectId | string): Promise<InvoiceOverrides> {
    return (await this.load([cardId])).get(String(cardId)) ?? new Map();
  }

  /** Grava (ou remove, quando as duas datas vêm vazias) o ajuste de uma fatura. */
  async set(
    cardId: Types.ObjectId,
    ym: YearMonth,
    dates: {
      closingDate?: { year: number; month: number; day: number } | null;
      dueDate?: { year: number; month: number; day: number } | null;
    },
  ): Promise<void> {
    const filter = { cardId, invoiceYear: ym.year, invoiceMonth: ym.month };
    const current = (await this.forCard(cardId)).get(ymKey(ym));
    const closing = dates.closingDate === undefined ? current?.closingDate : dates.closingDate;
    const due = dates.dueDate === undefined ? current?.dueDate : dates.dueDate;
    if (!closing && !due) {
      await this.model.deleteOne(filter);
      return;
    }
    await this.model.updateOne(
      filter,
      {
        $set: {
          closingDate: closing ? storedDate(closing) : null,
          dueDate: due ? storedDate(due) : null,
        },
        $setOnInsert: filter,
      },
      { upsert: true },
    );
  }
}
