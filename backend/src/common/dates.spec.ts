import {
  addMonths,
  localToUtc,
  monthRange,
  parseLocalDate,
  storedDate,
  toLocalDate,
} from './dates';

describe('datas no fuso America/Manaus (UTC−4)', () => {
  it('converte dia local para UTC e de volta', () => {
    expect(localToUtc(2026, 10, 23).toISOString()).toBe('2026-10-23T04:00:00.000Z');
    expect(storedDate({ year: 2026, month: 10, day: 23 }).toISOString()).toBe(
      '2026-10-23T16:00:00.000Z',
    );
    expect(toLocalDate(new Date('2026-10-24T03:30:00Z'))).toEqual({
      year: 2026,
      month: 10,
      day: 23,
    });
  });

  it('intervalo do mês cobre o mês local', () => {
    const { start, end } = monthRange({ year: 2026, month: 12 });
    expect(start.toISOString()).toBe('2026-12-01T04:00:00.000Z');
    expect(end.toISOString()).toBe('2027-01-01T04:00:00.000Z');
  });

  it('soma meses atravessando anos', () => {
    expect(addMonths({ year: 2026, month: 11 }, 3)).toEqual({ year: 2027, month: 2 });
    expect(addMonths({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
  });

  it('valida datas', () => {
    expect(() => parseLocalDate('2026-02-30')).toThrow();
    expect(parseLocalDate('2028-02-29')).toEqual({ year: 2028, month: 2, day: 29 });
  });
});
