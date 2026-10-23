import { cn } from '@/lib/utils';
import { CreditCard, House, List, Plus, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const tabs = [
  // Cartões em segundo: o app é focado no crédito.
  { to: '/', label: 'Início', icon: House, end: true },
  { to: '/cartoes', label: 'Cartões', icon: CreditCard },
  null,
  { to: '/lancamentos', label: 'Lançamentos', icon: List },
  { to: '/pessoas', label: 'Pessoas', icon: Users },
] as const;

export function TabBar({ onAdd }: { onAdd: () => void }) {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-separator bg-surface/85 pb-safe backdrop-blur-xl"
    >
      <ul className="mx-auto grid h-14 max-w-lg grid-cols-5 items-center">
        {tabs.map((tab) =>
          tab === null ? (
            <li key="add" className="flex justify-center">
              <button
                type="button"
                onClick={onAdd}
                aria-label="Novo lançamento"
                className="-mt-6 flex size-14 items-center justify-center rounded-full bg-fab text-fab-fg shadow-lg shadow-fab/30 transition-transform active:scale-95"
              >
                <Plus className="size-7" strokeWidth={2.5} />
              </button>
            </li>
          ) : (
            <li key={tab.to}>
              <NavLink
                to={tab.to}
                end={'end' in tab}
                className={({ isActive }) =>
                  cn(
                    'tap flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium',
                    isActive ? 'text-accent' : 'text-muted',
                  )
                }
              >
                <tab.icon className="size-6" aria-hidden />
                {tab.label}
              </NavLink>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}
