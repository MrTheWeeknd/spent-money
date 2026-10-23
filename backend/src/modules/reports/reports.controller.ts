import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Matches, Max, Min } from 'class-validator';
import { parseYm, todayLocal, YearMonth } from '../../common/dates';
import { TRANSACTION_TYPES, type TransactionType } from '../transactions/transaction.schema';
import { ReportsService } from './reports.service';

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

class MonthQuery {
  @IsOptional()
  @Matches(MONTH_RE, { message: 'Mês deve estar no formato AAAA-MM' })
  month?: string;
}

class MonthlyQuery extends MonthQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  months?: number;
}

class CategoriesQuery {
  @Matches(MONTH_RE, { message: 'Mês inicial deve estar no formato AAAA-MM' })
  from: string;

  @Matches(MONTH_RE, { message: 'Mês final deve estar no formato AAAA-MM' })
  to: string;

  @IsOptional()
  @IsIn(TRANSACTION_TYPES)
  type?: TransactionType;
}

const ym = (v?: string): YearMonth => (v ? parseYm(v) : todayLocal());

@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('dashboard')
  dashboard(@Query() q: MonthQuery) {
    return this.reports.dashboard(ym(q.month));
  }

  /** Balanço do ciclo "meu mês" (sem month: o ciclo de hoje). */
  @Get('cycle')
  cycle(@Query() q: MonthQuery) {
    return this.reports.cycle(q.month ? parseYm(q.month) : undefined);
  }

  @Get('monthly')
  monthly(@Query() q: MonthlyQuery) {
    return this.reports.monthly(q.months ?? 6, ym(q.month));
  }

  @Get('categories')
  categories(@Query() q: CategoriesQuery) {
    const from = parseYm(q.from);
    const to = parseYm(q.to);
    if (from.year * 100 + from.month > to.year * 100 + to.month) {
      throw new BadRequestException('Mês inicial deve ser antes do final');
    }
    return this.reports.categories(from, to, q.type ?? 'expense');
  }
}
