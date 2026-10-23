import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { api } from './client';
import type { Entity } from './types';

/**
 * Hooks de CRUD para um cadastro simples, com optimistic updates:
 * a lista em cache muda na hora e volta ao estado anterior se a API falhar.
 */
export function createResource<T extends Entity, TInput>(path: string) {
  const key: QueryKey = [path];

  function useList() {
    return useQuery({ queryKey: key, queryFn: () => api<T[]>(path) });
  }

  function useOptimistic<V>(
    mutationFn: (vars: V) => Promise<unknown>,
    apply: (list: T[], vars: V) => T[],
  ) {
    const qc = useQueryClient();
    return useMutation({
      mutationFn,
      onMutate: async (vars: V) => {
        await qc.cancelQueries({ queryKey: key });
        const previous = qc.getQueryData<T[]>(key);
        if (previous) qc.setQueryData<T[]>(key, apply(previous, vars));
        return { previous };
      },
      onError: (_err, _vars, ctx) => {
        if (ctx?.previous) qc.setQueryData(key, ctx.previous);
      },
      onSettled: () => qc.invalidateQueries({ queryKey: key }),
    });
  }

  function useCreate() {
    return useOptimistic(
      (input: TInput) => api<T>(path, { method: 'POST', json: input }),
      (list, input) => {
        const now = new Date().toISOString();
        const temp = { ...input, id: `temp-${now}`, createdAt: now, updatedAt: now } as unknown as T;
        return [...list, temp];
      },
    );
  }

  function useUpdate() {
    return useOptimistic(
      ({ id, ...input }: Partial<TInput> & { id: string }) =>
        api<T>(`${path}/${id}`, { method: 'PATCH', json: input }),
      (list, { id, ...input }) => list.map((item) => (item.id === id ? { ...item, ...input } : item)),
    );
  }

  function useRemove() {
    return useOptimistic(
      (id: string) => api<void>(`${path}/${id}`, { method: 'DELETE' }),
      (list, id) => list.filter((item) => item.id !== id),
    );
  }

  return { key, useList, useCreate, useUpdate, useRemove };
}
