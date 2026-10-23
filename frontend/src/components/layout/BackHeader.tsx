import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/** Cabeçalho de tela interna: voltar + título grande + ação opcional. */
export function BackHeader({ to, back, title, action }: { to: string; back: string; title: string; action?: ReactNode }) {
  return (
    <header className="px-safe pt-2 pb-3">
      <div className="flex items-center justify-between">
        <Link to={to} className="tap -ml-2 inline-flex items-center text-accent">
          <ChevronLeft className="size-6" aria-hidden /> {back}
        </Link>
        {action}
      </div>
      <h1 className="font-display text-[34px] leading-tight font-bold tracking-tight">{title}</h1>
    </header>
  );
}
