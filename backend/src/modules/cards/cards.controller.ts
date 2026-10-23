import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ParseIdPipe } from '../../common/pipes/parse-id.pipe';
import { CreateCardDto, UpdateCardDto } from './card.dto';
import { CardsService } from './cards.service';

@Controller('cards')
export class CardsController {
  constructor(private readonly cards: CardsService) {}

  @Get()
  list(@Query('active') active?: string) {
    return this.cards.list(active === 'true' ? { active: true } : {});
  }

  @Get(':id')
  get(@Param('id', ParseIdPipe) id: string) {
    return this.cards.get(id);
  }

  @Post()
  create(@Body() dto: CreateCardDto) {
    return this.cards.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIdPipe) id: string, @Body() dto: UpdateCardDto) {
    return this.cards.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIdPipe) id: string) {
    return this.cards.remove(id);
  }
}
