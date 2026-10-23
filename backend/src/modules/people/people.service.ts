import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CrudService } from '../../common/crud/crud.service';
import { Transaction } from '../transactions/transaction.schema';
import { Settlement } from '../settlements/settlement.schema';
import { CreatePersonDto, UpdatePersonDto } from './person.dto';
import { Person, PersonDocument } from './person.schema';

@Injectable()
export class PeopleService extends CrudService<Person, CreatePersonDto, UpdatePersonDto> {
  protected readonly notFoundMessage = 'Pessoa não encontrada';
  protected readonly defaultSort = { isSelf: -1 as const, name: 1 as const };

  constructor(
    @InjectModel(Person.name) model: Model<Person>,
    @InjectModel(Transaction.name) private readonly transactions: Model<Transaction>,
    @InjectModel(Settlement.name) private readonly settlements: Model<Settlement>,
  ) {
    super(model);
  }

  protected async assertCanRemove(doc: PersonDocument) {
    if (doc.isSelf) throw new BadRequestException('A pessoa "Eu" não pode ser excluída');
    const [tx, settlement] = await Promise.all([
      this.transactions.exists({ personId: doc._id }),
      this.settlements.exists({ personId: doc._id }),
    ]);
    if (tx || settlement)
      throw new ConflictException(
        'Esta pessoa tem lançamentos ou acertos e não pode ser excluída.',
      );
  }

  /** Garante que a pessoa "Eu" existe. Idempotente. */
  async ensureSelf(): Promise<void> {
    await this.model.updateOne(
      { isSelf: true },
      { $setOnInsert: { name: 'Eu', color: '#007aff', isSelf: true } },
      { upsert: true },
    );
  }
}
