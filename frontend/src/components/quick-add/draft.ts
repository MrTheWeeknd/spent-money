import type {
  Card,
  Category,
  PaymentMethod,
  Person,
  Transaction,
  TransactionDefaults,
  TransactionInput,
  TransactionType,
} from '@/api/types';
import { localDay } from '@/lib/dates';

export interface Draft {
  id?: string;
  type: TransactionType;
  amount: number;
  description: string;
  method: PaymentMethod;
  cardId: string | null;
  accountId: string | null;
  personId: string;
  categoryId: string | null;
  installments: number;
  date: string;
  recurring: boolean;
  note: string;
  status: Transaction['status'];
  /** O usuário escolheu a categoria à mão: não sobrescrever com sugestão. */
  categoryTouched: boolean;
  /** Lançamento original (edição). */
  original?: Transaction;
}

interface Catalog {
  cards: Card[];
  people: Person[];
  categories: Category[];
  self?: Person;
}

const byUsage = (usage: Record<string, number> | undefined) => (a: { id: string; name: string }, b: { id: string; name: string }) =>
  (usage?.[b.id] ?? 0) - (usage?.[a.id] ?? 0) || a.name.localeCompare(b.name, 'pt');

export function sortedCards(cat: Catalog, defaults?: TransactionDefaults) {
  return cat.cards.filter((c) => c.active).sort(byUsage(defaults?.usage.cards));
}
export function sortedCategories(cat: Catalog, type: TransactionType, defaults?: TransactionDefaults) {
  return cat.categories.filter((c) => c.type === type && !c.archived).sort(byUsage(defaults?.usage.categories));
}
export function sortedPeople(cat: Catalog, defaults?: TransactionDefaults) {
  const others = cat.people.filter((p) => !p.isSelf).sort(byUsage(defaults?.usage.people));
  return cat.self ? [cat.self, ...others] : others;
}

/**
 * Campos pré-selecionados para um novo lançamento do tipo: os últimos usados,
 * validados contra os cadastros atuais (cartão ativo, categoria não arquivada etc.).
 */
export function defaultsFor(
  type: TransactionType,
  cat: Catalog,
  defaults: TransactionDefaults | undefined,
): Pick<Draft, 'method' | 'cardId' | 'accountId' | 'personId' | 'categoryId'> {
  const last = defaults?.last[type] ?? null;
  const cards = sortedCards(cat, defaults);
  const categories = sortedCategories(cat, type, defaults);
  const validCard = cards.find((c) => c.id === last?.cardId)?.id ?? cards[0]?.id ?? null;

  // O app é focado no cartão de crédito: despesa nova sempre começa no último cartão usado.
  // Outros meios (débito, Pix, dinheiro) ficam a um toque, em "Outro meio".
  let method: PaymentMethod =
    type === 'expense' && validCard ? 'credit_card' : last?.method && last.method !== 'credit_card' ? last.method : 'pix';
  if (type === 'income' && method === 'credit_card') method = 'pix';

  return {
    method,
    cardId: method === 'credit_card' ? validCard : null,
    accountId: method !== 'credit_card' ? (last?.accountId ?? null) : null,
    personId: (type === 'expense' && cat.people.some((p) => p.id === last?.personId) ? last?.personId : cat.self?.id) ?? '',
    categoryId: categories.find((c) => c.id === last?.categoryId)?.id ?? categories[0]?.id ?? null,
  };
}

export function newDraft(
  type: TransactionType,
  cat: Catalog,
  defaults: TransactionDefaults | undefined,
  overrides: Partial<Draft> = {},
): Draft {
  return {
    type,
    amount: 0,
    description: '',
    installments: 1,
    date: localDay(),
    recurring: false,
    note: '',
    status: 'confirmed',
    categoryTouched: false,
    ...defaultsFor(type, cat, defaults),
    ...overrides,
  };
}

export function draftFromTransaction(tx: Transaction): Draft {
  return {
    id: tx.id,
    type: tx.type,
    amount: tx.amount,
    description: tx.description,
    method: tx.method,
    cardId: tx.cardId ?? null,
    accountId: tx.accountId ?? null,
    personId: tx.personId,
    categoryId: tx.categoryId,
    installments: tx.installments,
    date: localDay(tx.date),
    recurring: !!tx.recurrence,
    note: tx.note ?? '',
    status: tx.status,
    categoryTouched: true,
    original: tx,
  };
}

export function draftToInput(d: Draft): TransactionInput {
  const credit = d.method === 'credit_card';
  return {
    type: d.type,
    amount: d.amount,
    description: d.description.trim(),
    date: d.date,
    categoryId: d.categoryId!,
    personId: d.personId,
    method: d.method,
    cardId: credit ? d.cardId : null,
    accountId: credit ? null : d.accountId,
    installments: credit ? d.installments : 1,
    note: d.note.trim(),
    ...(d.id ? { status: d.status } : { recurring: d.recurring }),
  };
}

/** Categoria mais usada para descrições parecidas (mesmo tipo). */
export function suggestCategory(
  description: string,
  type: TransactionType,
  defaults: TransactionDefaults | undefined,
  validIds: Set<string>,
): string | null {
  const q = normalize(description);
  if (q.length < 2 || !defaults) return null;
  const candidates = defaults.descriptions.filter((d) => d.type === type && validIds.has(d.categoryId));
  const exact = candidates.find((d) => normalize(d.description) === q);
  if (exact) return exact.categoryId;
  const starts = candidates.find((d) => normalize(d.description).startsWith(q));
  if (starts) return starts.categoryId;
  // Palavra em comum (ex.: "uber centro" ~ "uber")
  const words = q.split(' ').filter((w) => w.length >= 3);
  return candidates.find((d) => words.some((w) => normalize(d.description).split(' ').includes(w)))?.categoryId ?? null;
}

export function descriptionMatches(description: string, type: TransactionType, defaults: TransactionDefaults | undefined) {
  const q = normalize(description);
  if (q.length < 1 || !defaults) return [];
  return defaults.descriptions
    .filter((d) => d.type === type && normalize(d.description).startsWith(q) && normalize(d.description) !== q)
    .slice(0, 3);
}

export function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
