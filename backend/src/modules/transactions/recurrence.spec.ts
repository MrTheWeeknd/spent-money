import { monthlyDates } from './recurrence';

describe('monthlyDates', () => {
  it('mantém o dia original e limita nos meses curtos', () => {
    expect(monthlyDates({ year: 2026, month: 12 }, 31, { year: 2027, month: 3 })).toEqual([
      { year: 2026, month: 12, day: 31 },
      { year: 2027, month: 1, day: 31 },
      { year: 2027, month: 2, day: 28 },
      { year: 2027, month: 3, day: 31 },
    ]);
  });

  it('pode pular o mês inicial (continuação de uma recorrência)', () => {
    expect(monthlyDates({ year: 2026, month: 10 }, 5, { year: 2026, month: 11 }, true)).toEqual([
      { year: 2026, month: 11, day: 5 },
    ]);
  });

  it('retorna vazio quando já está no limite', () => {
    expect(monthlyDates({ year: 2026, month: 10 }, 5, { year: 2026, month: 10 }, true)).toEqual([]);
  });
});
