import { Controller, Get, Param } from '@nestjs/common';
import { ParseIdPipe } from '../../common/pipes/parse-id.pipe';
import { BalancesService } from './balances.service';

@Controller('balances')
export class BalancesController {
  constructor(private readonly balances: BalancesService) {}

  @Get()
  list() {
    return this.balances.balances();
  }

  @Get(':personId/statement')
  statement(@Param('personId', ParseIdPipe) personId: string) {
    return this.balances.statement(personId);
  }
}
