import { invoiceByDueMonth } from '../installments/billing';
import { statusOf } from './invoices.service';

describe('statusOf (status da fatura)', () => {
  // Fecha 25/10, vence 05/11.
  const inv = invoiceByDueMonth({ year: 2026, month: 11 }, { closingDay: 25, dueDay: 5 });
  const d = (month: number, day: number) => ({ year: 2026, month, day });

  it('segue o calendário: aberta → fechada → vencida', () => {
    expect(statusOf(inv, d(10, 24), 1000, 0)).toBe('open');
    expect(statusOf(inv, d(10, 25), 1000, 0)).toBe('closed');
    expect(statusOf(inv, d(11, 5), 1000, 0)).toBe('closed');
    expect(statusOf(inv, d(11, 6), 1000, 0)).toBe('past');
  });

  it('fica paga quando os pagamentos cobrem o total, em qualquer data', () => {
    expect(statusOf(inv, d(11, 1), 1000, 1000)).toBe('paid');
    expect(statusOf(inv, d(12, 1), 1000, 1200)).toBe('paid');
    expect(statusOf(inv, d(10, 20), 1000, 1000)).toBe('paid');
  });

  it('pagamento parcial não quita', () => {
    expect(statusOf(inv, d(11, 6), 1000, 999)).toBe('past');
  });

  it('fatura vazia nunca aparece como paga', () => {
    expect(statusOf(inv, d(11, 6), 0, 0)).toBe('past');
  });
});
