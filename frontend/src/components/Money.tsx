import { formatBRL } from '@/lib/money';
import { cn } from '@/lib/utils';

/** Valor em reais. Com `type`, receitas ficam verdes; `signed` mostra + / − explícito. */
export function Money({
  cents,
  type,
  signed,
  className,
}: {
  cents: number;
  type?: 'income' | 'expense';
  signed?: boolean;
  className?: string;
}) {
  const text = signed && type ? `${type === 'income' ? '+' : '−'} ${formatBRL(Math.abs(cents))}` : formatBRL(cents);
  return <span className={cn('tabular whitespace-nowrap', type === 'income' && 'text-income', className)}>{text}</span>;
}
