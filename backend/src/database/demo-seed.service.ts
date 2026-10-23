import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { addMonths, clampDay, formatLocalDate, todayLocal } from '../common/dates';
import { AccountsService } from '../modules/accounts/accounts.service';
import { CardsService } from '../modules/cards/cards.service';
import { CategoriesService } from '../modules/categories/categories.service';
import { PeopleService } from '../modules/people/people.service';
import { SettlementsService } from '../modules/settlements/settlements.service';
import { Transaction } from '../modules/transactions/transaction.schema';
import { TransactionsService } from '../modules/transactions/transactions.service';

/**
 * Dados de exemplo para testar a interface. Cadastros são criados por nome (sem duplicar);
 * lançamentos só são criados quando o banco ainda não tem nenhum.
 */
@Injectable()
export class DemoSeedService {
  private readonly logger = new Logger('DemoSeed');

  constructor(
    private readonly cards: CardsService,
    private readonly people: PeopleService,
    private readonly accounts: AccountsService,
    private readonly categories: CategoriesService,
    private readonly transactions: TransactionsService,
    private readonly settlements: SettlementsService,
    @InjectModel(Transaction.name) private readonly txModel: Model<Transaction>,
  ) {}

  async run() {
    const cards = await this.upsertByName(this.cards, [
      {
        name: 'Nubank',
        brand: 'mastercard',
        last4: '1234',
        color: '#820ad1',
        closingDay: 3,
        dueDay: 10,
        limit: 800000,
      },
      {
        name: 'Itaú Click',
        brand: 'visa',
        last4: '5678',
        color: '#ec7000',
        closingDay: 25,
        dueDay: 5,
        limit: 500000,
      },
    ] as const);
    const people = await this.upsertByName(this.people, [
      { name: 'Mãe', color: '#ff2d55', avatar: '👩', note: 'Usa o Nubank para mercado' },
      { name: 'João', color: '#5856d6', note: 'Irmão' },
    ]);
    const accounts = await this.upsertByName(this.accounts, [
      { name: 'Conta corrente', type: 'checking', initialBalance: 250000, color: '#007aff' },
      { name: 'Carteira', type: 'wallet', initialBalance: 15000, color: '#34c759' },
    ] as const);
    this.logger.log(`Demo: ${cards} cartões, ${people} pessoas, ${accounts} contas criados`);

    if (await this.txModel.exists({})) {
      this.logger.log('Já existem lançamentos; exemplos de lançamentos não foram criados');
      return;
    }
    await this.seedTransactions();
  }

  private async seedTransactions() {
    const [cards, people, cats, accounts] = await Promise.all([
      this.cards.list(),
      this.people.list(),
      this.categories.list(),
      this.accounts.list(),
    ]);
    const card = (n: string) => String(cards.find((c) => c.name === n)!._id);
    const person = (n: string) =>
      String(people.find((p) => (n === 'Eu' ? p.isSelf : p.name === n))!._id);
    const cat = (n: string, type = 'expense') =>
      String(cats.find((c) => c.name === n && c.type === type)!._id);
    const conta = String(accounts.find((a) => a.name === 'Conta corrente')!._id);

    const today = todayLocal();
    // Dia d de (mês atual + offset), nunca no futuro.
    const day = (offset: number, d: number) => {
      const ld = clampDay(addMonths(today, offset), d);
      return formatLocalDate(offset === 0 && ld.day > today.day ? today : ld);
    };

    type Spec = Parameters<TransactionsService['create']>[0];
    const exp = (s: Omit<Spec, 'type'>): Spec => ({ type: 'expense', ...s });
    const items: Spec[] = [
      {
        type: 'income',
        amount: 650000,
        description: 'Salário',
        date: day(-2, 5),
        categoryId: cat('Salário', 'income'),
        personId: person('Eu'),
        method: 'debit',
        accountId: conta,
        recurring: true,
        status: 'confirmed',
      },
      {
        type: 'income',
        amount: 120000,
        description: 'Freela site',
        date: day(0, 12),
        categoryId: cat('Freelance', 'income'),
        personId: person('Eu'),
        method: 'pix',
        accountId: conta,
      },
      exp({
        amount: 189900,
        description: 'Aluguel',
        date: day(-2, 10),
        categoryId: cat('Moradia'),
        personId: person('Eu'),
        method: 'pix',
        accountId: conta,
        recurring: true,
        status: 'confirmed',
      }),
      exp({
        amount: 5590,
        description: 'Netflix',
        date: day(-2, 15),
        categoryId: cat('Assinaturas'),
        personId: person('Eu'),
        method: 'credit_card',
        cardId: card('Itaú Click'),
        recurring: true,
        status: 'confirmed',
      }),
      exp({
        amount: 240000,
        description: 'Notebook',
        date: day(-1, 20),
        categoryId: cat('Compras'),
        personId: person('Eu'),
        method: 'credit_card',
        cardId: card('Itaú Click'),
        installments: 10,
      }),
      exp({
        amount: 159990,
        description: 'Geladeira',
        date: day(-1, 8),
        categoryId: cat('Compras'),
        personId: person('Mãe'),
        method: 'credit_card',
        cardId: card('Nubank'),
        installments: 6,
      }),
      exp({
        amount: 48732,
        description: 'Supermercado',
        date: day(0, 2),
        categoryId: cat('Mercado'),
        personId: person('Mãe'),
        method: 'credit_card',
        cardId: card('Nubank'),
      }),
      exp({
        amount: 31250,
        description: 'Supermercado',
        date: day(-1, 18),
        categoryId: cat('Mercado'),
        personId: person('Eu'),
        method: 'credit_card',
        cardId: card('Nubank'),
      }),
      exp({
        amount: 8990,
        description: 'iFood',
        date: day(0, 1),
        categoryId: cat('Alimentação'),
        personId: person('Eu'),
        method: 'credit_card',
        cardId: card('Nubank'),
      }),
      exp({
        amount: 4250,
        description: 'Uber',
        date: day(0, 3),
        categoryId: cat('Transporte'),
        personId: person('Eu'),
        method: 'credit_card',
        cardId: card('Itaú Click'),
      }),
      exp({
        amount: 22000,
        description: 'Gasolina',
        date: day(0, 6),
        categoryId: cat('Combustível'),
        personId: person('Eu'),
        method: 'debit',
        accountId: conta,
      }),
      exp({
        amount: 15000,
        description: 'Tênis',
        date: day(0, 9),
        categoryId: cat('Vestuário'),
        personId: person('João'),
        method: 'credit_card',
        cardId: card('Itaú Click'),
        installments: 3,
      }),
      exp({
        amount: 3500,
        description: 'Padaria',
        date: day(0, 11),
        categoryId: cat('Alimentação'),
        personId: person('Eu'),
        method: 'cash',
      }),
      exp({
        amount: 12990,
        description: 'Farmácia',
        date: day(-1, 25),
        categoryId: cat('Farmácia'),
        personId: person('Eu'),
        method: 'pix',
        accountId: conta,
      }),
      exp({
        amount: 9800,
        description: 'Cinema',
        date: day(-1, 14),
        categoryId: cat('Lazer'),
        personId: person('Eu'),
        method: 'credit_card',
        cardId: card('Nubank'),
      }),
      exp({
        amount: 26000,
        description: 'Conta de luz',
        date: day(-1, 12),
        categoryId: cat('Contas e serviços'),
        personId: person('Eu'),
        method: 'pix',
        accountId: conta,
      }),
    ];
    for (const item of items) await this.transactions.create(item);

    await this.settlements.create({
      personId: person('Mãe'),
      amount: 30000,
      date: day(0, 5),
      note: 'Pix',
    });
    this.logger.log(`Demo: ${items.length} lançamentos e 1 acerto criados`);
  }

  private async upsertByName<T extends { name: string }>(
    service: { list(): Promise<{ name: string }[]>; create(dto: T): Promise<unknown> },
    items: readonly T[],
  ): Promise<number> {
    const existing = new Set((await service.list()).map((d) => d.name));
    const missing = items.filter((i) => !existing.has(i.name));
    for (const item of missing) await service.create(item);
    return missing.length;
  }
}
