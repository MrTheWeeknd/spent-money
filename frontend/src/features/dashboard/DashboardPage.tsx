import { useDashboard, useInvoices } from '@/api/finance';
import { useDeleteTransaction, useToggleStatus } from '@/api/transactions';
import type { CardInvoices, MonthInvoices, PersonBalance } from '@/api/types';
import { PersonAvatar } from '@/components/badges';
import { BrandMark } from '@/components/brand/BrandLogo';
import { CategoryBars } from '@/components/charts/CategoryBars';
import { EmptyState } from '@/components/EmptyState';
import { MonthSwitcher } from '@/components/MonthSwitcher';
import { useQuickAdd } from '@/components/quick-add/context';
import { Skeleton } from '@/components/Skeleton';
import { TransactionRow } from '@/components/TransactionRow';
import { Button } from '@/components/ui/button';
import { ListGroup } from '@/components/ui/list';
import { CycleSummaryCard } from '@/features/balance/BalancePage';
import { useCatalog } from '@/hooks/useCatalog';
import { localDay, localMonth, monthLabel } from '@/lib/dates';
import { formatDueDay } from '@/lib/invoice';
import { INVOICE_STATUS_LABELS } from '@/lib/labels';
import { formatBRL } from '@/lib/money';
import { cn } from '@/lib/utils';
import { BarChart3, ChevronRight, CreditCard, Inbox, Settings, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

function HeaderLink({
  to,
  label,
  icon: Icon,
}: {
  to: string;
  label: string;
  icon: typeof Settings;
}) {
  return (
    <Link
      to={to}
      aria-label={label}
      className="tap flex items-center justify-center rounded-full text-accent active:bg-surface"
    >
      <Icon className="size-[22px]" />
    </Link>
  );
}

/**
 * Mês que interessa ao abrir o app: o da próxima fatura ainda por pagar
 * (fechada aguardando vencimento ou aberta), entre todos os cartões.
 */
function nextDueMonth(cards: CardInvoices[] | undefined): string | undefined {
  if (!cards?.length) return undefined;
  const today = localDay();
  const candidates = cards
    .flatMap((c) => [c.closed, c.current])
    .filter(
      (i): i is NonNullable<typeof i> =>
        !!i && i.dueDate >= today && i.status !== 'paid' && i.total > 0,
    )
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const fallback = cards
    .map((c) => c.current)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
  return (candidates[0] ?? fallback)?.month;
}

export function DashboardPage() {
  const overview = useInvoices();
  const [chosen, setChosen] = useState<string | null>(null);
  const home = nextDueMonth(overview.data) ?? localMonth();
  const month = chosen ?? home;
  const waitingDefault = !chosen && overview.isPending;
  const { data, isPending, isError, error, refetch } = useDashboard(month);
  const quickAdd = useQuickAdd();
  const toggle = useToggleStatus();
  const remove = useDeleteTransaction();

  return (
    <>
      <header className="flex items-center justify-between px-safe pt-3">
        <h1 className="flex items-center gap-2.5 font-display text-[34px] leading-tight font-bold tracking-tight">
          <BrandMark className="h-7" />
        </h1>
        <nav className="-mr-2 flex" aria-label="Atalhos">
          <HeaderLink to="/receitas" label="Receitas" icon={TrendingUp} />
          <HeaderLink to="/relatorios" label="Relatórios" icon={BarChart3} />
          <HeaderLink to="/configuracoes" label="Ajustes" icon={Settings} />
        </nav>
      </header>
      <MonthSwitcher
        value={month}
        onChange={setChosen}
        home={home}
        className="px-2"
        label={(m) => `Faturas de ${monthLabel(m, { short: true }).toLowerCase()}`}
      />

      {isError ? (
        <div className="px-8 py-12 text-center">
          <p className="font-semibold">Não foi possível carregar</p>
          <p className="mt-1 text-muted">{error.message}</p>
          <Button variant="ghost" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : isPending || waitingDefault ? (
        <DashboardSkeleton />
      ) : (
        <>
          <MonthInvoicesHero data={data.invoices} />
          <CycleSummaryCard />

          {data.debts.some((d) => d.balance > 0) && (
            <Debts debts={data.debts.filter((d) => d.balance > 0)} />
          )}

          {data.expenseByCategory.length > 0 && (
            <section className="mx-4 mb-6">
              <h2 className="mb-2 px-1 text-xl font-bold">Meus gastos por categoria</h2>
              <div className="rounded-2xl bg-surface p-4">
                <CategoryBars data={data.expenseByCategory} limit={5} />
              </div>
            </section>
          )}


          <section className="mb-6">
            <div className="mx-4 mb-2 flex items-end justify-between px-1">
              <h2 className="text-xl font-bold">Últimos lançamentos</h2>
              <Link to="/lancamentos" className="tap flex items-center text-accent">
                Ver todos
              </Link>
            </div>
            {data.recent.length ? (
              <ul className="mx-4 divide-y divide-separator overflow-hidden rounded-2xl bg-surface">
                {data.recent.map((tx) => (
                  <TransactionRow
                    key={tx.id}
                    tx={tx}
                    showDate
                    onOpen={() => quickAdd.edit(tx)}
                    onDelete={() => remove(tx)}
                    onToggleStatus={() => toggle(tx)}
                  />
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={Inbox}
                title="Nenhum lançamento ainda"
                description="Toque no + para registrar sua primeira compra no cartão."
                action={<Button onClick={() => quickAdd.open()}>Nova compra</Button>}
              />
            )}
          </section>
        </>
      )}
    </>
  );
}

/** "Quanto deu" das faturas que vencem no mês: total, quem gastou e cada cartão. */
function MonthInvoicesHero({ data }: { data: MonthInvoices }) {
  const cat = useCatalog();
  if (!data.invoices.length) {
    return (
      <EmptyState
        icon={CreditCard}
        title="Nenhum cartão cadastrado"
        description="Cadastre seus cartões para ver quanto deu cada fatura."
        action={
          <Button asChild>
            <Link to="/configuracoes/cartoes">Cadastrar cartão</Link>
          </Button>
        }
      />
    );
  }
  const people = data.byPerson
    .map((b) => ({ ...b, person: cat.person.get(b.personId) }))
    .filter(
      (b): b is typeof b & { person: NonNullable<typeof b.person> } => !!b.person && b.amount > 0,
    );

  return (
    <>
      <section
        className="mx-4 mt-2 mb-4 rounded-3xl bg-surface p-5"
        aria-label={`Faturas de ${monthLabel(data.month)}`}
      >
        <p className="text-sm text-muted">Quanto deu</p>
        <p className="font-display text-[40px] leading-tight font-bold tracking-tight tabular">
          {formatBRL(data.total)}
        </p>
        {data.total > 0 && (
          <p className="text-sm text-muted tabular">
            {data.remaining === 0 ? (
              <span className="font-semibold text-income">Tudo pago</span>
            ) : (
              <>
                Falta pagar{' '}
                <span className="font-semibold text-fg">{formatBRL(data.remaining)}</span>
                {data.paid > 0 && <> · pago {formatBRL(data.paid)}</>}
              </>
            )}
          </p>
        )}

        {people.length > 0 && data.total > 0 && (
          <div className="mt-4">
            {/* Barra empilhada por pessoa; a identidade vem da lista abaixo (nome + valor). */}
            <div className="flex h-3 gap-0.5 overflow-hidden rounded-full" aria-hidden>
              {people.map((b) => (
                <span
                  key={b.personId}
                  style={{
                    width: `${(b.amount / data.total) * 100}%`,
                    backgroundColor: b.person.color,
                  }}
                />
              ))}
            </div>
            <ul className="mt-3 space-y-2">
              {people.map((b) => (
                <li key={b.personId} className="flex items-center gap-2.5">
                  <PersonAvatar person={b.person} size="sm" />
                  <span className="flex-1">{b.person.isSelf ? 'Eu' : b.person.name}</span>
                  <span className="font-semibold tabular">{formatBRL(b.amount)}</span>
                  <span className="w-10 text-right text-sm text-muted tabular">
                    {Math.round((b.amount / data.total) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <ListGroup header="Faturas do mês">
        {data.invoices.map((inv) => {
          const card = cat.card.get(inv.cardId);
          if (!card) return null;
          return (
            <li key={inv.cardId}>
              <Link
                to={`/cartoes/${inv.cardId}?fatura=${inv.month}`}
                className="flex min-h-16 items-center gap-3 px-4 py-2.5 active:bg-surface-2"
              >
                <span
                  className="h-9 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: card.color }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{card.name}</span>
                  <span className="block truncate text-sm text-muted">{formatDueDay(inv)}</span>
                </span>
                <span className="flex flex-col items-end">
                  <span className="font-semibold tabular">{formatBRL(inv.total)}</span>
                  <StatusPill status={inv.status} />
                </span>
                <ChevronRight className="size-5 shrink-0 text-muted/60" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ListGroup>
    </>
  );
}

function StatusPill({ status }: { status: MonthInvoices['invoices'][number]['status'] }) {
  return (
    <span
      className={cn(
        'mt-0.5 rounded-full px-1.5 text-[11px] font-semibold',
        status === 'paid' && 'bg-income/15 text-income',
        status === 'past' && 'bg-danger/15 text-danger',
        status === 'closed' && 'bg-warning/15 text-warning-fg',
        status === 'open' && 'bg-surface-2 text-muted',
      )}
    >
      {INVOICE_STATUS_LABELS[status]}
    </span>
  );
}

function Debts({ debts }: { debts: PersonBalance[] }) {
  const cat = useCatalog();
  return (
    <ListGroup header="Quem te deve">
      {debts.map((d) => {
        const p = cat.person.get(d.personId);
        if (!p) return null;
        return (
          <li key={d.personId}>
            <Link
              to={`/pessoas/${d.personId}`}
              className="flex min-h-14 items-center gap-3 px-4 py-2 active:bg-surface-2"
            >
              <PersonAvatar person={p} />
              <span className="min-w-0 flex-1">
                <span className="block truncate">{p.name}</span>
                {d.future > 0 && (
                  <span className="block text-sm text-muted">
                    {formatBRL(d.future)} em parcelas futuras
                  </span>
                )}
              </span>
              <span className="font-semibold tabular">{formatBRL(d.balance)}</span>
              <ChevronRight className="size-5 text-muted/60" aria-hidden />
            </Link>
          </li>
        );
      })}
    </ListGroup>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando">
      <div className="mx-4 mt-2 mb-4 space-y-3 rounded-3xl bg-surface p-5">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-3 w-full rounded-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
      </div>
      <div className="mx-4 space-y-2 rounded-2xl bg-surface p-4">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
    </div>
  );
}
