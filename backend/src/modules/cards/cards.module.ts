import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InstallmentsModule } from '../installments/installments.module';
import { Card, CardSchema } from './card.schema';
import { CardsController } from './cards.controller';
import { CardsService } from './cards.service';

@Module({
  imports: [
    InstallmentsModule,
    MongooseModule.forFeature([{ name: Card.name, schema: CardSchema }]),
  ],
  controllers: [CardsController],
  providers: [CardsService],
  exports: [CardsService],
})
export class CardsModule {}
