import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { baseSchemaOptions } from '../../common/mongo/schema-options';

export const TRANSACTION_TYPES = ['expense', 'income'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const PAYMENT_METHODS = ['credit_card', 'debit', 'pix', 'cash'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const TRANSACTION_STATUSES = ['confirmed', 'planned'] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export const MAX_INSTALLMENTS = 48;

@Schema({ _id: false })
export class Recurrence {
  /** Identifica todas as ocorrências da mesma recorrência. */
  @Prop({ required: true })
  groupId: string;

  @Prop({ required: true, default: 'monthly', enum: ['monthly'] })
  frequency: 'monthly';

  /** Dia do mês original (31 continua 31 nos meses que têm 31 dias). */
  @Prop({ required: true, min: 1, max: 31 })
  day: number;

  /** Recorrência encerrada: não gera novas ocorrências. */
  @Prop({ default: false })
  stopped: boolean;
}
const RecurrenceSchema = SchemaFactory.createForClass(Recurrence);

@Schema(baseSchemaOptions)
export class Transaction {
  @Prop({ required: true, enum: TRANSACTION_TYPES })
  type: TransactionType;

  /** Valor total em centavos (sempre positivo; o tipo define o sinal). */
  @Prop({ required: true, min: 1 })
  amount: number;

  @Prop({ trim: true, maxlength: 120, default: '' })
  description: string;

  /** Instante UTC (meio-dia local do dia do lançamento). */
  @Prop({ required: true })
  date: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;

  /** Quem gastou/recebeu. */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Person', required: true })
  personId: Types.ObjectId;

  @Prop({ required: true, enum: PAYMENT_METHODS })
  method: PaymentMethod;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Card' })
  cardId?: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Account' })
  accountId?: Types.ObjectId;

  @Prop({ required: true, default: 1, min: 1, max: MAX_INSTALLMENTS })
  installments: number;

  /** planned = previsto (recorrência futura); confirmed = pago/recebido. */
  @Prop({ required: true, enum: TRANSACTION_STATUSES, default: 'confirmed' })
  status: TransactionStatus;

  @Prop({ type: RecurrenceSchema })
  recurrence?: Recurrence;

  @Prop({ trim: true, maxlength: 500 })
  note?: string;

  @Prop({ type: [String], default: [] })
  tags: string[];
}

export type TransactionDocument = HydratedDocument<Transaction>;
export const TransactionSchema = SchemaFactory.createForClass(Transaction);
TransactionSchema.index({ date: -1, createdAt: -1 });
TransactionSchema.index({ type: 1, date: -1 });
TransactionSchema.index({ personId: 1, date: -1 });
TransactionSchema.index({ cardId: 1, date: -1 });
TransactionSchema.index({ categoryId: 1, date: -1 });
TransactionSchema.index({ 'recurrence.groupId': 1, date: 1 });
