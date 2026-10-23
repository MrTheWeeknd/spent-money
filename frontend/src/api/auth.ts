import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from './client';

export const sessionKey = ['session'] as const;

/** true = logado, false = sem sessão. */
export function useSession() {
  return useQuery({
    queryKey: sessionKey,
    queryFn: async () => {
      try {
        await api('/auth/me');
        return true;
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return false;
        throw e;
      }
    },
    staleTime: Infinity,
    retry: false,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (password: string) =>
      api('/auth/login', { method: 'POST', json: { password } }),
    onSuccess: () => qc.setQueryData(sessionKey, true),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api('/auth/logout', { method: 'POST' }),
    onSettled: () => {
      qc.clear();
      qc.setQueryData(sessionKey, false);
    },
  });
}
