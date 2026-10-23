import { lazy, Suspense, type ComponentType } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ListSkeleton } from '@/components/Skeleton';
import { LoginPage } from '@/features/auth/LoginPage';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { TransactionsPage } from '@/features/transactions/TransactionsPage';

// Telas menos usadas carregam sob demanda; Início e Lançamentos vão no bundle principal.
function page(load: () => Promise<Record<string, unknown>>, name: string) {
  const Component = lazy(async () => ({ default: (await load())[name] as ComponentType }));
  return (
    <Suspense fallback={<div className="pt-20"><ListSkeleton /></div>}>
      <Component />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'lancamentos', element: <TransactionsPage /> },
      { path: 'cartoes', element: page(() => import('@/features/cards/CardsPage'), 'CardsPage') },
      { path: 'cartoes/:cardId', element: page(() => import('@/features/cards/InvoicePage'), 'InvoicePage') },
      { path: 'pessoas', element: page(() => import('@/features/people/PeoplePage'), 'PeoplePage') },
      { path: 'pessoas/:personId', element: page(() => import('@/features/people/PersonPage'), 'PersonPage') },
      { path: 'balanco', element: page(() => import('@/features/balance/BalancePage'), 'BalancePage') },
      { path: 'receitas', element: page(() => import('@/features/incomes/IncomesPage'), 'IncomesPage') },
      { path: 'relatorios', element: page(() => import('@/features/reports/ReportsPage'), 'ReportsPage') },
      { path: 'configuracoes', element: page(() => import('@/features/settings/SettingsPage'), 'SettingsPage') },
      { path: 'configuracoes/cartoes', element: page(() => import('@/features/settings/CardsSettings'), 'CardsSettings') },
      { path: 'configuracoes/pessoas', element: page(() => import('@/features/settings/PeopleSettings'), 'PeopleSettings') },
      { path: 'configuracoes/categorias', element: page(() => import('@/features/settings/CategoriesSettings'), 'CategoriesSettings') },
      { path: 'configuracoes/contas', element: page(() => import('@/features/settings/AccountsSettings'), 'AccountsSettings') },
      { path: '*', element: page(() => import('@/features/NotFound'), 'NotFound') },
    ],
  },
]);
