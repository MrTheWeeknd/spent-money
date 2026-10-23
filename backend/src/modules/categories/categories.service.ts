import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CrudService } from '../../common/crud/crud.service';
import { Transaction } from '../transactions/transaction.schema';
import { CreateCategoryDto, UpdateCategoryDto } from './category.dto';
import { Category, CategoryDocument } from './category.schema';
import { DEFAULT_CATEGORIES } from './default-categories';

@Injectable()
export class CategoriesService extends CrudService<Category, CreateCategoryDto, UpdateCategoryDto> {
  protected readonly notFoundMessage = 'Categoria não encontrada';
  protected readonly defaultSort = { type: 1 as const, archived: 1 as const, name: 1 as const };

  constructor(
    @InjectModel(Category.name) model: Model<Category>,
    @InjectModel(Transaction.name) private readonly transactions: Model<Transaction>,
  ) {
    super(model);
  }

  protected async assertCanRemove(doc: CategoryDocument) {
    if (await this.transactions.exists({ categoryId: doc._id })) {
      throw new ConflictException('Esta categoria tem lançamentos. Arquive-a em vez de excluir.');
    }
  }

  /** Cria as categorias padrão só quando não há nenhuma (não recria as que você apagar). */
  async ensureDefaults(): Promise<void> {
    if ((await this.model.estimatedDocumentCount()) > 0) return;
    await this.model.insertMany(DEFAULT_CATEGORIES, { ordered: false }).catch((e) => {
      if (e?.code !== 11000) throw e; // corrida entre duas inicializações
    });
  }
}
