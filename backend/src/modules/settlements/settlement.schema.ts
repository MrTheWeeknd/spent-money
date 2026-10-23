import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { baseSchemaOptions } from '../../common/mongo/schema-options';

/** Acerto: quando um terceiro me paga o que gastou nos meus cartões. */
@Schema(baseSchemaOptions)
export class Settlement {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Person', required: true })
  personId: Types.ObjectId;

  /** Valor em centavos. */
  @Prop({ required: true, min: 1 })
  amount: number;

  @Prop({ required: true })
  date: Date;

  @Prop({ trim: true, maxlength: 200 })
  note?: string;
}

export type SettlementDocument = HydratedDocument<Settlement>;
export const SettlementSchema = SchemaFactory.createForClass(Settlement);
SettlementSchema.index({ personId: 1, date: -1 });
