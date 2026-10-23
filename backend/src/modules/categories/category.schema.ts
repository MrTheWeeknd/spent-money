import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../common/mongo/schema-options';

export const CATEGORY_TYPES = ['income', 'expense'] as const;
export type CategoryType = (typeof CATEGORY_TYPES)[number];

@Schema(baseSchemaOptions)
export class Category {
  @Prop({ required: true, trim: true, maxlength: 40 })
  name: string;

  /** Nome do ícone lucide em kebab-case (ex.: "shopping-cart"). */
  @Prop({ required: true, default: 'circle-ellipsis' })
  icon: string;

  @Prop({ required: true, default: '#8e8e93' })
  color: string;

  @Prop({ required: true, enum: CATEGORY_TYPES })
  type: CategoryType;

  /** Arquivada some das sugestões, mas continua nos lançamentos antigos. */
  @Prop({ default: false })
  archived: boolean;
}

export type CategoryDocument = HydratedDocument<Category>;
export const CategorySchema = SchemaFactory.createForClass(Category);
CategorySchema.index(
  { type: 1, name: 1 },
  { unique: true, collation: { locale: 'pt', strength: 1 } },
);
