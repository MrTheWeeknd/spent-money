import { TransactionStatus, TransactionType } from '../transactions/transaction.schema';

/**
 * Linha agregada do "livro" mensal. Regime usado nos relatórios:
 * - débito/Pix/dinheiro contam no mês da data do lançamento;
 * - crédito conta pelas parcelas, no mês da fatura (vencimento).
 */
export interface LedgerRow {
  ym: number; // AAAAMM
  type: TransactionType;
  status: TransactionStatus;
  categoryId: string;
  /** true = gasto/receita meu; false = de terceiros (não entra no meu saldo). */
  mine: boolean;
  total: number;
}

export interface MonthTotals {
  income: number;
  expense: number;
  incomePlanned: number;
  expensePlanned: number;
  /** Gastos de terceiros nos meus meios (reembolsáveis). */
  othersExpense: number;
}

export function emptyTotals(): MonthTotals {
  return { income: 0, expense: 0, incomePlanned: 0, expensePlanned: 0, othersExpense: 0 };
}

export function addRow(t: MonthTotals, r: LedgerRow): void {
  if (r.type === 'expense' && !r.mine) {
    t.othersExpense += r.total;
    return;
  }
  const planned = r.status === 'planned';
  if (r.type === 'income') {
    if (planned) t.incomePlanned += r.total;
    else t.income += r.total;
  } else if (planned) t.expensePlanned += r.total;
  else t.expense += r.total;
}

export function byCategory(rows: LedgerRow[], type: TransactionType) {
  const map = new Map<string, number>();
  for (const r of rows) {
    if (r.type !== type || (type === 'expense' && !r.mine)) continue;
    map.set(r.categoryId, (map.get(r.categoryId) ?? 0) + r.total);
  }
  return [...map]
    .map(([categoryId, total]) => ({ categoryId, total }))
    .sort((a, b) => b.total - a.total);
}
