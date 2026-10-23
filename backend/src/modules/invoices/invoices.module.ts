import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Account, AccountSchema } from '../accounts/account.schema';
import { InstallmentsModule } from '../installments/installments.module';
import { InvoicePayment, InvoicePaymentSchema } from './invoice-payment.schema';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

@Module({
  imports: [
    InstallmentsModule,
    MongooseModule.forFeature([
      { name: InvoicePayment.name, schema: InvoicePaymentSchema },
      { name: Account.name, schema: AccountSchema },
    ]),
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
