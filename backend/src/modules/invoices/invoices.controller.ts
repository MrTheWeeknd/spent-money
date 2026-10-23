import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { parseYm, YearMonth } from '../../common/dates';
import { ParseIdPipe } from '../../common/pipes/parse-id.pipe';
import { InvoiceDatesDto, PayInvoiceDto } from './invoice-payment.dto';
import { InvoicesService } from './invoices.service';

function month(value: string): YearMonth {
  try {
    return parseYm(value);
  } catch {
    throw new BadRequestException('Mês deve estar no formato AAAA-MM');
  }
}

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Get()
  overview() {
    return this.invoices.overview();
  }

  /** :month = AAAA-MM do vencimento. */
  @Get(':cardId/:month')
  detail(@Param('cardId', ParseIdPipe) cardId: string, @Param('month') m: string) {
    return this.invoices.detail(cardId, month(m));
  }

  /** Registra um pagamento (total ou parcial) da fatura; devolve a fatura atualizada. */
  @Post(':cardId/:month/payments')
  pay(
    @Param('cardId', ParseIdPipe) cardId: string,
    @Param('month') m: string,
    @Body() dto: PayInvoiceDto,
  ) {
    return this.invoices.pay(cardId, month(m), dto);
  }

  /** Ajusta fechamento/vencimento reais desta fatura. */
  @Put(':cardId/:month/dates')
  setDates(
    @Param('cardId', ParseIdPipe) cardId: string,
    @Param('month') m: string,
    @Body() dto: InvoiceDatesDto,
  ) {
    return this.invoices.setDates(cardId, month(m), dto);
  }

  @Delete('payments/:id')
  @HttpCode(204)
  removePayment(@Param('id', ParseIdPipe) id: string) {
    return this.invoices.removePayment(id);
  }
}
