import { LocalDate } from './dates';

// Dias sem expediente bancário no Brasil: fins de semana, feriados nacionais e os
// móveis em que os bancos não abrem (Carnaval, Sexta-feira Santa, Corpus Christi).
// Feriados estaduais/municipais não entram — para esses, ajuste a data na fatura.

const FIXED = ['01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '11-20', '12-25'];

/** Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher). */
export function easter(year: number): LocalDate {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { year, month, day };
}

const toUtc = (d: LocalDate) => new Date(Date.UTC(d.year, d.month - 1, d.day));
const fromUtc = (dt: Date): LocalDate => ({
  year: dt.getUTCFullYear(),
  month: dt.getUTCMonth() + 1,
  day: dt.getUTCDate(),
});
const addDays = (d: LocalDate, n: number) => fromUtc(new Date(toUtc(d).getTime() + n * 86_400_000));
const mmdd = (d: LocalDate) =>
  `${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;

const movableCache = new Map<number, Set<string>>();
function movable(year: number): Set<string> {
  let set = movableCache.get(year);
  if (!set) {
    const e = easter(year);
    // Carnaval (seg e ter), Sexta-feira Santa, Corpus Christi
    set = new Set([-48, -47, -2, 60].map((n) => mmdd(addDays(e, n))));
    movableCache.set(year, set);
  }
  return set;
}

export function isBusinessDay(d: LocalDate): boolean {
  const weekday = toUtc(d).getUTCDay();
  if (weekday === 0 || weekday === 6) return false;
  const key = mmdd(d);
  return !FIXED.includes(key) && !movable(d.year).has(key);
}

/** O próprio dia, se útil; senão o próximo dia útil. */
export function nextBusinessDay(d: LocalDate): LocalDate {
  let cur = d;
  while (!isBusinessDay(cur)) cur = addDays(cur, 1);
  return cur;
}
