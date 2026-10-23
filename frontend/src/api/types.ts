// Espelho dos DTOs/schemas do backend. Valores monetários sempre em centavos.

export interface Entity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export const CARD_BRANDS = ['visa', 'mastercard', 'elo', 'amex', 'hipercard', 'other'] as const;
export type CardBrand = (typeof CARD_BRANDS)[number];

export interface Card extends Entity {
  name: string;
  brand: CardBrand;
  last4?: string | null;
  color: string;
  closingDay: number;
  dueDay: number;
  limit?: number | null;
  active: boolean;
}
export type CardInput = Omit<Card, keyof Entity>;

export interface Person extends Entity {
  name: string;
  color: string;
  avatar?: string;
  note?: string;
  isSelf: boolean;
}
export type PersonInput = Pick<Person, 'name' | 'color' | 'avatar' | 'note'>;

export type CategoryType = 'income' | 'expense';
export interface Category extends Entity {
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  archived: boolean;
}
export type CategoryInput = Omit<Category, keyof Entity>;

export const ACCOUNT_TYPES = ['checking', 'wallet', 'savings'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];
export interface Account extends Entity {
  name: string;
  type: AccountType;
  initialBalance: number;
  color: string;
  archived: boolean;
}
export type AccountInput = Omit<Account, keyof Entity>;

export type TransactionType = 'expense' | 'income';
export const PAYMENT_METHODS = ['credit_card', 'debit', 'pix', 'cash'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type TransactionStatus = 'confirmed' | 'planned';
export type Scope = 'one' | 'future';

export interface Transaction extends Entity {
  type: TransactionType;
  amount: number;
  description: string;
  /** ISO UTC (meio-dia local). */
  date: string;
  categoryId: string;
  personId: string;
  method: PaymentMethod;
  cardId?: string | null;
  accountId?: string | null;
  installments: number;
  status: TransactionStatus;
  recurrence?: { groupId: string; frequency: 'monthly'; day: number; stopped: boolean };
  note?: string;
  tags: string[];
}

export interface TransactionInput {
  type: TransactionType;
  amount: number;
  description?: string;
  /** AAAA-MM-DD local. */
  date: string;
  categoryId: string;
  personId: string;
  method: PaymentMethod;
  cardId?: string | null;
  accountId?: string | null;
  installments?: number;
  recurring?: boolean;
  status?: TransactionStatus;
  note?: string;
  tags?: string[];
}

export interface TransactionFilters {
  month?: string;
  type?: TransactionType;
  status?: TransactionStatus;
  method?: PaymentMethod;
  cardId?: string;
  personId?: string;
  categoryId?: string;
  accountId?: string;
  recurring?: boolean;
  q?: string;
}

export interface LastUsed {
  method: PaymentMethod | null;
  cardId: string | null;
  accountId: string | null;
  personId: string | null;
  categoryId: string | null;
}
export interface TransactionDefaults {
  last: { expense: LastUsed | null; income: LastUsed | null };
  descriptions: { type: TransactionType; description: string; categoryId: string; count: number }[];
  usage: { categories: Record<string, number>; people: Record<string, number>; cards: Record<string, number> };
}

export type InvoiceStatus = 'open' | 'closed' | 'past' | 'paid';
export interface InvoiceSummary {
  /** AAAA-MM do vencimento. */
  month: string;
  closingDate: string;
  dueDate: string;
  status: InvoiceStatus;
  total: number;
  paid: number;
  remaining: number;
  /** Datas configuradas no cartão (sem ajustes). */
  nominalClosingDate: string;
  nominalDueDate: string;
  /** Datas ajustadas manualmente nesta fatura. */
  closingAdjusted: boolean;
  dueAdjusted: boolean;
  /** Vencimento levado ao próximo dia útil (fim de semana/feriado). */
  dueShifted: boolean;
}
export interface CardInvoices {
  cardId: string;
  closed: InvoiceSummary | null;
  current: InvoiceSummary;
  upcoming: InvoiceSummary[];
}
export interface InvoiceDetail extends InvoiceSummary {
  cardId: string;
  isCurrent: boolean;
  byPerson: { personId: string; amount: number }[];
  payments: { id: string; amount: number; date: string; accountId: string | null; note: string }[];
  items: {
    id: string;
    transactionId: string;
    number: number;
    total: number;
    amount: number;
    personId: string;
    categoryId: string;
    description: string;
    date: string;
    status: TransactionStatus;
  }[];
}

export interface InvoicePaymentInput {
  amount: number;
  /** AAAA-MM-DD local. */
  date: string;
  accountId?: string | null;
  note?: string;
}

export interface PersonBalance {
  personId: string;
  charged: number;
  future: number;
  settled: number;
  balance: number;
}
export type StatementItem =
  | {
      kind: 'charge';
      id: string;
      date: string;
      amount: number;
      description: string;
      categoryId: string;
      method: PaymentMethod;
      cardId: string | null;
      installments: number;
    }
  | { kind: 'payment'; id: string; date: string; amount: number; note: string };
export interface Statement {
  personId: string;
  balance: PersonBalance | null;
  items: StatementItem[];
}

export interface Settlement extends Entity {
  personId: string;
  amount: number;
  date: string;
  note?: string;
}
export interface SettlementInput {
  personId: string;
  amount: number;
  date: string;
  note?: string;
}

export interface MonthTotals {
  income: number;
  expense: number;
  incomePlanned: number;
  expensePlanned: number;
  othersExpense: number;
}
export interface MonthInvoices {
  /** AAAA-MM: faturas que vencem neste mês. */
  month: string;
  total: number;
  paid: number;
  remaining: number;
  invoices: (InvoiceSummary & { cardId: string })[];
  byPerson: { personId: string; amount: number }[];
}

export interface Dashboard extends MonthTotals {
  month: string;
  invoices: MonthInvoices;
  balance: number;
  forecastBalance: number;
  expenseByCategory: { categoryId: string; total: number }[];
  cards: CardInvoices[];
  debts: PersonBalance[];
  recent: Transaction[];
}
export interface MonthlyRow extends MonthTotals {
  month: string;
}
export interface CategoryReport {
  from: string;
  to: string;
  type: TransactionType;
  months: string[];
  categories: { categoryId: string; total: number }[];
}

export interface AppSettings {
  /** Dia em que "meu mês" fecha (1–28); null = mês do calendário. */
  cycleEndDay: number | null;
}

/** Balanço do ciclo "meu mês". */
export interface CycleReport {
  /** AAAA-MM: mês em que o ciclo começa (dá nome a ele). */
  month: string;
  start: string;
  end: string;
  endDay: number | null;
  isCurrent: boolean;
  income: { received: number; planned: number; total: number };
  mine: { total: number; confirmed: number; planned: number; credit: number; other: number };
  balance: number;
  byCard: { cardId: string; month: string; dueDate: string; mine: number; total: number }[];
  byCategory: { categoryId: string; total: number }[];
  others: { total: number; byPerson: { personId: string; amount: number }[] };
}
