import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, Types } from 'mongoose';
import {
  addMonths,
  compareLocal,
  LocalDate,
  monthRange,
  parseLocalDate,
  parseYm,
  storedDate,
  toLocalDate,
  todayLocal,
} from '../../common/dates';
import { Account } from '../accounts/account.schema';
import { Card } from '../cards/card.schema';
import { Category } from '../categories/category.schema';
import { InstallmentsService } from '../installments/installments.service';
import { Person } from '../people/person.schema';
import {
  CreateTransactionDto,
  ListTransactionsQuery,
  UpdateTransactionDto,
} from './transaction.dto';
import { monthlyDates, RECURRENCE_HORIZON_MONTHS } from './recurrence';
import { Transaction, TransactionDocument, TransactionStatus } from './transaction.schema';

type Scope = 'one' | 'future';

/** Campos que valem para todas as ocorrências de uma recorrência. */
type SharedFields = Pick<
  Transaction,
  | 'type'
  | 'amount'
  | 'description'
  | 'categoryId'
  | 'personId'
  | 'method'
  | 'cardId'
  | 'accountId'
  | 'installments'
  | 'note'
  | 'tags'
>;

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);
  private horizonCheckedAt = 0;

  constructor(
    @InjectModel(Transaction.name) private readonly model: Model<Transaction>,
    @InjectModel(Category.name) private readonly categories: Model<Category>,
    @InjectModel(Person.name) private readonly people: Model<Person>,
    @InjectModel(Card.name) private readonly cards: Model<Card>,
    @InjectModel(Account.name) private readonly accounts: Model<Account>,
    private readonly installments: InstallmentsService,
  ) {}

  // ---------- Leitura ----------

  async list(q: ListTransactionsQuery): Promise<TransactionDocument[]> {
    await this.ensureRecurrenceHorizon();
    const filter: QueryFilter<Transaction> = {};
    if (q.month || !q.q) {
      const { start, end } = monthRange(q.month ? parseYm(q.month) : todayLocal());
      filter.date = { $gte: start, $lt: end };
    }
    if (q.type) filter.type = q.type;
    if (q.status) filter.status = q.status;
    if (q.method) filter.method = q.method;
    if (q.cardId) filter.cardId = new Types.ObjectId(q.cardId);
    if (q.personId) filter.personId = new Types.ObjectId(q.personId);
    if (q.categoryId) filter.categoryId = new Types.ObjectId(q.categoryId);
    if (q.accountId) filter.accountId = new Types.ObjectId(q.accountId);
    if (q.recurring) filter['recurrence.groupId'] = { $exists: true };
    if (q.q) {
      const re = new RegExp(escapeRegex(q.q), 'i');
      filter.$or = [{ description: re }, { note: re }, { tags: re }];
    }
    return this.model
      .find(filter)
      .sort({ date: -1, createdAt: -1 })
      .limit(q.limit ?? (q.month || !q.q ? 1000 : 200))
      .exec();
  }

  async get(id: string): Promise<TransactionDocument> {
    const doc = await this.model.findById(id).exec();
    if (!doc) throw new NotFoundException('Lançamento não encontrado');
    return doc;
  }

  /** Últimos meios/pessoa/categoria usados e histórico de descrições (para o lançamento rápido). */
  async defaults() {
    const recent = this.model.aggregate([{ $sort: { createdAt: -1 } }, { $limit: 500 }]);
    const [last, descriptions, usage] = await Promise.all([
      this.model.aggregate([
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: '$type',
            method: { $first: '$method' },
            cardId: { $first: '$cardId' },
            accountId: { $first: '$accountId' },
            personId: { $first: '$personId' },
            categoryId: { $first: '$categoryId' },
          },
        },
      ]),
      this.model.aggregate([
        { $match: { description: { $ne: '' } } },
        { $sort: { createdAt: -1 } },
        { $limit: 1000 },
        {
          $group: {
            _id: { type: '$type', d: { $toLower: '$description' } },
            description: { $first: '$description' },
            categoryId: { $first: '$categoryId' },
            count: { $sum: 1 },
            last: { $first: '$createdAt' },
          },
        },
        { $sort: { count: -1, last: -1 } },
        { $limit: 150 },
        { $project: { _id: 0, type: '$_id.type', description: 1, categoryId: 1, count: 1 } },
      ]),
      recent.append({
        $facet: {
          categories: [{ $group: { _id: '$categoryId', n: { $sum: 1 } } }],
          people: [{ $group: { _id: '$personId', n: { $sum: 1 } } }],
          cards: [
            { $match: { cardId: { $ne: null } } },
            { $group: { _id: '$cardId', n: { $sum: 1 } } },
          ],
        },
      }),
    ]);
    const counts = (rows: { _id: Types.ObjectId; n: number }[]) =>
      Object.fromEntries(rows.map((r) => [String(r._id), r.n]));
    const facet = usage[0] ?? { categories: [], people: [], cards: [] };
    const byType = Object.fromEntries(
      last.map(({ _id, ...rest }) => [
        _id,
        Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, v == null ? null : String(v)])),
      ]),
    );
    return {
      last: { expense: byType.expense ?? null, income: byType.income ?? null },
      descriptions: descriptions.map((d) => ({ ...d, categoryId: String(d.categoryId) })),
      usage: {
        categories: counts(facet.categories),
        people: counts(facet.people),
        cards: counts(facet.cards),
      },
    };
  }

  // ---------- Escrita ----------

  async create(dto: CreateTransactionDto): Promise<TransactionDocument> {
    const shared = await this.normalize(dto);
    const date = this.parseDate(dto.date);
    const today = todayLocal();
    const defaultStatus = (d: LocalDate): TransactionStatus =>
      compareLocal(d, today) > 0 ? 'planned' : 'confirmed';

    if (!dto.recurring) {
      const doc = await this.model.create({
        ...shared,
        date: storedDate(date),
        status: dto.status ?? defaultStatus(date),
      });
      await this.installments.syncFor([doc]);
      return doc;
    }

    // Recorrente: gera esta ocorrência e as dos próximos meses como "previsto".
    const groupId = new Types.ObjectId().toString();
    const until = addMonths(today, RECURRENCE_HORIZON_MONTHS - 1);
    const dates = [date, ...monthlyDates(date, date.day, until, true)];
    const docs = await this.model.insertMany(
      dates.map((d, i) => ({
        ...shared,
        installments: 1,
        date: storedDate(d),
        status: i === 0 ? (dto.status ?? defaultStatus(d)) : 'planned',
        recurrence: { groupId, frequency: 'monthly', day: date.day, stopped: false },
      })),
    );
    await this.installments.syncFor(docs as TransactionDocument[]);
    return docs[0] as TransactionDocument;
  }

  async update(
    id: string,
    dto: UpdateTransactionDto,
    scope: Scope = 'one',
  ): Promise<TransactionDocument> {
    const tx = await this.get(id);
    const current = this.sharedOf(tx);
    const merged = await this.normalize({
      ...current,
      categoryId: String(current.categoryId),
      personId: String(current.personId),
      cardId: current.cardId ? String(current.cardId) : null,
      accountId: current.accountId ? String(current.accountId) : null,
      ...dto,
    });
    if (tx.recurrence) merged.installments = 1;

    // Para as próximas ocorrências, só propaga o que foi enviado (mudar o meio leva cartão/conta junto).
    const sent = new Set(Object.keys(dto));
    if (sent.has('method') || sent.has('cardId'))
      ['cardId', 'accountId', 'installments'].forEach((k) => sent.add(k));
    const changed = Object.fromEntries(
      (Object.keys(merged) as (keyof SharedFields)[])
        .filter((k) => sent.has(k))
        .map((k) => [k, merged[k]]),
    );

    const originalDate = tx.date;
    tx.set(merged);
    if (dto.date) tx.date = storedDate(this.parseDate(dto.date));
    if (dto.status) tx.status = dto.status;
    const targets: TransactionDocument[] = [tx];

    if (scope === 'future' && tx.recurrence) {
      const later = await this.model.find({
        'recurrence.groupId': tx.recurrence.groupId,
        _id: { $ne: tx._id },
        date: { $gt: originalDate },
      });
      for (const doc of later) doc.set(changed);
      targets.push(...later);
    }

    await Promise.all(targets.map((d) => d.save()));
    await this.installments.syncFor(targets);
    return tx;
  }

  async remove(id: string, scope: Scope = 'one'): Promise<{ deleted: number }> {
    const tx = await this.get(id);
    const ids: Types.ObjectId[] = [tx._id];

    if (scope === 'future' && tx.recurrence) {
      const later = await this.model
        .find({ 'recurrence.groupId': tx.recurrence.groupId, date: { $gt: tx.date } }, { _id: 1 })
        .lean();
      ids.push(...later.map((d) => d._id));
      // As ocorrências anteriores continuam, mas a recorrência para de gerar novas.
      await this.model.updateMany(
        { 'recurrence.groupId': tx.recurrence.groupId },
        { $set: { 'recurrence.stopped': true } },
      );
    }

    await this.model.deleteMany({ _id: { $in: ids } });
    await this.installments.removeFor(ids);
    return { deleted: ids.length };
  }

  /**
   * Mantém as recorrências ativas geradas até o horizonte (12 meses à frente).
   * Roda no máximo a cada 10 minutos por instância; é idempotente.
   */
  async ensureRecurrenceHorizon(force = false): Promise<void> {
    if (!force && Date.now() - this.horizonCheckedAt < 10 * 60_000) return;
    this.horizonCheckedAt = Date.now();
    try {
      const until = addMonths(todayLocal(), RECURRENCE_HORIZON_MONTHS - 1);
      const groups: { last: Transaction & { _id: Types.ObjectId } }[] = await this.model.aggregate([
        {
          $match: { 'recurrence.groupId': { $exists: true }, 'recurrence.stopped': { $ne: true } },
        },
        { $sort: { date: 1 } },
        { $group: { _id: '$recurrence.groupId', last: { $last: '$$ROOT' } } },
      ]);
      const created: TransactionDocument[] = [];
      for (const { last } of groups) {
        const dates = monthlyDates(toLocalDate(last.date), last.recurrence!.day, until, true);
        if (!dates.length) continue;
        const docs = await this.model.insertMany(
          dates.map((d) => ({
            ...this.sharedOf(last),
            date: storedDate(d),
            status: 'planned',
            recurrence: last.recurrence,
          })),
        );
        created.push(...(docs as TransactionDocument[]));
      }
      if (created.length) {
        await this.installments.syncFor(created);
        this.logger.log(`Recorrências: ${created.length} lançamentos previstos gerados`);
      }
    } catch (e) {
      this.horizonCheckedAt = 0;
      this.logger.error('Falha ao gerar recorrências', e);
    }
  }

  // ---------- Regras ----------

  private sharedOf(tx: Transaction): SharedFields {
    return {
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      categoryId: tx.categoryId,
      personId: tx.personId,
      method: tx.method,
      cardId: tx.cardId,
      accountId: tx.accountId,
      installments: tx.installments,
      note: tx.note,
      tags: tx.tags,
    };
  }

  private parseDate(value: string): LocalDate {
    try {
      return parseLocalDate(value);
    } catch {
      throw new BadRequestException('Data inválida');
    }
  }

  /** Valida referências e regras entre campos; devolve os campos prontos para salvar. */
  private async normalize(
    dto: Omit<CreateTransactionDto, 'date'> & { date?: string },
  ): Promise<SharedFields> {
    const isCredit = dto.method === 'credit_card';
    if (dto.type === 'income' && isCredit) {
      throw new BadRequestException('Receitas não podem ser lançadas no cartão de crédito');
    }
    if (isCredit && !dto.cardId) throw new BadRequestException('Escolha o cartão');

    const [category, person, card, account] = await Promise.all([
      this.categories.findById(dto.categoryId).lean(),
      this.people.exists({ _id: dto.personId }),
      isCredit ? this.cards.exists({ _id: dto.cardId }) : null,
      dto.accountId && !isCredit ? this.accounts.exists({ _id: dto.accountId }) : null,
    ]);
    if (!category) throw new BadRequestException('Categoria não encontrada');
    if (category.type !== dto.type) {
      throw new BadRequestException(
        dto.type === 'income'
          ? 'Escolha uma categoria de receita'
          : 'Escolha uma categoria de despesa',
      );
    }
    if (!person) throw new BadRequestException('Pessoa não encontrada');
    if (isCredit && !card) throw new BadRequestException('Cartão não encontrado');
    if (dto.accountId && !isCredit && !account)
      throw new BadRequestException('Conta não encontrada');

    return {
      type: dto.type,
      amount: dto.amount,
      description: dto.description ?? '',
      categoryId: new Types.ObjectId(dto.categoryId),
      personId: new Types.ObjectId(dto.personId),
      method: dto.method,
      cardId: isCredit ? new Types.ObjectId(dto.cardId!) : undefined,
      accountId: !isCredit && dto.accountId ? new Types.ObjectId(dto.accountId) : undefined,
      installments: isCredit ? (dto.installments ?? 1) : 1,
      note: dto.note || undefined,
      tags: [...new Set((dto.tags ?? []).map((t) => t.trim()).filter(Boolean))],
    };
  }
}
