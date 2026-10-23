import { ChevronRight, Plus, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBalances } from '@/api/finance';
import { PersonAvatar } from '@/components/badges';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/layout/PageHeader';
import { ListSkeleton } from '@/components/Skeleton';
import { Button } from '@/components/ui/button';
import { ListGroup } from '@/components/ui/list';
import { useCatalog } from '@/hooks/useCatalog';
import { formatBRL } from '@/lib/money';
import { cn } from '@/lib/utils';

export function PeoplePage() {
  const { data, isPending } = useBalances();
  const cat = useCatalog();
  const others = cat.people.filter((p) => !p.isSelf);
  const balance = new Map((data ?? []).map((b) => [b.personId, b]));
  const total = (data ?? []).reduce((s, b) => s + Math.max(0, b.balance), 0);
  const sorted = [...others].sort((a, b) => (balance.get(b.id)?.balance ?? 0) - (balance.get(a.id)?.balance ?? 0));

  return (
    <>
      <PageHeader
        title="Pessoas"
        action={
          <Link to="/configuracoes/pessoas" aria-label="Gerenciar pessoas" className="tap -mr-2 flex items-center justify-center text-accent">
            <Plus className="size-6" />
          </Link>
        }
      />
      {isPending || !cat.ready ? (
        <ListSkeleton />
      ) : others.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Ninguém usa seus cartões?"
          description="Cadastre quem usa seus cartões para saber quanto cada um te deve."
          action={
            <Button asChild>
              <Link to="/configuracoes/pessoas">Cadastrar pessoa</Link>
            </Button>
          }
        />
      ) : (
        <>
          <section className="mx-4 mb-6 rounded-3xl bg-surface p-5">
            <p className="text-sm text-muted">Total a receber</p>
            <p className="font-display text-[36px] leading-tight font-bold tabular">{formatBRL(total)}</p>
          </section>
          <ListGroup>
            {sorted.map((p) => {
              const b = balance.get(p.id);
              const value = b?.balance ?? 0;
              return (
                <li key={p.id}>
                  <Link to={`/pessoas/${p.id}`} className="flex min-h-16 items-center gap-3 px-4 py-2 active:bg-surface-2">
                    <PersonAvatar person={p} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{p.name}</span>
                      <span className="block truncate text-sm text-muted">
                        {value > 0 ? 'te deve' : value < 0 ? 'tem crédito com você' : 'em dia'}
                        {b && b.future > 0 && ` · ${formatBRL(b.future)} em parcelas futuras`}
                      </span>
                    </span>
                    <span className={cn('font-semibold tabular', value < 0 && 'text-income', value === 0 && 'text-muted')}>
                      {formatBRL(Math.abs(value))}
                    </span>
                    <ChevronRight className="size-5 text-muted/60" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ListGroup>
        </>
      )}
    </>
  );
}
