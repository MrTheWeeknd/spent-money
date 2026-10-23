import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Account, AccountSchema } from '../accounts/account.schema';
import { Category, CategorySchema } from '../categories/category.schema';
import { InstallmentsModule } from '../installments/installments.module';
import { Person, PersonSchema } from '../people/person.schema';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

@Module({
  imports: [
    InstallmentsModule,
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: Person.name, schema: PersonSchema },
      { name: Account.name, schema: AccountSchema },
    ]),
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
