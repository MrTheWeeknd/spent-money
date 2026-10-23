import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { IsCents } from '../../common/validation/validators';
import {
  MAX_INSTALLMENTS,
  PAYMENT_METHODS,
  TRANSACTION_STATUSES,
  TRANSACTION_TYPES,
  type PaymentMethod,
  type TransactionStatus,
  type TransactionType,
} from './transaction.schema';

const trim = Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export class CreateTransactionDto {
  @IsIn(TRANSACTION_TYPES, { message: 'Tipo deve ser receita ou despesa' })
  type: TransactionType;

  @IsCents()
  @Min(1, { message: 'Informe um valor maior que zero' })
  amount: number;

  @IsOptional()
  @trim
  @IsString()
  @MaxLength(120, { message: 'Descrição pode ter no máximo 120 caracteres' })
  description?: string;

  /** Dia local no formato AAAA-MM-DD. */
  @Matches(DATE_RE, { message: 'Data deve estar no formato AAAA-MM-DD' })
  date: string;

  @IsMongoId({ message: 'Escolha uma categoria' })
  categoryId: string;

  @IsMongoId({ message: 'Escolha uma pessoa' })
  personId: string;

  @IsIn(PAYMENT_METHODS, { message: 'Meio de pagamento inválido' })
  method: PaymentMethod;

  @IsOptional()
  @IsMongoId({ message: 'Cartão inválido' })
  cardId?: string | null;

  @IsOptional()
  @IsMongoId({ message: 'Conta inválida' })
  accountId?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1, { message: 'Parcelas devem ser entre 1 e ' + MAX_INSTALLMENTS })
  @Max(MAX_INSTALLMENTS, { message: 'Parcelas devem ser entre 1 e ' + MAX_INSTALLMENTS })
  installments?: number;

  @IsOptional()
  @IsBoolean()
  recurring?: boolean;

  @IsOptional()
  @IsIn(TRANSACTION_STATUSES)
  status?: TransactionStatus;

  @IsOptional()
  @trim
  @IsString()
  @MaxLength(500, { message: 'Observação pode ter no máximo 500 caracteres' })
  note?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10, { message: 'Use no máximo 10 tags' })
  @IsString({ each: true })
  @MaxLength(30, { each: true, message: 'Cada tag pode ter no máximo 30 caracteres' })
  tags?: string[];
}

export class UpdateTransactionDto extends PartialType(
  OmitType(CreateTransactionDto, ['recurring'] as const),
) {}

export class ScopeQuery {
  /** one = só este lançamento; future = este e os próximos da recorrência. */
  @IsOptional()
  @IsIn(['one', 'future'])
  scope?: 'one' | 'future';
}

export class ListTransactionsQuery {
  @IsOptional()
  @Matches(MONTH_RE, { message: 'Mês deve estar no formato AAAA-MM' })
  month?: string;

  @IsOptional()
  @IsIn(TRANSACTION_TYPES)
  type?: TransactionType;

  @IsOptional()
  @IsIn(TRANSACTION_STATUSES)
  status?: TransactionStatus;

  @IsOptional()
  @IsIn(PAYMENT_METHODS)
  method?: PaymentMethod;

  @IsOptional()
  @IsMongoId()
  cardId?: string;

  @IsOptional()
  @IsMongoId()
  personId?: string;

  @IsOptional()
  @IsMongoId()
  categoryId?: string;

  @IsOptional()
  @IsMongoId()
  accountId?: string;

  /** Busca na descrição/observação. Sem mês, busca em todo o histórico. */
  @IsOptional()
  @trim
  @IsString()
  @MaxLength(60)
  q?: string;

  /** Só recorrentes. */
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  recurring?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;
}
