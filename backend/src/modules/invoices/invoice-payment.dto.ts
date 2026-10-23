import { Transform } from 'class-transformer';
import { IsMongoId, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';
import { IsCents } from '../../common/validation/validators';

export class PayInvoiceDto {
  @IsCents()
  @Min(1, { message: 'Informe um valor maior que zero' })
  amount: number;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Data deve estar no formato AAAA-MM-DD' })
  date: string;

  @IsOptional()
  @IsMongoId({ message: 'Conta inválida' })
  accountId?: string | null;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(200, { message: 'Observação pode ter no máximo 200 caracteres' })
  note?: string;
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Datas reais de uma fatura. null volta ao dia do cartão; ausente mantém como está. */
export class InvoiceDatesDto {
  @IsOptional()
  @Matches(DAY, { message: 'Data de fechamento deve estar no formato AAAA-MM-DD' })
  closingDate?: string | null;

  @IsOptional()
  @Matches(DAY, { message: 'Data de vencimento deve estar no formato AAAA-MM-DD' })
  dueDate?: string | null;
}
