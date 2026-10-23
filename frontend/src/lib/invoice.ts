import type { InvoiceSummary } from '@/api/types';
import { cap } from './dates';

const weekday = (day: string) => {
  const [y, m, d] = day.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(new Date(y, m - 1, d)).replace('.', '');
};
const ddmm = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;

/**
 * "vence seg, 23/11 (dia 22 é domingo)" — deixa claro quando o vencimento foi
 * levado ao próximo dia útil ou ajustado manualmente.
 */
export function formatDueDay(inv: Pick<InvoiceSummary, 'dueDate' | 'nominalDueDate' | 'dueAdjusted' | 'dueShifted'>): string {
  const base = `vence ${weekday(inv.dueDate)}, ${ddmm(inv.dueDate)}`;
  if (inv.dueAdjusted) return `${base} · data ajustada`;
  if (inv.dueShifted) return `${base} · dia ${inv.nominalDueDate.slice(8, 10)} não é dia útil`;
  return base;
}

export function formatClosingDay(inv: Pick<InvoiceSummary, 'closingDate' | 'closingAdjusted'>): string {
  return `${cap(weekday(inv.closingDate))}, ${ddmm(inv.closingDate)}${inv.closingAdjusted ? ' · ajustada' : ''}`;
}

export { ddmm, weekday };
