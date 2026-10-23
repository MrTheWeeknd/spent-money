import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { IsColor, IsName } from '../../common/validation/validators';

export class CreatePersonDto {
  @IsName('Nome')
  name: string;

  @IsColor()
  color: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  avatar?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Observação pode ter no máximo 200 caracteres' })
  note?: string;
}

export class UpdatePersonDto extends PartialType(CreatePersonDto) {}
