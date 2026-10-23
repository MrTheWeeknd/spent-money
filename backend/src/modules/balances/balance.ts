export interface Charge {
  personId: string;
  amount: number;
  /** true quando a parcela vence em fatura futura (ainda não "devida"). */
  future?: boolean;
}
export interface Payment {
  personId: string;
  amount: number;
}

export interface PersonBalance {
  personId: string;
  /** Total gasto pela pessoa (parcelas atribuídas a ela). */
  charged: number;
  /** Parte do total que está em faturas futuras. */
  future: number;
  /** Total já acertado (pago a mim). */
  settled: number;
  /** Saldo devedor = gastos − acertos. Negativo = pagou a mais. */
  balance: number;
}

/** Saldo devedor de cada pessoa = soma das parcelas atribuídas − soma dos acertos. */
export function computeBalances(charges: Charge[], payments: Payment[]): PersonBalance[] {
  const map = new Map<string, PersonBalance>();
  const get = (personId: string) => {
    let b = map.get(personId);
    if (!b) map.set(personId, (b = { personId, charged: 0, future: 0, settled: 0, balance: 0 }));
    return b;
  };
  for (const c of charges) {
    const b = get(c.personId);
    b.charged += c.amount;
    if (c.future) b.future += c.amount;
  }
  for (const p of payments) get(p.personId).settled += p.amount;
  for (const b of map.values()) b.balance = b.charged - b.settled;
  return [...map.values()].sort((a, b) => b.balance - a.balance);
}
