import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, API_BASE } from './client';
import type {
  Scope,
  Transaction,
  TransactionDefaults,
  TransactionFilters,
  TransactionInput,
} from './types';

export const txKeys = {
  all: ['transactions'] as const,
  list: (f: TransactionFilters) => ['transactions', 'list', f] as const,
  defaults: ['transactions', 'defaults'] as const,
};

/** Tudo que depende de lançamentos (listas, faturas, saldos, relatórios). */
export function invalidateFinance(qc: QueryClient) {
  return Promise.all(
    [txKeys.all, ['invoices'], ['balances'], ['reports'], ['settlements']].map((queryKey) =>
      qc.invalidateQueries({ queryKey }),
    ),
  );
}

function toQuery(f: TransactionFilters) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) if (v !== undefined && v !== '' && v !== false) params.set(k, String(v));
  const s = params.toString();
  return s ? `?${s}` : '';
}

export function useTransactions(filters: TransactionFilters, enabled = true) {
  return useQuery({
    queryKey: txKeys.list(filters),
    queryFn: () => api<Transaction[]>(`/transactions${toQuery(filters)}`),
    enabled,
    placeholderData: (prev) => prev,
  });
}

export function useTransactionDefaults() {
  return useQuery({
    queryKey: txKeys.defaults,
    queryFn: () => api<TransactionDefaults>('/transactions/defaults'),
    staleTime: 5 * 60_000,
  });
}

export function useSaveTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id?: string; input: Partial<TransactionInput>; scope?: Scope }) =>
      v.id
        ? api<Transaction>(`/transactions/${v.id}${v.scope === 'future' ? '?scope=future' : ''}`, {
            method: 'PATCH',
            json: v.input,
          })
        : api<Transaction>('/transactions', { method: 'POST', json: v.input }),
    // Atualização otimista nas listas abertas (edições); criações aparecem ao revalidar.
    onMutate: async ({ id, input }) => {
      if (!id) return;
      await qc.cancelQueries({ queryKey: txKeys.all });
      const snapshot = qc.getQueriesData<Transaction[]>({ queryKey: ['transactions', 'list'] });
      const { date: _date, ...rest } = input;
      qc.setQueriesData<Transaction[]>({ queryKey: ['transactions', 'list'] }, (old) =>
        old?.map((t) => (t.id === id ? ({ ...t, ...rest } as Transaction) : t)),
      );
      return { snapshot };
    },
    onError: (_e, _v, ctx) => ctx?.snapshot?.forEach(([key, data]) => qc.setQueryData(key, data)),
    onSettled: () => invalidateFinance(qc),
  });
}

/** Marca previsto como pago/recebido (ou volta para previsto). */
export function useToggleStatus() {
  const save = useSaveTransaction();
  return (tx: Transaction) => {
    const status = tx.status === 'planned' ? 'confirmed' : 'planned';
    save.mutate(
      { id: tx.id, input: { status } },
      {
        onSuccess: () =>
          toast.success(
            status === 'confirmed' ? (tx.type === 'income' ? 'Marcado como recebido' : 'Marcado como pago') : 'Voltou para previsto',
          ),
      },
    );
  };
}

// ---------- Exclusão com "Desfazer" ----------
// A exclusão some da tela na hora e só vai para a API depois do toast.
// Se o app for para segundo plano antes disso, as pendentes são enviadas na hora.

const UNDO_MS = 5000;
const pending = new Map<string, { run: () => void; timer: ReturnType<typeof setTimeout> }>();

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => pending.forEach((p) => p.run()));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') pending.forEach((p) => p.run());
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return (tx: Transaction, scope: Scope = 'one') => {
    const snapshot = qc.getQueriesData<Transaction[]>({ queryKey: ['transactions', 'list'] });
    const removed = (t: Transaction) =>
      t.id === tx.id ||
      (scope === 'future' && !!tx.recurrence && t.recurrence?.groupId === tx.recurrence.groupId && t.date > tx.date);
    qc.setQueriesData<Transaction[]>({ queryKey: ['transactions', 'list'] }, (old) => old?.filter((t) => !removed(t)));
    const restore = () => snapshot.forEach(([key, data]) => qc.setQueryData(key, data));

    let done = false;
    const run = () => {
      if (done) return;
      done = true;
      const p = pending.get(tx.id);
      if (p) clearTimeout(p.timer);
      pending.delete(tx.id);
      fetch(`${API_BASE}/api/transactions/${tx.id}${scope === 'future' ? '?scope=future' : ''}`, {
        method: 'DELETE',
        credentials: 'include',
        keepalive: true,
      })
        .then((r) => {
          if (!r.ok) throw new Error();
        })
        .catch(() => {
          restore();
          toast.error('Não foi possível excluir o lançamento');
        })
        .finally(() => invalidateFinance(qc));
    };
    pending.set(tx.id, { run, timer: setTimeout(run, UNDO_MS) });

    toast(scope === 'future' ? 'Lançamentos excluídos' : 'Lançamento excluído', {
      duration: UNDO_MS,
      action: {
        label: 'Desfazer',
        onClick: () => {
          if (done) return;
          done = true;
          clearTimeout(pending.get(tx.id)?.timer);
          pending.delete(tx.id);
          restore();
        },
      },
    });
  };
}
