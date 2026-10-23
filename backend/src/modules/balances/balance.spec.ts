import { computeBalances } from './balance';

describe('computeBalances (saldo devedor por pessoa)', () => {
  it('soma parcelas e subtrai acertos por pessoa', () => {
    const result = computeBalances(
      [
        { personId: 'mae', amount: 10000 },
        { personId: 'mae', amount: 5050 },
        { personId: 'joao', amount: 3000 },
      ],
      [{ personId: 'mae', amount: 6000 }],
    );
    expect(result).toEqual([
      { personId: 'mae', charged: 15050, future: 0, settled: 6000, balance: 9050 },
      { personId: 'joao', charged: 3000, future: 0, settled: 0, balance: 3000 },
    ]);
  });

  it('separa o valor de parcelas em faturas futuras', () => {
    const [b] = computeBalances(
      [
        { personId: 'mae', amount: 3333 },
        { personId: 'mae', amount: 3333, future: true },
        { personId: 'mae', amount: 3334, future: true },
      ],
      [],
    );
    expect(b).toMatchObject({ charged: 10000, future: 6667, balance: 10000 });
  });

  it('acerto maior que os gastos deixa saldo negativo (crédito da pessoa)', () => {
    const [b] = computeBalances(
      [{ personId: 'joao', amount: 1000 }],
      [{ personId: 'joao', amount: 1500 }],
    );
    expect(b.balance).toBe(-500);
  });

  it('inclui quem só tem acertos', () => {
    expect(computeBalances([], [{ personId: 'x', amount: 100 }])).toEqual([
      { personId: 'x', charged: 0, future: 0, settled: 100, balance: -100 },
    ]);
  });

  it('ordena do maior saldo devedor para o menor', () => {
    const result = computeBalances(
      [
        { personId: 'a', amount: 100 },
        { personId: 'b', amount: 900 },
        { personId: 'c', amount: 500 },
      ],
      [],
    );
    expect(result.map((r) => r.personId)).toEqual(['b', 'c', 'a']);
  });
});
