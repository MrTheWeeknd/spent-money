import { useQueryClient } from '@tanstack/react-query';
import { useEffect, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { sessionKey, useSession } from '@/api/auth';
import { UNAUTHORIZED_EVENT } from '@/api/client';

export function RequireAuth({ children }: { children: ReactNode }) {
  const session = useSession();
  const qc = useQueryClient();

  useEffect(() => {
    const onUnauthorized = () => qc.setQueryData(sessionKey, false);
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [qc]);

  if (session.isPending) {
    return <div className="min-h-dvh" aria-busy="true" />;
  }
  if (session.isError) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-8 text-center">
        <p className="font-semibold">Não foi possível conectar</p>
        <p className="text-muted">{session.error.message}</p>
        <button className="tap text-accent" onClick={() => session.refetch()}>
          Tentar novamente
        </button>
      </div>
    );
  }
  if (!session.data) return <Navigate to="/login" replace />;
  return children;
}
