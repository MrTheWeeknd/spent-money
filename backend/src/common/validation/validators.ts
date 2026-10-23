import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

/** Texto obrigatório, com espaços nas pontas removidos. */
export const IsName = (label: string, max = 40) =>
  applyDecorators(
    Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)),
    IsString(),
    IsNotEmpty({ message: `${label} é obrigatório` }),
    MaxLength(max, { message: `${label} pode ter no máximo ${max} caracteres` }),
  );

export const IsColor = () =>
  applyDecorators(
    IsString(),
    Matches(/^#[0-9a-fA-F]{6}$/, { message: 'Cor inválida (use #RRGGBB)' }),
  );

/** Valor monetário em centavos (inteiro). */
export const IsCents = (opts: { allowNegative?: boolean } = {}) =>
  applyDecorators(
    IsInt({ message: 'Valor deve estar em centavos (inteiro)' }),
    ...(opts.allowNegative ? [] : [Min(0, { message: 'Valor não pode ser negativo' })]),
    Max(100_000_000_00, { message: 'Valor alto demais' }),
  );

export const IsDayOfMonth = (label: string) =>
  applyDecorators(
    IsInt({ message: `${label} deve ser um dia (1–31)` }),
    Min(1, { message: `${label} deve ser um dia (1–31)` }),
    Max(31, { message: `${label} deve ser um dia (1–31)` }),
  );
