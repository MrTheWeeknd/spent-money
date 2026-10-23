import { easter, isBusinessDay, nextBusinessDay } from './business-days';

const d = (year: number, month: number, day: number) => ({ year, month, day });

describe('dias úteis bancários', () => {
  it('calcula a Páscoa', () => {
    expect(easter(2026)).toEqual(d(2026, 4, 5));
    expect(easter(2027)).toEqual(d(2027, 3, 28));
  });

  it('fim de semana vai para segunda', () => {
    expect(nextBusinessDay(d(2026, 11, 22))).toEqual(d(2026, 11, 23)); // domingo
    expect(nextBusinessDay(d(2026, 8, 22))).toEqual(d(2026, 8, 24)); // sábado
  });

  it('pula feriados nacionais e os móveis bancários', () => {
    expect(isBusinessDay(d(2026, 11, 20))).toBe(false); // Consciência Negra (sexta)
    expect(nextBusinessDay(d(2026, 11, 20))).toEqual(d(2026, 11, 23));
    expect(isBusinessDay(d(2026, 2, 16))).toBe(false); // Carnaval (segunda)
    expect(nextBusinessDay(d(2026, 2, 16))).toEqual(d(2026, 2, 18)); // quarta de cinzas
    expect(isBusinessDay(d(2026, 4, 3))).toBe(false); // Sexta-feira Santa
    expect(isBusinessDay(d(2026, 6, 4))).toBe(false); // Corpus Christi
    expect(nextBusinessDay(d(2026, 12, 25))).toEqual(d(2026, 12, 28));
  });

  it('dia útil fica igual', () => {
    expect(nextBusinessDay(d(2026, 10, 22))).toEqual(d(2026, 10, 22));
  });
});
