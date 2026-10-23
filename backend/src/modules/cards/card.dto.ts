import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, Matches } from 'class-validator';
import { IsCents, IsColor, IsDayOfMonth, IsName } from '../../common/validation/validators';
import { CARD_BRANDS, type CardBrand } from './card.schema';

export class CreateCardDto {
  @IsName('Nome')
  name: string;

  @IsIn(CARD_BRANDS, { message: 'Bandeira inválida' })
  brand: CardBrand;

  /** Opcional; vazio remove. */
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  @Matches(/^\d{4}$/, { message: 'Informe apenas os 4 últimos dígitos' })
  last4?: string | null;

  @IsColor()
  color: string;

  @IsDayOfMonth('Dia de fechamento')
  closingDay: number;

  @IsDayOfMonth('Dia de vencimento')
  dueDay: number;

  @IsOptional()
  @IsCents()
  limit?: number | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateCardDto extends PartialType(CreateCardDto) {}
