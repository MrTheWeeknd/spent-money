import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Card, CardSchema } from '../cards/card.schema';
import { Transaction, TransactionSchema } from '../transactions/transaction.schema';
import { Installment, InstallmentSchema } from './installment.schema';
import { InstallmentsService } from './installments.service';
import { InvoiceDatesOverride, InvoiceDatesOverrideSchema } from './invoice-dates.schema';
import { InvoiceDatesService } from './invoice-dates.service';

/** Só depende de schemas, para poder ser usado por cartões e transações sem ciclo. */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Installment.name, schema: InstallmentSchema },
      { name: Card.name, schema: CardSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: InvoiceDatesOverride.name, schema: InvoiceDatesOverrideSchema },
    ]),
  ],
  providers: [InstallmentsService, InvoiceDatesService],
  exports: [InstallmentsService, InvoiceDatesService, MongooseModule],
})
export class InstallmentsModule {}
