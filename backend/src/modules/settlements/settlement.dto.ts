import { Transform } from 'class-transformer';
import { IsMongoId, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';
import { IsCents } from '../../common/validation/validators';

export class CreateSettlementDto {
  @IsMongoId({ message: 'Escolha uma pessoa' })
  personId: string;

  @IsCents()
  @Min(1, { message: 'Informe um valor maior que zero' })
  amount: number;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Data deve estar no formato AAAA-MM-DD' })
  date: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(200, { message: 'Observação pode ter no máximo 200 caracteres' })
  note?: string;
}

export class ListSettlementsQuery {
  @IsOptional()
  @IsMongoId()
  personId?: string;
}
