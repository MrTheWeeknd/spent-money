import { CreditCard, Info, Wallet } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCycle, useSettings } from '@/api/finance';
import { PersonAvatar } from '@/components/badges';
import { CategoryBars } from '@/components/charts/CategoryBars';
import { BackHeader } from '@/components/layout/BackHeader';
import { Money } from '@/components/Money';
import { MonthSwitcher } from '@/components/MonthSwitcher';
import { Skeleton } from '@/components/Skeleton';
import { ListGroup } from '@/components/ui/list';
import { useCatalog } from '@/hooks/useCatalog';
import { currentCycleMonth, cycleRange } from '@/lib/cycle';
import { monthLabel } from '@/lib/dates';
import { ddmm } from '@/lib/invoice';
import { formatBRL } from '@/lib/money';
import { cn } from '@/lib/utils';

/**
 * Balanço do "meu mês": o ciclo que fecha no dia configurado (ex.: dia 2, depois
 * de receber no dia 30 e pagar o último cartão). Mostra só o que EU gastei.
 */
export function BalancePage() {
  const settings = useSettings();
  const endDay = settings.data?.cycleEndDay ?? null;
  const home = currentCycleMonth(endDay);
  const [chosen, setChosen] = useState<string | null>(null);
  const month = chosen ?? home;
  const { data, isPending } = useCycle(settings.isPending ? undefined : month);
  const cat = useCatalog();

  const over = data ? data.balance < 0 : false;
  const pct = data && data.income.total > 0 ? Math.min(100, Math.round((data.mine.total / data.income.total) * 100)) : 0;

  return (
    <>
      <BackHeader to="/" back="Início" title="Meu mês" />
      <MonthSwitcher
        value={month}
        onChange={setChosen}
        home={home}
        className="px-2"
        label={(m) => `Ciclo de ${monthLabel(m, { short: true }).toLowerCase()}`}
      />

      {isPending || !data ? (
        <div className="space-y-3 px-4" aria-busy="true">
          <Skeleton className="h-48 rounded-3xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      ) : (
        <>
          <section className="mx-4 mt-2 mb-6 rounded-3xl bg-surface p-5" aria-label="Balanço do ciclo">
            <p className="text-sm text-muted">
              Quanto EU gastei · {cycleRange(data.start, data.end)}
            </p>
            <p className="font-display text-[40px] leading-tight font-bold tracking-tight tabular">{formatBRL(data.mine.total)}</p>
            <p className="text-sm text-muted tabular">
              de <Money cents={data.income.total} type="income" className="font-semibold" /> de renda no ciclo
              {data.income.planned > 0 && <> ({formatBRL(data.income.planned)} ainda a receber)</>}
            </p>

            <div
              className="mt-4 h-2.5 overflow-hidden rounded-full bg-surface-2"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Parte da renda gasta por mim"
            >
              <div className={cn('h-full rounded-full', over ? 'bg-danger' : 'bg-accent')} style={{ width: `${pct}%` }} />
            </div>

            <div className="mt-4 flex items-end justify-between border-t border-separator pt-3">
              <span className="text-sm text-muted">{over ? 'Faltou no ciclo' : 'Sobra do ciclo'}</span>
              <span className={cn('font-display text-2xl font-bold tabular', over ? 'text-expense' : 'text-income')}>
                {formatBRL(Math.abs(data.balance))}
              </span>
            </div>
            {data.mine.planned > 0 && (
              <p className="mt-1 text-xs text-muted">
                Inclui {formatBRL(data.mine.planned)} previstos (recorrentes ainda não pagos).
              </p>
            )}
          </section>

          <ListGroup header="Minha parte nas faturas do ciclo">
            {data.byCard.map((c) => {
              const card = cat.card.get(c.cardId);
              if (!card) return null;
              return (
                <li key={`${c.cardId}-${c.month}`}>
                  <Link
                    to={`/cartoes/${c.cardId}?fatura=${c.month}`}
                    className="flex min-h-14 items-center gap-3 px-4 py-2 active:bg-surface-2"
                  >
                    <span className="h-8 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: card.color }} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{card.name}</span>
                      <span className="block text-sm text-muted">
                        vence {ddmm(c.dueDate)}
                        {c.total > c.mine && ` · fatura ${formatBRL(c.total)}`}
                      </span>
                    </span>
                    <span className="font-semibold tabular">{formatBRL(c.mine)}</span>
                  </Link>
                </li>
              );
            })}
            <li className="flex min-h-14 items-center gap-3 px-4 py-2">
              <Wallet className="size-5 shrink-0 text-muted" aria-hidden />
              <span className="flex-1">
                Pix, débito e dinheiro
                <span className="block text-sm text-muted">no período do ciclo</span>
              </span>
              <span className="font-semibold tabular">{formatBRL(data.mine.other)}</span>
            </li>
          </ListGroup>

          {data.byCategory.length > 0 && (
            <section className="mx-4 mb-6">
              <h2 className="mb-1.5 px-4 text-[13px] text-muted uppercase">Meus gastos por categoria</h2>
              <div className="rounded-2xl bg-surface p-4">
                <CategoryBars data={data.byCategory} limit={8} />
              </div>
            </section>
          )}

          {data.others.total > 0 && (
            <ListGroup
              header="Gastos de terceiros nos seus cartões"
              footer="Não entram no que você gastou. O que eles devem fica em Pessoas."
            >
              {data.others.byPerson.map((o) => {
                const p = cat.person.get(o.personId);
                if (!p) return null;
                return (
                  <li key={o.personId}>
                    <Link to={`/pessoas/${o.personId}`} className="flex min-h-12 items-center gap-3 px-4 py-2 active:bg-surface-2">
                      <PersonAvatar person={p} size="sm" />
                      <span className="flex-1">{p.name}</span>
                      <span className="tabular">{formatBRL(o.amount)}</span>
                    </Link>
                  </li>
                );
              })}
            </ListGroup>
          )}

          <ListGroup header="Receitas do ciclo">
            <li className="flex min-h-12 items-center justify-between px-4">
              <span>Recebido</span>
              <Money cents={data.income.received} type="income" className="font-semibold" />
            </li>
            <li className="flex min-h-12 items-center justify-between px-4">
              <span>Previsto</span>
              <span className="tabular text-muted">{formatBRL(data.income.planned)}</span>
            </li>
          </ListGroup>

          <p className="mx-8 mb-6 flex gap-2 text-[13px] text-muted">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              {data.endDay ? (
                <>
                  O ciclo fecha todo dia {data.endDay}: entram as faturas que vencem no período (pelo dia de vencimento do
                  cartão, mesmo que o banco empurre para o dia útil seguinte), suas compras em Pix/débito/dinheiro e as
                  receitas recebidas nele.
                </>
              ) : (
                <>Ciclo pelo mês do calendário.</>
              )}{' '}
              <Link to="/configuracoes" className="text-accent">
                Mudar o dia
              </Link>
            </span>
          </p>
        </>
      )}
    </>
  );
}

/** Resumo do ciclo atual para o Início. */
export function CycleSummaryCard() {
  const { data } = useCycle();
  if (!data) return null;
  const over = data.balance < 0;
  return (
    <Link
      to="/balanco"
      className="mx-4 mb-6 flex items-center gap-3 rounded-2xl bg-surface p-4 active:bg-surface-2"
      aria-label={`Meu mês, ${cycleRange(data.start, data.end)}: gastei ${formatBRL(data.mine.total)}, ${over ? 'faltou' : 'sobra'} ${formatBRL(Math.abs(data.balance))}`}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
        <CreditCard className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm text-muted">Meu mês · {cycleRange(data.start, data.end)}</span>
        <span className="block font-semibold tabular">Gastei {formatBRL(data.mine.total)}</span>
      </span>
      <span className="text-right">
        <span className="block text-xs text-muted">{over ? 'Faltou' : 'Sobra'}</span>
        <span className={cn('font-semibold tabular', over ? 'text-expense' : 'text-income')}>
          {formatBRL(Math.abs(data.balance))}
        </span>
      </span>
    </Link>
  );
}
