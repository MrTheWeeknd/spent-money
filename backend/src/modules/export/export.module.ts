import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Account, AccountSchema } from '../accounts/account.schema';
import { Category, CategorySchema } from '../categories/category.schema';
import { InstallmentsModule } from '../installments/installments.module';
import { Person, PersonSchema } from '../people/person.schema';
import { SettlementsModule } from '../settlements/settlements.module';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';

@Module({
  imports: [
    InstallmentsModule,
    SettlementsModule,
    MongooseModule.forFeature([
      { name: Person.name, schema: PersonSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Account.name, schema: AccountSchema },
    ]),
  ],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
