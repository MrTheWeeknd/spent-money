import type { LucideIcon } from 'lucide-react';
import { Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { BackHeader } from '@/components/layout/BackHeader';
import { ListSkeleton } from '@/components/Skeleton';
import { Button } from '@/components/ui/button';

/** Esqueleto comum das telas de cadastro: cabeçalho, estados de carga/erro/vazio e botão "Novo". */
export function CatalogScreen({
  title,
  query,
  isEmpty,
  empty,
  newLabel,
  onNew,
  children,
  sheet,
}: {
  title: string;
  query: { isPending: boolean; isError: boolean; error: Error | null; refetch: () => unknown };
  isEmpty: boolean;
  empty: { icon: LucideIcon; title: string; description: string };
  newLabel: string;
  onNew: () => void;
  children: ReactNode;
  /** Sheet de edição: fica fora do conteúdo para existir também no estado vazio. */
  sheet: ReactNode;
}) {
  return (
    <>
      <BackHeader
        to="/configuracoes"
        back="Ajustes"
        title={title}
        action={
          <button type="button" onClick={onNew} aria-label={newLabel} className="tap flex items-center justify-center text-accent">
            <Plus className="size-6" />
          </button>
        }
      />
      {query.isPending ? (
        <ListSkeleton />
      ) : query.isError ? (
        <div className="px-8 py-12 text-center">
          <p className="font-semibold">Não foi possível carregar</p>
          <p className="mt-1 text-muted">{query.error?.message}</p>
          <Button variant="ghost" className="mt-2" onClick={() => query.refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : isEmpty ? (
        <EmptyState
          {...empty}
          action={
            <Button onClick={onNew}>
              <Plus className="size-5" aria-hidden /> {newLabel}
            </Button>
          }
        />
      ) : (
        <>
          {children}
          <div className="px-4">
            <Button variant="secondary" size="lg" onClick={onNew} className="text-accent">
              <Plus className="size-5" aria-hidden /> {newLabel}
            </Button>
          </div>
        </>
      )}
      {sheet}
    </>
  );
}
