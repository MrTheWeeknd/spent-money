import { NotFoundException } from '@nestjs/common';
import { HydratedDocument, Model, QueryFilter, SortOrder } from 'mongoose';

/** CRUD básico compartilhado pelos cadastros (cartões, pessoas, categorias, contas). */
export abstract class CrudService<T, TCreate, TUpdate = Partial<TCreate>> {
  protected abstract readonly notFoundMessage: string;
  protected readonly defaultSort: Record<string, SortOrder> = { name: 1 };

  constructor(protected readonly model: Model<T>) {}

  list(filter: QueryFilter<T> = {}): Promise<HydratedDocument<T>[]> {
    return this.model.find(filter).sort(this.defaultSort).collation({ locale: 'pt' }).exec();
  }

  async get(id: string): Promise<HydratedDocument<T>> {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException(this.notFoundMessage);
    return doc;
  }

  create(dto: TCreate): Promise<HydratedDocument<T>> {
    return this.model.create(dto as object) as unknown as Promise<HydratedDocument<T>>;
  }

  async update(id: string, dto: TUpdate): Promise<HydratedDocument<T>> {
    const doc = await this.get(id);
    doc.set(dto as object);
    return (await doc.save()) as HydratedDocument<T>;
  }

  async remove(id: string): Promise<void> {
    const doc = await this.get(id);
    await this.assertCanRemove(doc);
    await doc.deleteOne();
  }

  /** Sobrescreva para bloquear exclusão (ex.: registro em uso). */
  protected async assertCanRemove(_doc: HydratedDocument<T>): Promise<void> {}
}
