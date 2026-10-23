import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Person, PersonSchema } from '../people/person.schema';
import { Settlement, SettlementSchema } from './settlement.schema';
import { SettlementsController } from './settlements.controller';
import { SettlementsService } from './settlements.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Settlement.name, schema: SettlementSchema },
      { name: Person.name, schema: PersonSchema },
    ]),
  ],
  controllers: [SettlementsController],
  providers: [SettlementsService],
  exports: [SettlementsService, MongooseModule],
})
export class SettlementsModule {}
