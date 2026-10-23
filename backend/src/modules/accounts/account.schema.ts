import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../common/mongo/schema-options';

export const ACCOUNT_TYPES = ['checking', 'wallet', 'savings'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

@Schema(baseSchemaOptions)
export class Account {
  @Prop({ required: true, trim: true, maxlength: 40 })
  name: string;

  @Prop({ required: true, enum: ACCOUNT_TYPES })
  type: AccountType;

  /** Saldo inicial em centavos (pode ser negativo). */
  @Prop({ required: true, default: 0 })
  initialBalance: number;

  @Prop({ required: true, default: '#34c759' })
  color: string;

  @Prop({ default: false })
  archived: boolean;
}

export type AccountDocument = HydratedDocument<Account>;
export const AccountSchema = SchemaFactory.createForClass(Account);
