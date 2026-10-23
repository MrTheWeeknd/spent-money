import { Inbox, Search, SlidersHorizontal, X } from 'lucide-react';
import { useDeferredValue, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDeleteTransaction, useToggleStatus, useTransactions } from '@/api/transactions';
import type { Transaction, TransactionFilters } from '@/api/types';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/layout/PageHeader';
import { Money } from '@/components/Money';
import { MonthSwitcher } from '@/components/MonthSwitcher';
import { useQuickAdd } from '@/components/quick-add/context';
import { ListSkeleton } from '@/components/Skeleton';
import { TransactionRow } from '@/components/TransactionRow';
import { Button } from '@/components/ui/button';
import { dayLabel, localDay, localMonth } from '@/lib/dates';
import { formatBRL } from '@/lib/money';
import { cn } from '@/lib/utils';
import { FiltersSheet, type ListFilters } from './FiltersSheet';
import { ChipRow } from '@/components/quick-add/ChipRow';
import { useCatalog } from '@/hooks/useCatalog';

const FILTER_KEYS = ['type', 'status', 'method', 'cardId', 'personId', 'categoryId', 'accountId'] as const;

export function TransactionsPage() {
  const [params, setParams] = useSearchParams();
  const month = params.get('mes') ?? localMonth();
  const filters: ListFilters = Object.fromEntries(
    FILTER_KEYS.map((k) => [k, params.get(k) ?? undefined]).filter(([, v]) => v),
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const q = useDeferredValue(search.trim());
  const [filtersOpen, setFiltersOpen] = useState(false);

  const setParam = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    setParams(next, { replace: true });
  };

  // Com busca, procura em todo o histórico; sem busca, mostra o mês.
  const query: TransactionFilters = { ...filters, ...(q ? { q } : { month }) };
  const { data, isPending, isError, error, refetch } = useTransactions(query);
  const quickAdd = useQuickAdd();
  const toggle = useToggleStatus();
  const remove = useDeleteTransaction();
  const activeFilters = Object.keys(filters).length;
  const cat = useCatalog();

  const groups = useMemo(() => groupByDay(data ?? []), [data]);
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of data ?? []) {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    }
    return { income, expense };
  }, [data]);

  return (
    <>
      <PageHeader
        title="Lançamentos"
        action={
          <div className="-mr-2 flex">
            <button
              type="button"
              onClick={() => setSearchOpen((s) => !s)}
              aria-label="Buscar"
              aria-expanded={searchOpen}
              className="tap flex items-center justify-center rounded-full text-accent active:bg-surface"
            >
              <Search className="size-[22px]" />
            </button>
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              aria-label={`Filtros${activeFilters ? ` (${activeFilters} ativos)` : ''}`}
              className="tap relative flex items-center justify-center rounded-full text-accent active:bg-surface"
            >
              <SlidersHorizontal className="size-[22px]" />
              {activeFilters > 0 && (
                <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-fg">
                  {activeFilters}
                </span>
              )}
            </button>
          </div>
        }
      />

      {searchOpen && (
        <div className="relative mx-4 mb-2">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar em todo o histórico"
            aria-label="Buscar lançamentos"
            enterKeyHint="search"
            className="h-11 w-full rounded-xl bg-surface pr-10 pl-9 text-base outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Limpar busca"
              className="absolute top-0 right-0 flex size-11 items-center justify-center text-muted"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      )}

      {!q && <MonthSwitcher value={month} onChange={(m) => setParam({ mes: m === localMonth() ? undefined : m })} className="px-2" />}

      {cat.people.length > 1 && (
        <div className="px-4 pb-3">
          {/* Atalho para o filtro mais usado: quem gastou. */}
          <ChipRow
            label="Quem gastou"
            value={filters.personId ?? 'all'}
            onChange={(v) => setParam({ personId: v === 'all' ? undefined : v })}
            options={[
              { value: 'all', label: 'Todos' },
              ...cat.people.map((p) => ({ value: p.id, label: p.isSelf ? 'Eu' : p.name, color: p.color })),
            ]}
          />
        </div>
      )}

      {data && data.length > 0 && (
        <div className="mx-4 mb-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-surface px-4 py-2.5">
            <span className="text-muted">Entradas</span>
            <Money cents={totals.income} type="income" className="block text-base font-semibold" />
          </div>
          <div className="rounded-2xl bg-surface px-4 py-2.5">
            <span className="text-muted">Saídas</span>
            <Money cents={totals.expense} className="block text-base font-semibold" />
          </div>
        </div>
      )}

      {isError ? (
        <div className="px-8 py-12 text-center">
          <p className="font-semibold">Não foi possível carregar</p>
          <p className="mt-1 text-muted">{error.message}</p>
          <Button variant="ghost" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : isPending ? (
        <ListSkeleton rows={6} />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={q ? 'Nada encontrado' : activeFilters ? 'Nenhum lançamento com esses filtros' : 'Nenhum lançamento neste mês'}
          description={q ? `Nenhum lançamento com “${q}”.` : 'Toque no + para adicionar.'}
          action={
            activeFilters ? (
              <Button variant="secondary" onClick={() => setParam(Object.fromEntries(FILTER_KEYS.map((k) => [k, undefined])))}>
                Limpar filtros
              </Button>
            ) : undefined
          }
        />
      ) : (
        groups.map(({ day, items, net }) => (
          <section key={day} className="mb-4" aria-label={dayLabel(day)}>
            <h2 className="mx-4 mb-1 flex justify-between px-4 text-[13px] text-muted">
              <span className="font-medium">{dayLabel(day)}</span>
              <span className={cn('tabular', net > 0 && 'text-income')}>{formatBRL(net)}</span>
            </h2>
            <ul className="mx-4 divide-y divide-separator overflow-hidden rounded-2xl bg-surface">
              {items.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  tx={tx}
                  onOpen={() => quickAdd.edit(tx)}
                  onDelete={() => remove(tx)}
                  onToggleStatus={() => toggle(tx)}
                />
              ))}
            </ul>
          </section>
        ))
      )}

      <FiltersSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        value={filters}
        onChange={(f) => setParam(Object.fromEntries(FILTER_KEYS.map((k) => [k, f[k]])))}
      />
    </>
  );
}

function groupByDay(list: Transaction[]) {
  const map = new Map<string, { day: string; items: Transaction[]; net: number }>();
  for (const tx of list) {
    const day = localDay(tx.date);
    let g = map.get(day);
    if (!g) map.set(day, (g = { day, items: [], net: 0 }));
    g.items.push(tx);
    g.net += tx.type === 'income' ? tx.amount : -tx.amount;
  }
  return [...map.values()];
}
