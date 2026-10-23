import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CrudService } from '../../common/crud/crud.service';
import { Transaction } from '../transactions/transaction.schema';
import { CreateAccountDto, UpdateAccountDto } from './account.dto';
import { Account, AccountDocument } from './account.schema';

@Injectable()
export class AccountsService extends CrudService<Account, CreateAccountDto, UpdateAccountDto> {
  protected readonly notFoundMessage = 'Conta não encontrada';
  protected readonly defaultSort = { archived: 1 as const, name: 1 as const };

  constructor(
    @InjectModel(Account.name) model: Model<Account>,
    @InjectModel(Transaction.name) private readonly transactions: Model<Transaction>,
  ) {
    super(model);
  }

  protected async assertCanRemove(doc: AccountDocument) {
    if (await this.transactions.exists({ accountId: doc._id })) {
      throw new ConflictException('Esta conta tem lançamentos. Arquive-a em vez de excluir.');
    }
  }
}
