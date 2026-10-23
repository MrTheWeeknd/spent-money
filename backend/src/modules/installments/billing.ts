import { nextBusinessDay } from '../../common/business-days';
import { addMonths, clampDay, compareLocal, LocalDate, YearMonth, ymKey } from '../../common/dates';

export interface BillingCycle {
  closingDay: number;
  dueDay: number;
}

/** Datas reais de uma fatura informadas pelo usuário (o banco mudou por fim de semana/feriado). */
export interface InvoiceDates {
  closingDate?: LocalDate;
  dueDate?: LocalDate;
}
/** Ajustes por fatura, indexados pelo mês de vencimento (ymKey, ex.: 202611). */
export type InvoiceOverrides = Map<number, InvoiceDates>;

export interface Invoice extends YearMonth {
  /** Fechamento efetivo: o ajustado, se houver; senão o dia de fechamento do cartão. */
  closingDate: LocalDate;
  /**
   * Vencimento efetivo: o ajustado, se houver; senão o dia de vencimento do cartão
   * levado para o próximo dia útil. A fatura continua identificada pelo mês de vencimento.
   */
  dueDate: LocalDate;
  /** Datas "de contrato" (dias configurados no cartão), sem ajustes. */
  nominalClosingDate: LocalDate;
  nominalDueDate: LocalDate;
  closingAdjusted: boolean;
  dueAdjusted: boolean;
}

function invoiceByClosingMonth(
  closingMonth: YearMonth,
  card: BillingCycle,
  overrides?: InvoiceOverrides,
): Invoice {
  const dueMonth = addMonths(closingMonth, card.dueDay > card.closingDay ? 0 : 1);
  const nominalClosingDate = clampDay(closingMonth, card.closingDay);
  const nominalDueDate = clampDay(dueMonth, card.dueDay);
  const o = overrides?.get(ymKey(dueMonth));
  return {
    year: dueMonth.year,
    month: dueMonth.month,
    closingDate: o?.closingDate ?? nominalClosingDate,
    dueDate: o?.dueDate ?? nextBusinessDay(nominalDueDate),
    nominalClosingDate,
    nominalDueDate,
    closingAdjusted: !!o?.closingDate,
    dueAdjusted: !!o?.dueDate,
  };
}

/** Fatura identificada pelo mês de vencimento. */
export function invoiceByDueMonth(
  due: YearMonth,
  card: BillingCycle,
  overrides?: InvoiceOverrides,
): Invoice {
  const closingMonth = addMonths(due, card.dueDay > card.closingDay ? 0 : -1);
  return invoiceByClosingMonth(closingMonth, card, overrides);
}

/**
 * Fatura em que cai uma compra.
 * - Compra antes do fechamento entra na fatura que fecha naquele ciclo; no dia do
 *   fechamento ou depois, na seguinte.
 * - O fechamento usado é o efetivo: se o banco antecipou ou adiou o fechamento de uma
 *   fatura (e isso foi ajustado), a compra perto da data cai no lugar certo.
 * - A fatura recebe o nome do mês de vencimento: se o vencimento é depois do fechamento
 *   no calendário (fecha 3, vence 10) vence no mesmo mês; senão no mês seguinte.
 * - Dias inexistentes no mês (ex.: 31 em abril) usam o último dia do mês.
 */
export function invoiceFor(
  purchase: LocalDate,
  card: BillingCycle,
  overrides?: InvoiceOverrides,
): Invoice {
  const purchaseMonth: YearMonth = { year: purchase.year, month: purchase.month };
  const closingThisMonth = clampDay(purchaseMonth, card.closingDay);
  const nominalClosingMonth =
    purchase.day < closingThisMonth.day ? purchaseMonth : addMonths(purchaseMonth, 1);
  // Ajustes mudam o corte em poucos dias: basta olhar o ciclo anterior, o nominal e o seguinte.
  for (const offset of [-1, 0, 1]) {
    const inv = invoiceByClosingMonth(addMonths(nominalClosingMonth, offset), card, overrides);
    if (compareLocal(purchase, inv.closingDate) < 0) return inv;
  }
  return invoiceByClosingMonth(addMonths(nominalClosingMonth, 2), card, overrides);
}

/**
 * Divide um total em N parcelas inteiras (centavos).
 * Todas recebem o valor arredondado para baixo; a última absorve a diferença.
 */
export function splitInstallments(total: number, count: number): number[] {
  if (!Number.isInteger(total) || total <= 0) throw new Error('Total deve ser inteiro positivo');
  if (!Number.isInteger(count) || count < 1) throw new Error('Número de parcelas inválido');
  const base = Math.floor(total / count);
  const parts = Array.from({ length: count }, () => base);
  parts[count - 1] = total - base * (count - 1);
  return parts;
}

export interface PlannedInstallment {
  number: number;
  total: number;
  amount: number;
  invoiceYear: number;
  invoiceMonth: number;
}

/** Parcelas de uma compra no crédito: a 1ª na fatura da compra, as demais nos meses seguintes. */
export function planInstallments(
  purchase: LocalDate,
  totalAmount: number,
  count: number,
  card: BillingCycle,
  overrides?: InvoiceOverrides,
): PlannedInstallment[] {
  const first = invoiceFor(purchase, card, overrides);
  return splitInstallments(totalAmount, count).map((amount, i) => {
    const ym = addMonths(first, i);
    return { number: i + 1, total: count, amount, invoiceYear: ym.year, invoiceMonth: ym.month };
  });
}
