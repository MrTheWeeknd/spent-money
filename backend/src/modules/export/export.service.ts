import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { formatLocalDate, toLocalDate } from '../../common/dates';
import { Account } from '../accounts/account.schema';
import { Card } from '../cards/card.schema';
import { Category } from '../categories/category.schema';
import { Installment } from '../installments/installment.schema';
import { Person } from '../people/person.schema';
import { Settlement } from '../settlements/settlement.schema';
import { Transaction } from '../transactions/transaction.schema';
import { centsToDecimal, toCsv } from './csv';

const TYPE = { expense: 'Despesa', income: 'Receita' };
const METHOD = { credit_card: 'Crédito', debit: 'Débito', pix: 'Pix', cash: 'Dinheiro' };
const STATUS = { confirmed: 'Confirmado', planned: 'Previsto' };

@Injectable()
export class ExportService {
  constructor(
    @InjectModel(Transaction.name) private readonly transactions: Model<Transaction>,
    @InjectModel(Installment.name) private readonly installments: Model<Installment>,
    @InjectModel(Settlement.name) private readonly settlements: Model<Settlement>,
    @InjectModel(Card.name) private readonly cards: Model<Card>,
    @InjectModel(Person.name) private readonly people: Model<Person>,
    @InjectModel(Category.name) private readonly categories: Model<Category>,
    @InjectModel(Account.name) private readonly accounts: Model<Account>,
  ) {}

  private async names() {
    const [cards, people, categories, accounts] = await Promise.all([
      this.cards.find().lean(),
      this.people.find().lean(),
      this.categories.find().lean(),
      this.accounts.find().lean(),
    ]);
    const map = <T extends { _id: unknown; name: string }>(list: T[]) =>
      new Map(list.map((x) => [String(x._id), x.name]));
    return {
      cards: map(cards),
      people: map(people),
      categories: map(categories),
      accounts: map(accounts),
    };
  }

  private date(d: Date) {
    return formatLocalDate(toLocalDate(d));
  }

  async transactionsCsv(): Promise<string> {
    const [n, txs] = await Promise.all([
      this.names(),
      this.transactions.find().sort({ date: 1 }).lean(),
    ]);
    return toCsv(
      [
        'Data',
        'Tipo',
        'Descrição',
        'Categoria',
        'Valor (R$)',
        'Meio',
        'Cartão',
        'Conta',
        'Pessoa',
        'Parcelas',
        'Status',
        'Recorrente',
        'Observação',
        'Tags',
      ],
      txs.map((t) => [
        this.date(t.date),
        TYPE[t.type],
        t.description,
        n.categories.get(String(t.categoryId)),
        centsToDecimal(t.amount),
        METHOD[t.method],
        t.cardId ? n.cards.get(String(t.cardId)) : '',
        t.accountId ? n.accounts.get(String(t.accountId)) : '',
        n.people.get(String(t.personId)),
        t.installments,
        STATUS[t.status],
        t.recurrence ? 'Sim' : 'Não',
        t.note ?? '',
        (t.tags ?? []).join(', '),
      ]),
    );
  }

  async installmentsCsv(): Promise<string> {
    const [n, rows] = await Promise.all([
      this.names(),
      this.installments.find().sort({ invoiceYear: 1, invoiceMonth: 1, date: 1 }).lean(),
    ]);
    return toCsv(
      [
        'Fatura',
        'Cartão',
        'Data da compra',
        'Descrição',
        'Parcela',
        'Valor (R$)',
        'Pessoa',
        'Categoria',
        'Status',
      ],
      rows.map((i) => [
        `${i.invoiceYear}-${String(i.invoiceMonth).padStart(2, '0')}`,
        n.cards.get(String(i.cardId)),
        this.date(i.date),
        i.description,
        `${i.number}/${i.total}`,
        centsToDecimal(i.amount),
        n.people.get(String(i.personId)),
        n.categories.get(String(i.categoryId)),
        STATUS[i.status],
      ]),
    );
  }

  async settlementsCsv(): Promise<string> {
    const [n, rows] = await Promise.all([
      this.names(),
      this.settlements.find().sort({ date: 1 }).lean(),
    ]);
    return toCsv(
      ['Data', 'Pessoa', 'Valor (R$)', 'Observação'],
      rows.map((s) => [
        this.date(s.date),
        n.people.get(String(s.personId)),
        centsToDecimal(s.amount),
        s.note ?? '',
      ]),
    );
  }
}
