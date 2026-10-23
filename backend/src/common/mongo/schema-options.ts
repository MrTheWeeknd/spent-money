import { SchemaOptions } from '@nestjs/mongoose';

/** Opções padrão: timestamps e JSON com `id` no lugar de `_id`/`__v`. */
export const baseSchemaOptions: SchemaOptions = {
  timestamps: true,
  toJSON: {
    versionKey: false,
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = String(ret._id);
      delete ret._id;
      return ret;
    },
  },
};
