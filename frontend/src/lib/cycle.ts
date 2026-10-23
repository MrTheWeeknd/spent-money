import { localDay, shiftMonth } from './dates';

/**
 * Mês (AAAA-MM) do ciclo "meu mês" que contém o dia. Com virada no dia 2,
 * 02/11 ainda é do ciclo de outubro e 03/11 já é de novembro. Espelha o backend.
 */
export function cycleMonthOf(day: string, endDay: number | null): string {
  const ym = day.slice(0, 7);
  if (!endDay) return ym;
  return Number(day.slice(8, 10)) > endDay ? ym : shiftMonth(ym, -1);
}

export function currentCycleMonth(endDay: number | null): string {
  return cycleMonthOf(localDay(), endDay);
}

/** "03/10 a 02/11" */
export function cycleRange(start: string, end: string): string {
  const f = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
  return `${f(start)} a ${f(end)}`;
}
