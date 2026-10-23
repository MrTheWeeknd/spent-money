import { Outlet, ScrollRestoration } from 'react-router-dom';
import { useQuickAdd } from '@/components/quick-add/context';
import { QuickAddProvider } from '@/components/quick-add/QuickAddProvider';
import { TabBar } from './TabBar';

function Shell() {
  const quickAdd = useQuickAdd();
  return (
    <div className="min-h-dvh">
      <main className="mx-auto max-w-lg pt-safe pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
      <TabBar onAdd={() => quickAdd.open()} />
      <ScrollRestoration />
    </div>
  );
}

export function AppLayout() {
  return (
    <QuickAddProvider>
      <Shell />
    </QuickAddProvider>
  );
}
