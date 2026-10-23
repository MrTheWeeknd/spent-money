import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ParseIdPipe } from '../../common/pipes/parse-id.pipe';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './category.dto';
import { CATEGORY_TYPES, CategoryType } from './category.schema';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  list(@Query('type') type?: string) {
    return this.categories.list(
      CATEGORY_TYPES.includes(type as CategoryType) ? { type: type as CategoryType } : {},
    );
  }

  @Get(':id')
  get(@Param('id', ParseIdPipe) id: string) {
    return this.categories.get(id);
  }

  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.categories.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIdPipe) id: string, @Body() dto: UpdateCategoryDto) {
    return this.categories.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIdPipe) id: string) {
    return this.categories.remove(id);
  }
}
