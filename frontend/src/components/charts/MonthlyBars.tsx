import { useState } from 'react';
import type { MonthlyRow } from '@/api/types';
import { monthLabel, monthShort } from '@/lib/dates';
import { formatBRL } from '@/lib/money';
import { cn } from '@/lib/utils';

const H = 160; // altura da área de plot
const BAR_GAP = 2;

/** Formato compacto para eixos: 1,2 mil / 3,4 mi. */
function compact(cents: number) {
  return new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(cents / 100);
}

/**
 * Colunas agrupadas receitas x despesas por mês (um único eixo).
 * Tocar num mês mostra os valores; a tabela abaixo é a visão acessível.
 */
export function MonthlyBars({ data }: { data: MonthlyRow[] }) {
  const [selected, setSelected] = useState<number>(data.length - 1);
  const max = Math.max(1, ...data.map((d) => Math.max(d.income + d.incomePlanned, d.expense + d.expensePlanned)));
  // Três linhas de grade "redondas".
  const step = niceStep(max / 3);
  const top = step * Math.ceil(max / step);
  const ticks = [0, step, step * 2, step * 3].filter((t) => t <= top);
  const n = data.length;
  const barW = n <= 6 ? 14 : 9;
  const sel = data[selected];

  return (
    <div>
      <div className="mb-3 flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-series-income" aria-hidden /> Receitas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-series-expense" aria-hidden /> Despesas
        </span>
      </div>

      {sel && (
        <div className="mb-5 rounded-xl bg-surface-2 px-3 py-2 text-sm" aria-live="polite">
          <span className="font-semibold">{monthLabel(sel.month)}</span>
          <div className="mt-0.5 flex flex-wrap gap-x-4 tabular">
            <span>Receitas {formatBRL(sel.income + sel.incomePlanned)}</span>
            <span>Despesas {formatBRL(sel.expense + sel.expensePlanned)}</span>
            <span className="font-medium">
              Saldo {formatBRL(sel.income + sel.incomePlanned - sel.expense - sel.expensePlanned)}
            </span>
          </div>
        </div>
      )}

      <div className="relative" style={{ height: H + 24 }}>
        {/* Grade e eixo Y */}
        {ticks.map((t) => (
          <div key={t} className="absolute inset-x-0 flex items-center" style={{ bottom: 24 + (t / top) * H }} aria-hidden>
            <span className="w-9 shrink-0 pr-1 text-right text-[10px] text-muted tabular">{compact(t)}</span>
            <span className={cn('h-px flex-1', t === 0 ? 'bg-muted/50' : 'bg-separator')} />
          </div>
        ))}
        {/* Colunas */}
        <div className="absolute top-0 right-0 bottom-0 left-9 flex" role="list">
          {data.map((d, i) => {
            const inc = d.income + d.incomePlanned;
            const exp = d.expense + d.expensePlanned;
            return (
              <button
                key={d.month}
                type="button"
                role="listitem"
                onClick={() => setSelected(i)}
                aria-label={`${monthLabel(d.month)}: receitas ${formatBRL(inc)}, despesas ${formatBRL(exp)}`}
                aria-pressed={i === selected}
                className={cn('relative flex h-full flex-1 flex-col justify-end', i === selected && 'rounded-lg bg-accent/8')}
              >
                <div className="flex items-end justify-center" style={{ height: H, gap: BAR_GAP }}>
                  <Bar value={inc} top={top} width={barW} className="bg-series-income" planned={d.incomePlanned > 0 && d.income === 0} />
                  <Bar value={exp} top={top} width={barW} className="bg-series-expense" planned={d.expensePlanned > 0 && d.expense === 0} />
                </div>
                <span className={cn('h-6 pt-1 text-center text-[11px] text-muted', i === selected && 'font-semibold text-fg')}>
                  {monthShort(d.month)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Bar({ value, top, width, className, planned }: { value: number; top: number; width: number; className: string; planned?: boolean }) {
  const h = value > 0 ? Math.max(2, (value / top) * H) : 0;
  return (
    <span
      aria-hidden
      className={cn('block rounded-t-[4px]', className, planned && 'opacity-45')}
      style={{ height: h, width }}
    />
  );
}

function niceStep(raw: number) {
  const pow = 10 ** Math.floor(Math.log10(Math.max(raw, 1)));
  const n = raw / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}
