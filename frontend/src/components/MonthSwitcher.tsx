import { ChevronLeft, ChevronRight } from 'lucide-react';
import { localMonth, monthLabel, shiftMonth } from '@/lib/dates';
import { cn } from '@/lib/utils';

export function MonthSwitcher({
  value,
  onChange,
  className,
  label = monthLabel,
  home,
}: {
  value: string;
  onChange: (ym: string) => void;
  className?: string;
  label?: (ym: string) => string;
  /** Mês para onde "voltar" leva (padrão: mês atual). */
  home?: string;
}) {
  const current = home ?? localMonth();
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <button
        type="button"
        onClick={() => onChange(shiftMonth(value, -1))}
        aria-label="Mês anterior"
        className="tap flex items-center justify-center rounded-full text-accent active:bg-surface"
      >
        <ChevronLeft className="size-6" />
      </button>
      <button
        type="button"
        onClick={() => onChange(current)}
        disabled={value === current}
        className="flex min-h-11 flex-col items-center justify-center px-2 font-semibold"
        aria-label={`${label(value)}${value !== current ? '. Toque para voltar ao mês inicial' : ''}`}
      >
        <span aria-live="polite">{label(value)}</span>
        {value !== current && <span className="text-xs font-normal text-accent">{home ? 'voltar para a próxima' : 'voltar para hoje'}</span>}
      </button>
      <button
        type="button"
        onClick={() => onChange(shiftMonth(value, 1))}
        aria-label="Próximo mês"
        className="tap flex items-center justify-center rounded-full text-accent active:bg-surface"
      >
        <ChevronRight className="size-6" />
      </button>
    </div>
  );
}
