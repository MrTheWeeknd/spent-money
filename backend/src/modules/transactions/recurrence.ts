import { addMonths, clampDay, LocalDate, YearMonth, ymKey } from '../../common/dates';

/** Quantos meses à frente as recorrências ficam geradas como "previsto". */
export const RECURRENCE_HORIZON_MONTHS = 12;

/**
 * Datas mensais a partir de `from` (exclusive se `skipFirst`) até o mês `until` (inclusive),
 * mantendo o dia original `day` (limitado ao tamanho de cada mês).
 */
export function monthlyDates(
  from: YearMonth,
  day: number,
  until: YearMonth,
  skipFirst = false,
): LocalDate[] {
  const dates: LocalDate[] = [];
  for (
    let ym = skipFirst ? addMonths(from, 1) : from;
    ymKey(ym) <= ymKey(until);
    ym = addMonths(ym, 1)
  ) {
    dates.push(clampDay(ym, day));
  }
  return dates;
}
