// Datas ficam em UTC no banco; regras de calendário (dia, mês, fatura) usam o fuso do app.
export const APP_TZ = 'America/Manaus';

export interface LocalDate {
  year: number;
  month: number; // 1–12
  day: number;
}
export interface YearMonth {
  year: number;
  month: number; // 1–12
}

const dayFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const partsFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: APP_TZ,
  hourCycle: 'h23',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
});

/** Dia do calendário local para um instante UTC. */
export function toLocalDate(date: Date): LocalDate {
  const [year, month, day] = dayFmt.format(date).split('-').map(Number);
  return { year, month, day };
}

function offsetMs(date: Date): number {
  const p = Object.fromEntries(partsFmt.formatToParts(date).map((x) => [x.type, x.value]));
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** Instante UTC correspondente a uma data/hora local. */
export function localToUtc(year: number, month: number, day: number, hour = 0): Date {
  const guess = Date.UTC(year, month - 1, day, hour);
  return new Date(guess - offsetMs(new Date(guess)));
}

/** Datas de lançamento são guardadas ao meio-dia local, longe de bordas de dia/fuso. */
export function storedDate(d: LocalDate): Date {
  return localToUtc(d.year, d.month, d.day, 12);
}

export function parseLocalDate(value: string): LocalDate {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) throw new Error(`Data inválida: ${value}`);
  const d = { year: +m[1], month: +m[2], day: +m[3] };
  if (d.month < 1 || d.month > 12 || d.day < 1 || d.day > daysInMonth(d.year, d.month)) {
    throw new Error(`Data inválida: ${value}`);
  }
  return d;
}

export function formatLocalDate(d: LocalDate): string {
  return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
}

export function parseYm(value: string): YearMonth {
  const m = /^(\d{4})-(\d{2})$/.exec(value);
  if (!m || +m[2] < 1 || +m[2] > 12) throw new Error(`Mês inválido: ${value}`);
  return { year: +m[1], month: +m[2] };
}

export function formatYm(ym: YearMonth): string {
  return `${ym.year}-${String(ym.month).padStart(2, '0')}`;
}

/** Representação numérica ordenável (ex.: 202611). */
export function ymKey(ym: YearMonth): number {
  return ym.year * 100 + ym.month;
}

export function fromYmKey(key: number): YearMonth {
  return { year: Math.floor(key / 100), month: key % 100 };
}

export function addMonths(ym: YearMonth, n: number): YearMonth {
  const idx = ym.year * 12 + (ym.month - 1) + n;
  return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Dia limitado ao tamanho do mês (31 em fevereiro vira 28/29). */
export function clampDay(ym: YearMonth, day: number): LocalDate {
  return { year: ym.year, month: ym.month, day: Math.min(day, daysInMonth(ym.year, ym.month)) };
}

/** Intervalo [start, end) em UTC que cobre o mês local. */
export function monthRange(ym: YearMonth): { start: Date; end: Date } {
  const next = addMonths(ym, 1);
  return { start: localToUtc(ym.year, ym.month, 1), end: localToUtc(next.year, next.month, 1) };
}

export function todayLocal(now = new Date()): LocalDate {
  return toLocalDate(now);
}

export function compareLocal(a: LocalDate, b: LocalDate): number {
  return a.year - b.year || a.month - b.month || a.day - b.day;
}
