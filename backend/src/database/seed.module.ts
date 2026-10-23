import { Module } from '@nestjs/common';
import { AccountsModule } from '../modules/accounts/accounts.module';
import { CardsModule } from '../modules/cards/cards.module';
import { CategoriesModule } from '../modules/categories/categories.module';
import { InstallmentsModule } from '../modules/installments/installments.module';
import { PeopleModule } from '../modules/people/people.module';
import { SettlementsModule } from '../modules/settlements/settlements.module';
import { TransactionsModule } from '../modules/transactions/transactions.module';
import { DemoSeedService } from './demo-seed.service';
import { SeedService } from './seed.service';

@Module({
  imports: [
    PeopleModule,
    CategoriesModule,
    CardsModule,
    AccountsModule,
    TransactionsModule,
    SettlementsModule,
    InstallmentsModule,
  ],
  providers: [SeedService, DemoSeedService],
  exports: [SeedService, DemoSeedService],
})
export class SeedModule {}
