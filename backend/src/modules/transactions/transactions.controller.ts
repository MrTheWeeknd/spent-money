import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ParseIdPipe } from '../../common/pipes/parse-id.pipe';
import {
  CreateTransactionDto,
  ListTransactionsQuery,
  ScopeQuery,
  UpdateTransactionDto,
} from './transaction.dto';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  @Get()
  list(@Query() query: ListTransactionsQuery) {
    return this.transactions.list(query);
  }

  @Get('defaults')
  defaults() {
    return this.transactions.defaults();
  }

  @Get(':id')
  get(@Param('id', ParseIdPipe) id: string) {
    return this.transactions.get(id);
  }

  @Post()
  create(@Body() dto: CreateTransactionDto) {
    return this.transactions.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIdPipe) id: string,
    @Body() dto: UpdateTransactionDto,
    @Query() { scope }: ScopeQuery,
  ) {
    return this.transactions.update(id, dto, scope);
  }

  @Delete(':id')
  remove(@Param('id', ParseIdPipe) id: string, @Query() { scope }: ScopeQuery) {
    return this.transactions.remove(id, scope);
  }
}
