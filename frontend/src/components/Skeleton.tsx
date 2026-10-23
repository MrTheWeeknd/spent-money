import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-lg bg-surface-2', className)} />;
}

/** Placeholder de um ListGroup enquanto carrega. */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="mx-4 mb-6 divide-y divide-separator rounded-2xl bg-surface" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
