import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ParseIdPipe } from '../../common/pipes/parse-id.pipe';
import { CreateSettlementDto, ListSettlementsQuery } from './settlement.dto';
import { SettlementsService } from './settlements.service';

@Controller('settlements')
export class SettlementsController {
  constructor(private readonly settlements: SettlementsService) {}

  @Get()
  list(@Query() { personId }: ListSettlementsQuery) {
    return this.settlements.list(personId);
  }

  @Post()
  create(@Body() dto: CreateSettlementDto) {
    return this.settlements.create(dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIdPipe) id: string) {
    return this.settlements.remove(id);
  }
}
