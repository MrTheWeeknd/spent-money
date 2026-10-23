import {
  addMonths,
  clampDay,
  compareLocal,
  daysInMonth,
  LocalDate,
  YearMonth,
} from '../../common/dates';
import { BillingCycle, invoiceByDueMonth } from '../installments/billing';

/**
 * "Meu mês": ciclo que fecha num dia fixo. Com endDay = 2, o ciclo de outubro vai de
 * 03/10 a 02/11 — nele entram o salário do dia 30 e as faturas que vencem no período
 * (ex.: MP 10/10, Santander e BB 22/10, Nubank 02/11). endDay = null → mês do calendário.
 */
export interface CycleWindow {
  /** Mês que dá nome ao ciclo (onde ele começa). */
  month: YearMonth;
  start: LocalDate;
  end: LocalDate;
}

export function cycleWindow(month: YearMonth, endDay: number | null): CycleWindow {
  if (!endDay) {
    return {
      month,
      start: { ...month, day: 1 },
      end: { ...month, day: daysInMonth(month.year, month.month) },
    };
  }
  const startDay = endDay + 1; // endDay ≤ 28, então o dia seguinte sempre existe
  const next = addMonths(month, 1);
  return {
    month,
    start: { year: month.year, month: month.month, day: startDay },
    end: clampDay(next, endDay),
  };
}

/** Ciclo que contém o dia. */
export function cycleOf(day: LocalDate, endDay: number | null): CycleWindow {
  const month: YearMonth = { year: day.year, month: day.month };
  if (!endDay || day.day > endDay) return cycleWindow(month, endDay);
  return cycleWindow(addMonths(month, -1), endDay);
}

export function inWindow(day: LocalDate, w: Pick<CycleWindow, 'start' | 'end'>): boolean {
  return compareLocal(day, w.start) >= 0 && compareLocal(day, w.end) <= 0;
}

/**
 * Faturas (mês de vencimento) de um cartão que pertencem ao ciclo. Usa o vencimento
 * "de contrato": se o banco empurrar o dia 2 para o dia 3 (domingo), a fatura não
 * escapa para o ciclo seguinte.
 */
export function invoiceMonthsInCycle(card: BillingCycle, w: CycleWindow): YearMonth[] {
  return [-1, 0, 1, 2]
    .map((n) => addMonths(w.month, n))
    .filter((ym) => inWindow(invoiceByDueMonth(ym, card).nominalDueDate, w));
}
