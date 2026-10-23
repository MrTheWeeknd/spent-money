import { createContext, useContext } from 'react';
import type { Transaction, TransactionType } from '@/api/types';

export interface QuickAddApi {
  /** Abre o lançamento rápido para um novo lançamento. */
  open: (opts?: { type?: TransactionType; personId?: string; cardId?: string }) => void;
  /** Abre o mesmo sheet para editar um lançamento existente. */
  edit: (tx: Transaction) => void;
}

export const QuickAddContext = createContext<QuickAddApi | null>(null);

export function useQuickAdd(): QuickAddApi {
  const ctx = useContext(QuickAddContext);
  if (!ctx) throw new Error('useQuickAdd fora do QuickAddProvider');
  return ctx;
}
