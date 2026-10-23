import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { baseSchemaOptions } from '../../common/mongo/schema-options';

/**
 * Pagamento (total ou parcial) de uma fatura. Não é uma despesa nova: as compras
 * já contam nos relatórios pelo mês da fatura; aqui só se registra a quitação.
 */
@Schema(baseSchemaOptions)
export class InvoicePayment {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Card', required: true })
  cardId: Types.ObjectId;

  /** Mês/ano da fatura (mês de vencimento). */
  @Prop({ required: true })
  invoiceYear: number;

  @Prop({ required: true, min: 1, max: 12 })
  invoiceMonth: number;

  /** Valor pago em centavos. */
  @Prop({ required: true, min: 1 })
  amount: number;

  @Prop({ required: true })
  date: Date;

  /** Conta de onde saiu o dinheiro (opcional). */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Account' })
  accountId?: Types.ObjectId;

  @Prop({ trim: true, maxlength: 200 })
  note?: string;
}

export type InvoicePaymentDocument = HydratedDocument<InvoicePayment>;
export const InvoicePaymentSchema = SchemaFactory.createForClass(InvoicePayment);
InvoicePaymentSchema.index({ cardId: 1, invoiceYear: 1, invoiceMonth: 1 });
