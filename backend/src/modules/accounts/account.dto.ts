import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import { IsCents, IsColor, IsName } from '../../common/validation/validators';
import { ACCOUNT_TYPES, type AccountType } from './account.schema';

export class CreateAccountDto {
  @IsName('Nome')
  name: string;

  @IsIn(ACCOUNT_TYPES, { message: 'Tipo de conta inválido' })
  type: AccountType;

  @IsCents({ allowNegative: true })
  initialBalance: number;

  @IsColor()
  color: string;

  @IsOptional()
  @IsBoolean()
  archived?: boolean;
}

export class UpdateAccountDto extends PartialType(CreateAccountDto) {}
