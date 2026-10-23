import { BarChart3 } from 'lucide-react';
import { useState } from 'react';
import { useCategoryReport, useMonthly } from '@/api/finance';
import type { TransactionType } from '@/api/types';
import { CategoryBars } from '@/components/charts/CategoryBars';
import { MonthlyBars } from '@/components/charts/MonthlyBars';
import { EmptyState } from '@/components/EmptyState';
import { BackHeader } from '@/components/layout/BackHeader';
import { Skeleton } from '@/components/Skeleton';
import { Segmented } from '@/components/ui/segmented';
import { localMonth, monthLabel, shiftMonth } from '@/lib/dates';
import { formatBRL, formatNumber } from '@/lib/money';
import { cn } from '@/lib/utils';

const RANGE_OPTIONS = [
  { value: '6', label: '6 meses' },
  { value: '12', label: '12 meses' },
];
const TYPE_OPTIONS = [
  { value: 'expense' as const, label: 'Despesas' },
  { value: 'income' as const, label: 'Receitas' },
];

export function ReportsPage() {
  const [range, setRange] = useState('6');
  const [type, setType] = useState<TransactionType>('expense');
  const months = Number(range);
  const to = localMonth();
  const from = shiftMonth(to, -(months - 1));
  const monthly = useMonthly(months);
  const categories = useCategoryReport(from, to, type);
  const rows = monthly.data ?? [];
  const sum = rows.reduce(
    (s, r) => ({ income: s.income + r.income + r.incomePlanned, expense: s.expense + r.expense + r.expensePlanned }),
    { income: 0, expense: 0 },
  );
  const empty = rows.length > 0 && sum.income === 0 && sum.expense === 0;

  return (
    <>
      <BackHeader to="/" back="Início" title="Relatórios" />
      <div className="px-4 pb-4">
        <Segmented label="Período" value={range} onValueChange={setRange} options={RANGE_OPTIONS} />
      </div>

      {monthly.isPending ? (
        <div className="px-4">
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : empty ? (
        <EmptyState icon={BarChart3} title="Sem dados no período" description="Os relatórios aparecem conforme você lança receitas e despesas." />
      ) : (
        <>
          <section className="mx-4 mb-6" aria-labelledby="evolucao">
            <h2 id="evolucao" className="mb-2 px-1 text-xl font-bold">
              Receitas x despesas
            </h2>
            <div className="rounded-2xl bg-surface p-4">
              <MonthlyBars key={range} data={rows} />
              <p className="mt-3 text-xs text-muted">
                Crédito conta no mês da fatura. Gastos de terceiros não entram nas suas despesas. Barras claras = só previsto.
              </p>
            </div>
          </section>

          <section className="mx-4 mb-6" aria-labelledby="tabela">
            <h2 id="tabela" className="mb-1.5 px-4 text-[13px] text-muted uppercase">
              Mês a mês (R$)
            </h2>
            <div className="overflow-hidden rounded-2xl bg-surface">
              <table className="w-full text-[13px] tabular">
                <caption className="sr-only">Receitas, despesas e saldo por mês, em reais</caption>
                <thead className="text-muted">
                  <tr className="border-b border-separator">
                    <th scope="col" className="px-3 py-2 text-left font-medium">Mês</th>
                    <th scope="col" className="px-2 py-2 text-right font-medium">Receitas</th>
                    <th scope="col" className="px-2 py-2 text-right font-medium">Despesas</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-separator">
                  {[...rows].reverse().map((r) => {
                    const inc = r.income + r.incomePlanned;
                    const exp = r.expense + r.expensePlanned;
                    return (
                      <tr key={r.month}>
                        <th scope="row" className="px-3 py-2.5 text-left font-medium">
                          {monthLabel(r.month, { short: true })}
                        </th>
                        <td className="px-1.5 py-2.5 text-right">{formatNumber(inc)}</td>
                        <td className="px-1.5 py-2.5 text-right">{formatNumber(exp)}</td>
                        <td className={cn('px-3 py-2.5 text-right font-semibold', inc - exp < 0 && 'text-expense')}>
                          {formatNumber(inc - exp)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t border-separator font-semibold">
                  <tr>
                    <th scope="row" className="px-3 py-2.5 text-left">Total</th>
                    <td className="px-1.5 py-2.5 text-right">{formatNumber(sum.income)}</td>
                    <td className="px-1.5 py-2.5 text-right">{formatNumber(sum.expense)}</td>
                    <td className={cn('px-3 py-2.5 text-right', sum.income - sum.expense < 0 && 'text-expense')}>
                      {formatNumber(sum.income - sum.expense)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          <section className="mx-4 mb-6" aria-labelledby="por-categoria">
            <h2 id="por-categoria" className="mb-2 px-1 text-xl font-bold">
              Por categoria
            </h2>
            <Segmented label="Tipo" value={type} onValueChange={setType} options={TYPE_OPTIONS} className="mb-3" />
            <div className="rounded-2xl bg-surface p-4">
              {categories.data?.categories.length ? (
                <>
                  <p className="mb-3 text-sm text-muted">
                    {formatBRL(categories.data.categories.reduce((s, c) => s + c.total, 0))} em {months} meses ·{' '}
                    média {formatBRL(Math.round(categories.data.categories.reduce((s, c) => s + c.total, 0) / months))}/mês
                  </p>
                  <CategoryBars data={categories.data.categories} limit={10} />
                </>
              ) : (
                <p className="py-4 text-center text-muted">Nada no período.</p>
              )}
            </div>
          </section>
        </>
      )}
    </>
  );
}
