import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BalancesModule } from '../balances/balances.module';
import { InstallmentsModule } from '../installments/installments.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { Person, PersonSchema } from '../people/person.schema';
import { TransactionsModule } from '../transactions/transactions.module';
import { SettingsModule } from '../settings/settings.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    InstallmentsModule,
    InvoicesModule,
    BalancesModule,
    TransactionsModule,
    SettingsModule,
    MongooseModule.forFeature([{ name: Person.name, schema: PersonSchema }]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
