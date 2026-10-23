import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../common/mongo/schema-options';

/** Preferências do app (documento único, key = "app"). */
@Schema(baseSchemaOptions)
export class AppSettings {
  @Prop({ required: true, unique: true, default: 'app' })
  key: string;

  /**
   * Dia em que o "meu mês" fecha (1–28). Ex.: 2 → ciclo de 03/10 a 02/11.
   * null = mês do calendário.
   */
  @Prop({ type: Number, min: 1, max: 28, default: null })
  cycleEndDay: number | null;
}

export type AppSettingsDocument = HydratedDocument<AppSettings>;
export const AppSettingsSchema = SchemaFactory.createForClass(AppSettings);
