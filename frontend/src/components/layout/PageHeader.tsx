import type { ReactNode } from 'react';

/** Título grande estilo iOS, com ação opcional à direita. */
export function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <header className="flex items-end justify-between px-safe pt-4 pb-2">
      <h1 className="font-display text-[34px] leading-tight font-bold tracking-tight">{title}</h1>
      {action}
    </header>
  );
}
