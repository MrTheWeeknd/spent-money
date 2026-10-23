import { Controller, Get, Header, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { formatLocalDate, todayLocal } from '../../common/dates';
import { ExportService } from './export.service';

const KINDS = ['lancamentos', 'parcelas', 'acertos'] as const;
type Kind = (typeof KINDS)[number];

@Controller('export')
export class ExportController {
  constructor(private readonly exporter: ExportService) {}

  @Get(':kind.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Cache-Control', 'no-store')
  async csv(@Param('kind') kind: string, @Res({ passthrough: true }) res: Response) {
    if (!KINDS.includes(kind as Kind)) throw new NotFoundException('Exportação não encontrada');
    const csv = await {
      lancamentos: () => this.exporter.transactionsCsv(),
      parcelas: () => this.exporter.installmentsCsv(),
      acertos: () => this.exporter.settlementsCsv(),
    }[kind as Kind]();
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${kind}-${formatLocalDate(todayLocal())}.csv"`,
    );
    return csv;
  }
}
