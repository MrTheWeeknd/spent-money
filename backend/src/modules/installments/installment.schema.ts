import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { baseSchemaOptions } from '../../common/mongo/schema-options';
import { TRANSACTION_STATUSES, type TransactionStatus } from '../transactions/transaction.schema';

/**
 * Parcela de uma compra no crédito. Gerada a partir da transação (nunca editada à mão):
 * editar ou excluir a transação recria/remove as parcelas.
 * Campos de categoria/descrição/status são cópias para consultar faturas sem join.
 */
@Schema(baseSchemaOptions)
export class Installment {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Transaction', required: true })
  transactionId: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  number: number;

  @Prop({ required: true, min: 1 })
  total: number;

  /** Valor da parcela em centavos. */
  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Card', required: true })
  cardId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Person', required: true })
  personId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;

  /** Mês/ano da fatura (mês de vencimento) em que a parcela cai. */
  @Prop({ required: true })
  invoiceYear: number;

  @Prop({ required: true, min: 1, max: 12 })
  invoiceMonth: number;

  /** Data da compra. */
  @Prop({ required: true })
  date: Date;

  @Prop({ default: '' })
  description: string;

  @Prop({ required: true, enum: TRANSACTION_STATUSES })
  status: TransactionStatus;
}

export type InstallmentDocument = HydratedDocument<Installment>;
export const InstallmentSchema = SchemaFactory.createForClass(Installment);
InstallmentSchema.index({ cardId: 1, invoiceYear: 1, invoiceMonth: 1 });
InstallmentSchema.index({ personId: 1, invoiceYear: 1, invoiceMonth: 1 });
InstallmentSchema.index({ invoiceYear: 1, invoiceMonth: 1 });
InstallmentSchema.index({ transactionId: 1 });
