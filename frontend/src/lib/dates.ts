import { TZDate } from '@date-fns/tz';
import { addMonths, format, isSameDay, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Datas vêm da API em UTC (ISO) e são exibidas no fuso de Manaus.
export const APP_TZ = 'America/Manaus';

export function toLocal(date: string | Date): TZDate {
  return new TZDate(new Date(date), APP_TZ);
}

export function nowLocal(): TZDate {
  return TZDate.tz(APP_TZ);
}

export function formatDate(date: string | Date, pattern = "d 'de' MMM"): string {
  return format(toLocal(date), pattern, { locale: ptBR });
}

/** Dia local (AAAA-MM-DD) de um instante; sem argumento, hoje. */
export function localDay(date?: string | Date): string {
  return format(date ? toLocal(date) : nowLocal(), 'yyyy-MM-dd');
}

/** Mês local (AAAA-MM). */
export function localMonth(date?: string | Date): string {
  return localDay(date).slice(0, 7);
}

/** Primeira letra maiúscula (pt-BR não capitaliza "de"). */
export function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function shiftMonth(ym: string, n: number): string {
  const [y, m] = ym.split('-').map(Number);
  return format(addMonths(new Date(y, m - 1, 1), n), 'yyyy-MM');
}

/** "outubro de 2026" (ou "outubro" no ano corrente quando `short`). */
export function monthLabel(ym: string, opts: { short?: boolean } = {}): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  const sameYear = y === nowLocal().getFullYear();
  return cap(format(d, opts.short && sameYear ? 'MMMM' : "MMMM 'de' yyyy", { locale: ptBR }));
}

export function monthShort(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return format(new Date(y, m - 1, 1), 'MMM', { locale: ptBR }).replace('.', '');
}

/** Rótulo do dia para listas: Hoje, Ontem ou "qui., 21 de out.". */
export function dayLabel(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date(nowLocal().getFullYear(), nowLocal().getMonth(), nowLocal().getDate());
  if (isSameDay(date, today)) return 'Hoje';
  if (isSameDay(date, subDays(today, 1))) return 'Ontem';
  const pattern = y === today.getFullYear() ? "EEE, d 'de' MMM" : "d 'de' MMM 'de' yyyy";
  return cap(format(date, pattern, { locale: ptBR }));
}

/** "05/11" a partir de AAAA-MM-DD. */
export function shortDay(day: string): string {
  const [, m, d] = day.split('-');
  return `${d}/${m}`;
}
