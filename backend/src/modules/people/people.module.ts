import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Transaction, TransactionSchema } from '../transactions/transaction.schema';
import { Settlement, SettlementSchema } from '../settlements/settlement.schema';
import { PeopleController } from './people.controller';
import { PeopleService } from './people.service';
import { Person, PersonSchema } from './person.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Person.name, schema: PersonSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: Settlement.name, schema: SettlementSchema },
    ]),
  ],
  controllers: [PeopleController],
  providers: [PeopleService],
  exports: [PeopleService],
})
export class PeopleModule {}
