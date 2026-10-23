import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import { ApiError } from '@/api/client';
import { router } from '@/routes';
import '@fontsource/manrope/latin-700.css';
import '@fontsource/manrope/latin-800.css';
import '@fontsource/space-grotesk/latin-700.css';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (count, err) => !(err instanceof ApiError && err.status < 500 && err.status > 0) && count < 2,
    },
  },
  // Erros de mutação viram toast, exceto quando a própria tela trata (meta.silent).
  mutationCache: new MutationCache({
    onError: (err, _vars, _ctx, mutation) => {
      if (mutation.meta?.silent) return;
      if (err instanceof ApiError && err.status === 401) return;
      toast.error(err.message);
    },
  }),
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster
        position="top-center"
        theme="system"
        richColors
        offset={{ top: 'calc(env(safe-area-inset-top) + 8px)' }}
        mobileOffset={{ top: 'calc(env(safe-area-inset-top) + 8px)' }}
      />
    </QueryClientProvider>
  </StrictMode>,
);
