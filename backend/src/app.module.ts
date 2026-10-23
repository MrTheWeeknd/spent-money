import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { SeedModule } from './database/seed.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { AuthModule } from './modules/auth/auth.module';
import { BalancesModule } from './modules/balances/balances.module';
import { CardsModule } from './modules/cards/cards.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ExportModule } from './modules/export/export.module';
import { HealthController } from './modules/health/health.controller';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { PeopleModule } from './modules/people/people.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SettingsModule } from './modules/settings/settings.module';
import { SettlementsModule } from './modules/settlements/settlements.module';
import { TransactionsModule } from './modules/transactions/transactions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, validate: validateEnv }),
    DatabaseModule,
    AuthModule,
    CardsModule,
    PeopleModule,
    CategoriesModule,
    AccountsModule,
    TransactionsModule,
    InvoicesModule,
    SettlementsModule,
    BalancesModule,
    ReportsModule,
    ExportModule,
    SettingsModule,
    SeedModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
