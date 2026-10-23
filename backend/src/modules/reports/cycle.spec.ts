import { cycleOf, cycleWindow, invoiceMonthsInCycle } from './cycle';

const d = (year: number, month: number, day: number) => ({ year, month, day });
const oct = { year: 2026, month: 10 };

// Cartões do usuário (fechamento/vencimento)
const nubank = { closingDay: 26, dueDay: 2 };
const mercadoPago = { closingDay: 5, dueDay: 10 };
const santander = { closingDay: 15, dueDay: 22 };
const bb = { closingDay: 12, dueDay: 22 };

describe('ciclo "meu mês" com virada no dia 2', () => {
  it('ciclo de outubro vai de 03/10 a 02/11', () => {
    expect(cycleWindow(oct, 2)).toEqual({ month: oct, start: d(2026, 10, 3), end: d(2026, 11, 2) });
  });

  it('o dia 2 ainda é do ciclo anterior; o dia 3 já é do próximo', () => {
    expect(cycleOf(d(2026, 11, 2), 2).month).toEqual(oct);
    expect(cycleOf(d(2026, 11, 3), 2).month).toEqual({ year: 2026, month: 11 });
    expect(cycleOf(d(2026, 10, 30), 2).month).toEqual(oct); // dia do salário
  });

  it('as 4 faturas do ciclo de outubro: MP 10/10, Santander e BB 22/10, Nubank 02/11', () => {
    const w = cycleWindow(oct, 2);
    expect(invoiceMonthsInCycle(mercadoPago, w)).toEqual([{ year: 2026, month: 10 }]);
    expect(invoiceMonthsInCycle(santander, w)).toEqual([{ year: 2026, month: 10 }]);
    expect(invoiceMonthsInCycle(bb, w)).toEqual([{ year: 2026, month: 10 }]);
    expect(invoiceMonthsInCycle(nubank, w)).toEqual([{ year: 2026, month: 11 }]);
  });

  it('vira o ano', () => {
    const dec = cycleWindow({ year: 2026, month: 12 }, 2);
    expect(dec.end).toEqual(d(2027, 1, 2));
    expect(invoiceMonthsInCycle(nubank, dec)).toEqual([{ year: 2027, month: 1 }]);
  });

  it('sem dia de virada usa o mês do calendário', () => {
    expect(cycleWindow({ year: 2026, month: 2 }, null)).toEqual({
      month: { year: 2026, month: 2 },
      start: d(2026, 2, 1),
      end: d(2026, 2, 28),
    });
    expect(cycleOf(d(2026, 11, 2), null).month).toEqual({ year: 2026, month: 11 });
  });
});
