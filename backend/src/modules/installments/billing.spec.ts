import { invoiceByDueMonth, invoiceFor, planInstallments, splitInstallments } from './billing';

const d = (year: number, month: number, day: number) => ({ year, month, day });

describe('invoiceFor (fatura pela data de fechamento)', () => {
  // Fecha dia 25, vence dia 5 do mês seguinte.
  const itau = { closingDay: 25, dueDay: 5 };
  // Fecha dia 3, vence dia 10 do mesmo mês.
  const nubank = { closingDay: 3, dueDay: 10 };

  it('compra antes do fechamento cai na fatura que fecha no mesmo mês', () => {
    const inv = invoiceFor(d(2026, 10, 10), itau);
    expect(inv).toMatchObject({ year: 2026, month: 11 });
    expect(inv.closingDate).toEqual(d(2026, 10, 25));
    expect(inv.dueDate).toEqual(d(2026, 11, 5));
  });

  it('compra no dia do fechamento já vai para a fatura seguinte', () => {
    expect(invoiceFor(d(2026, 10, 25), itau)).toMatchObject({ year: 2026, month: 12 });
  });

  it('compra após o fechamento vai para a fatura seguinte', () => {
    expect(invoiceFor(d(2026, 10, 26), itau)).toMatchObject({ year: 2026, month: 12 });
  });

  it('vencimento depois do fechamento no calendário vence no mesmo mês do fechamento', () => {
    expect(invoiceFor(d(2026, 10, 2), nubank)).toMatchObject({ year: 2026, month: 10 });
    const inv = invoiceFor(d(2026, 10, 3), nubank);
    expect(inv).toMatchObject({ year: 2026, month: 11 });
    expect(inv.closingDate).toEqual(d(2026, 11, 3));
    expect(inv.dueDate).toEqual(d(2026, 11, 10));
  });

  it('vira o ano corretamente', () => {
    expect(invoiceFor(d(2026, 12, 28), itau)).toMatchObject({ year: 2027, month: 2 });
    expect(invoiceFor(d(2026, 12, 3), nubank)).toMatchObject({ year: 2027, month: 1 });
  });

  it('dia de fechamento inexistente no mês usa o último dia', () => {
    const card = { closingDay: 31, dueDay: 8 };
    // Fevereiro/2026 tem 28 dias: compra em 27/02 ainda entra; em 28/02 já é o fechamento.
    expect(invoiceFor(d(2026, 2, 27), card)).toMatchObject({ year: 2026, month: 3 });
    expect(invoiceFor(d(2026, 2, 28), card).closingDate).toEqual(d(2026, 3, 31));
    expect(invoiceFor(d(2026, 2, 28), card)).toMatchObject({ year: 2026, month: 4 });
    // Ano bissexto
    expect(invoiceFor(d(2028, 2, 28), card)).toMatchObject({ year: 2028, month: 3 });
  });

  it('vencimento inexistente no mês usa o último dia', () => {
    const card = { closingDay: 20, dueDay: 31 };
    const inv = invoiceFor(d(2026, 2, 10), card);
    expect(inv.nominalDueDate).toEqual(d(2026, 2, 28));
    // 28/02/2026 é sábado: o vencimento efetivo vai para o próximo dia útil.
    expect(inv.dueDate).toEqual(d(2026, 3, 2));
  });

  it('vencimento em fim de semana ou feriado vai para o próximo dia útil', () => {
    const santander = { closingDay: 15, dueDay: 22 };
    const inv = invoiceByDueMonth({ year: 2026, month: 11 }, santander);
    expect(inv.nominalDueDate).toEqual(d(2026, 11, 22)); // domingo
    expect(inv.dueDate).toEqual(d(2026, 11, 23));
    expect(inv.dueAdjusted).toBe(false);
  });
});

describe('datas ajustadas por fatura (banco mudou o fechamento/vencimento)', () => {
  const santander = { closingDay: 15, dueDay: 22 };
  const nov = 202611;

  it('fechamento antecipado manda a compra para a fatura seguinte', () => {
    const overrides = new Map([[nov, { closingDate: d(2026, 11, 13) }]]);
    expect(invoiceFor(d(2026, 11, 14), santander)).toMatchObject({ month: 11 });
    const inv = invoiceFor(d(2026, 11, 14), santander, overrides);
    expect(inv).toMatchObject({ year: 2026, month: 12 });
    expect(invoiceFor(d(2026, 11, 12), santander, overrides)).toMatchObject({ month: 11 });
  });

  it('fechamento adiado mantém a compra na fatura atual', () => {
    const overrides = new Map([[nov, { closingDate: d(2026, 11, 17) }]]);
    expect(invoiceFor(d(2026, 11, 16), santander)).toMatchObject({ month: 12 });
    expect(invoiceFor(d(2026, 11, 16), santander, overrides)).toMatchObject({ month: 11 });
    expect(invoiceFor(d(2026, 11, 17), santander, overrides)).toMatchObject({ month: 12 });
  });

  it('vencimento ajustado substitui o calculado e é sinalizado', () => {
    const overrides = new Map([[nov, { dueDate: d(2026, 11, 24) }]]);
    const inv = invoiceByDueMonth({ year: 2026, month: 11 }, santander, overrides);
    expect(inv.dueDate).toEqual(d(2026, 11, 24));
    expect(inv).toMatchObject({ dueAdjusted: true, closingAdjusted: false });
  });

  it('parcelas seguem a fatura da 1ª compra com o ajuste', () => {
    const overrides = new Map([[nov, { closingDate: d(2026, 11, 13) }]]);
    const plan = planInstallments(d(2026, 11, 14), 30000, 2, santander, overrides);
    expect(plan.map((p) => p.invoiceMonth)).toEqual([12, 1]);
  });

  it('invoiceByDueMonth é o inverso de invoiceFor', () => {
    for (const card of [
      { closingDay: 25, dueDay: 5 },
      { closingDay: 3, dueDay: 10 },
      { closingDay: 31, dueDay: 8 },
    ]) {
      const inv = invoiceFor(d(2026, 7, 15), card);
      expect(invoiceByDueMonth(inv, card)).toEqual(inv);
    }
  });
});

describe('splitInstallments (divisão com arredondamento)', () => {
  it('divide valores exatos igualmente', () => {
    expect(splitInstallments(30000, 3)).toEqual([10000, 10000, 10000]);
  });

  it('coloca a diferença do arredondamento na última parcela', () => {
    expect(splitInstallments(10000, 3)).toEqual([3333, 3333, 3334]);
    expect(splitInstallments(100, 7)).toEqual([14, 14, 14, 14, 14, 14, 16]);
  });

  it('soma das parcelas é sempre o total', () => {
    for (const [total, n] of [
      [1, 1],
      [99999, 12],
      [12345, 10],
      [5, 4],
    ]) {
      const parts = splitInstallments(total, n);
      expect(parts).toHaveLength(n);
      expect(parts.reduce((a, b) => a + b, 0)).toBe(total);
      expect(parts.every((p) => Number.isInteger(p) && p >= 0)).toBe(true);
    }
  });

  it('rejeita entradas inválidas', () => {
    expect(() => splitInstallments(0, 2)).toThrow();
    expect(() => splitInstallments(10.5, 2)).toThrow();
    expect(() => splitInstallments(100, 0)).toThrow();
  });
});

describe('planInstallments', () => {
  it('coloca a 1ª parcela na fatura da compra e as demais nos meses seguintes', () => {
    const plan = planInstallments(d(2026, 11, 30), 100000, 3, { closingDay: 25, dueDay: 5 });
    expect(plan).toEqual([
      { number: 1, total: 3, amount: 33333, invoiceYear: 2027, invoiceMonth: 1 },
      { number: 2, total: 3, amount: 33333, invoiceYear: 2027, invoiceMonth: 2 },
      { number: 3, total: 3, amount: 33334, invoiceYear: 2027, invoiceMonth: 3 },
    ]);
  });
});
