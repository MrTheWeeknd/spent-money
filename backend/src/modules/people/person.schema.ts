import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../common/mongo/schema-options';

@Schema(baseSchemaOptions)
export class Person {
  @Prop({ required: true, trim: true, maxlength: 40 })
  name: string;

  @Prop({ required: true, default: '#8e8e93' })
  color: string;

  /** Emoji opcional exibido no avatar no lugar das iniciais. */
  @Prop({ trim: true, maxlength: 8 })
  avatar?: string;

  @Prop({ trim: true, maxlength: 200 })
  note?: string;

  /** A pessoa "Eu" (dono do app). Única e não pode ser excluída. */
  @Prop({ default: false })
  isSelf: boolean;
}

export type PersonDocument = HydratedDocument<Person>;
export const PersonSchema = SchemaFactory.createForClass(Person);
PersonSchema.index({ isSelf: 1 }, { unique: true, partialFilterExpression: { isSelf: true } });
