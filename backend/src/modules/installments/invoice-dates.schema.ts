import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { baseSchemaOptions } from '../../common/mongo/schema-options';

/**
 * Datas reais de uma fatura específica, quando o banco muda o fechamento ou o
 * vencimento (fim de semana, feriado). Sem registro, valem os dias do cartão.
 */
@Schema(baseSchemaOptions)
export class InvoiceDatesOverride {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Card', required: true })
  cardId: Types.ObjectId;

  /** Mês/ano da fatura (mês de vencimento "de contrato"). */
  @Prop({ required: true })
  invoiceYear: number;

  @Prop({ required: true, min: 1, max: 12 })
  invoiceMonth: number;

  /** Meio-dia local do dia, em UTC (como as demais datas). */
  @Prop()
  closingDate?: Date;

  @Prop()
  dueDate?: Date;
}

export type InvoiceDatesOverrideDocument = HydratedDocument<InvoiceDatesOverride>;
export const InvoiceDatesOverrideSchema = SchemaFactory.createForClass(InvoiceDatesOverride);
InvoiceDatesOverrideSchema.index({ cardId: 1, invoiceYear: 1, invoiceMonth: 1 }, { unique: true });
