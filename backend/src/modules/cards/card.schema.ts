import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../common/mongo/schema-options';

export const CARD_BRANDS = ['visa', 'mastercard', 'elo', 'amex', 'hipercard', 'other'] as const;
export type CardBrand = (typeof CARD_BRANDS)[number];

// Nunca armazenar número completo, CVV ou validade: apenas apelido, bandeira e final.
@Schema(baseSchemaOptions)
export class Card {
  @Prop({ required: true, trim: true, maxlength: 40 })
  name: string;

  @Prop({ required: true, enum: CARD_BRANDS })
  brand: CardBrand;

  /** Opcional: só para identificar o cartão. */
  @Prop({ match: /^\d{4}$/ })
  last4?: string;

  @Prop({ required: true, default: '#1c1c1e' })
  color: string;

  @Prop({ required: true, min: 1, max: 31 })
  closingDay: number;

  @Prop({ required: true, min: 1, max: 31 })
  dueDay: number;

  /** Limite em centavos. */
  @Prop({ min: 0 })
  limit?: number;

  @Prop({ default: true })
  active: boolean;
}

export type CardDocument = HydratedDocument<Card>;
export const CardSchema = SchemaFactory.createForClass(Card);
CardSchema.index({ active: 1, name: 1 });
