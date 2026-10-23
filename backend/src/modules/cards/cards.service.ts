import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { CrudService } from '../../common/crud/crud.service';
import { InstallmentsService } from '../installments/installments.service';
import { InvoiceDatesOverride } from '../installments/invoice-dates.schema';
import { Transaction } from '../transactions/transaction.schema';
import { CreateCardDto, UpdateCardDto } from './card.dto';
import { Card, CardDocument } from './card.schema';

@Injectable()
export class CardsService extends CrudService<Card, CreateCardDto, UpdateCardDto> {
  protected readonly notFoundMessage = 'Cartão não encontrado';
  protected readonly defaultSort = { active: -1 as const, name: 1 as const };

  constructor(
    @InjectModel(Card.name) model: Model<Card>,
    @InjectModel(Transaction.name) private readonly transactions: Model<Transaction>,
    private readonly installments: InstallmentsService,
    @InjectModel(InvoiceDatesOverride.name)
    private readonly invoiceDates: Model<InvoiceDatesOverride>,
  ) {
    super(model);
  }

  async update(id: string, dto: UpdateCardDto): Promise<HydratedDocument<Card>> {
    const before = await this.get(id);
    const cycleChanged =
      (dto.closingDay !== undefined && dto.closingDay !== before.closingDay) ||
      (dto.dueDay !== undefined && dto.dueDay !== before.dueDay);
    const card = await super.update(id, dto);
    if (cycleChanged) await this.installments.recomputeForCard(id);
    return card;
  }

  async remove(id: string): Promise<void> {
    await super.remove(id);
    // Ajustes de datas das faturas deste cartão não servem mais.
    await this.invoiceDates.deleteMany({ cardId: id });
  }

  protected async assertCanRemove(doc: CardDocument) {
    if (await this.transactions.exists({ cardId: doc._id })) {
      throw new ConflictException('Este cartão tem lançamentos. Desative-o em vez de excluir.');
    }
  }
}
