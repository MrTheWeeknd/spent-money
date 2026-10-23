import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsIn, IsOptional, IsString, Matches } from 'class-validator';
import { IsColor, IsName } from '../../common/validation/validators';
import { CATEGORY_TYPES, type CategoryType } from './category.schema';

export class CreateCategoryDto {
  @IsName('Nome')
  name: string;

  @IsString()
  @Matches(/^[a-z0-9-]{1,40}$/, { message: 'Ícone inválido' })
  icon: string;

  @IsColor()
  color: string;

  @IsIn(CATEGORY_TYPES, { message: 'Tipo deve ser receita ou despesa' })
  type: CategoryType;

  @IsOptional()
  @IsBoolean()
  archived?: boolean;
}

// O tipo não muda depois de criada, para não bagunçar lançamentos existentes.
export class UpdateCategoryDto extends PartialType(
  OmitType(CreateCategoryDto, ['type'] as const),
) {}
