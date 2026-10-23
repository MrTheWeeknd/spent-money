import { Plus, Repeat, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useDeleteTransaction, useToggleStatus, useTransactions } from '@/api/transactions';
import type { Transaction } from '@/api/types';
import { CategoryBars } from '@/components/charts/CategoryBars';
import { EmptyState } from '@/components/EmptyState';
import { BackHeader } from '@/components/layout/BackHeader';
import { Money } from '@/components/Money';
import { MonthSwitcher } from '@/components/MonthSwitcher';
import { useQuickAdd } from '@/components/quick-add/context';
import { ListSkeleton } from '@/components/Skeleton';
import { TransactionRow } from '@/components/TransactionRow';
import { Button } from '@/components/ui/button';
import { ListGroup } from '@/components/ui/list';
import { useCatalog } from '@/hooks/useCatalog';
import { localMonth } from '@/lib/dates';
import { formatBRL } from '@/lib/money';

export function IncomesPage() {
  const [month, setMonth] = useState(localMonth());
  const { data, isPending } = useTransactions({ month, type: 'income' });
  const cat = useCatalog();
  const quickAdd = useQuickAdd();
  const toggle = useToggleStatus();
  const remove = useDeleteTransaction();

  const s = useMemo(() => summarize(data ?? []), [data]);
  const pct = s.received + s.planned > 0 ? Math.round((s.received / (s.received + s.planned)) * 100) : 0;

  return (
    <>
      <BackHeader
        to="/"
        back="Início"
        title="Receitas"
        action={
          <button
            type="button"
            onClick={() => quickAdd.open({ type: 'income' })}
            aria-label="Nova receita"
            className="tap -mr-2 flex items-center justify-center text-accent"
          >
            <Plus className="size-6" />
          </button>
        }
      />
      <MonthSwitcher value={month} onChange={setMonth} className="px-2" />

      {isPending ? (
        <ListSkeleton />
      ) : !data?.length ? (
        <EmptyState
          icon={TrendingUp}
          title="Nenhuma receita neste mês"
          description="Cadastre seu salário como recorrente para ver o previsto dos próximos meses."
          action={<Button onClick={() => quickAdd.open({ type: 'income' })}>Nova receita</Button>}
        />
      ) : (
        <>
          <section className="mx-4 mt-2 mb-6 rounded-3xl bg-surface p-5" aria-label="Resumo de receitas">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-muted">Recebido</p>
                <Money cents={s.received} type="income" className="font-display text-[28px] font-bold" />
              </div>
              <div>
                <p className="text-sm text-muted">A receber</p>
                <Money cents={s.planned} className="font-display text-[28px] font-bold text-muted" />
              </div>
            </div>
            <div
              className="mt-3 h-2 rounded-full bg-surface-2"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Recebido do previsto"
            >
              <div className="h-2 rounded-full bg-income" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1 text-sm text-muted">
              {pct}% de {formatBRL(s.received + s.planned)} previstos no mês
            </p>
          </section>

          <ListGroup header="Lançamentos">
            {data.map((tx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                showDate
                onOpen={() => quickAdd.edit(tx)}
                onDelete={() => remove(tx)}
                onToggleStatus={() => toggle(tx)}
              />
            ))}
          </ListGroup>

          <section className="mx-4 mb-6">
            <h2 className="mb-1.5 px-4 text-[13px] text-muted uppercase">Por categoria</h2>
            <div className="rounded-2xl bg-surface p-4">
              <CategoryBars data={s.byCategory} />
            </div>
          </section>

          {s.byAccount.length > 0 && (
            <ListGroup header="Por conta">
              {s.byAccount.map(({ accountId, total }) => {
                const a = accountId ? cat.account.get(accountId) : undefined;
                return (
                  <li key={accountId ?? 'none'} className="flex min-h-12 items-center gap-3 px-4">
                    <span className="size-3 rounded-full" style={{ backgroundColor: a?.color ?? '#8e8e93' }} aria-hidden />
                    <span className="flex-1">{a?.name ?? 'Sem conta'}</span>
                    <span className="tabular">{formatBRL(total)}</span>
                  </li>
                );
              })}
            </ListGroup>
          )}

          {s.recurring.length > 0 && (
            <ListGroup header="Recorrentes" footer="Para mudar o valor dos próximos meses, edite um lançamento e escolha “Este e próximos”.">
              {s.recurring.map((tx) => (
                <li key={tx.id} className="flex min-h-12 items-center gap-3 px-4 py-2">
                  <Repeat className="size-5 text-muted" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{tx.description || cat.category.get(tx.categoryId)?.name}</span>
                    <span className="block text-sm text-muted">Todo dia {tx.recurrence?.day}</span>
                  </span>
                  <span className="tabular">{formatBRL(tx.amount)}</span>
                </li>
              ))}
            </ListGroup>
          )}
        </>
      )}
    </>
  );
}

function summarize(list: Transaction[]) {
  let received = 0;
  let planned = 0;
  const cats = new Map<string, number>();
  const accounts = new Map<string | null, number>();
  const recurring = new Map<string, Transaction>();
  for (const t of list) {
    if (t.status === 'confirmed') received += t.amount;
    else planned += t.amount;
    cats.set(t.categoryId, (cats.get(t.categoryId) ?? 0) + t.amount);
    const acc = t.accountId ?? null;
    accounts.set(acc, (accounts.get(acc) ?? 0) + t.amount);
    if (t.recurrence) recurring.set(t.recurrence.groupId, t);
  }
  return {
    received,
    planned,
    byCategory: [...cats].map(([categoryId, total]) => ({ categoryId, total })).sort((a, b) => b.total - a.total),
    byAccount:
      accounts.size === 1 && accounts.has(null)
        ? []
        : [...accounts].map(([accountId, total]) => ({ accountId, total })).sort((a, b) => b.total - a.total),
    recurring: [...recurring.values()],
  };
}
