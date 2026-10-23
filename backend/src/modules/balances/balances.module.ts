import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InstallmentsModule } from '../installments/installments.module';
import { Person, PersonSchema } from '../people/person.schema';
import { SettlementsModule } from '../settlements/settlements.module';
import { BalancesController } from './balances.controller';
import { BalancesService } from './balances.service';

@Module({
  imports: [
    InstallmentsModule,
    SettlementsModule,
    MongooseModule.forFeature([{ name: Person.name, schema: PersonSchema }]),
  ],
  controllers: [BalancesController],
  providers: [BalancesService],
  exports: [BalancesService],
})
export class BalancesModule {}
