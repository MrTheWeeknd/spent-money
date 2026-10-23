import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { useDeleteTransaction, useSaveTransaction, useTransactionDefaults } from '@/api/transactions';
import type { Transaction } from '@/api/types';
import { useCatalog } from '@/hooks/useCatalog';
import { formatBRL } from '@/lib/money';
import { QuickAddContext, type QuickAddApi } from './context';
import { defaultsFor, draftFromTransaction, draftToInput, newDraft, type Draft } from './draft';
import { QuickAddSheet } from './QuickAddSheet';

export function QuickAddProvider({ children }: { children: ReactNode }) {
  const cat = useCatalog();
  const { data: defaults } = useTransactionDefaults();
  const save = useSaveTransaction();
  const remove = useDeleteTransaction();
  const [open, setOpen] = useState(false);
  const [draft, setDraftState] = useState<Draft>(() => newDraft('expense', cat, undefined));
  const setDraft = useCallback((fn: (d: Draft) => Draft) => setDraftState(fn), []);

  // Aberto antes de os cadastros carregarem: completa os padrões quando chegarem.
  useEffect(() => {
    if (open && !draft.id && (!draft.categoryId || !draft.personId) && cat.ready) {
      setDraftState((d) => ({ ...d, ...defaultsFor(d.type, cat, defaults) }));
    }
  }, [open, draft.id, draft.categoryId, draft.personId, cat, defaults]);

  const api = useMemo<QuickAddApi>(
    () => ({
      open: (opts = {}) => {
        const type = opts.type ?? 'expense';
        const overrides: Partial<Draft> = {};
        if (opts.personId) overrides.personId = opts.personId;
        if (opts.cardId) Object.assign(overrides, { method: 'credit_card', cardId: opts.cardId, accountId: null });
        setDraftState(newDraft(type, cat, defaults, overrides));
        setOpen(true);
      },
      edit: (tx: Transaction) => {
        setDraftState(draftFromTransaction(tx));
        setOpen(true);
      },
    }),
    [cat, defaults],
  );

  const onSave = (scope: 'one' | 'future') => {
    const current = draft;
    const input = draftToInput(current);
    setOpen(false);
    save.mutate(
      { id: current.id, input, scope },
      {
        onSuccess: () => {
          const what = current.type === 'income' ? 'Receita' : 'Despesa';
          toast.success(current.id ? 'Lançamento atualizado' : `${what} de ${formatBRL(current.amount)} salva`);
        },
        // Em caso de erro (o toast vem do MutationCache), reabre com o que foi digitado.
        onError: () => {
          setDraftState(current);
          setOpen(true);
        },
      },
    );
  };

  const onDelete = (scope: 'one' | 'future') => {
    if (!draft.original) return;
    setOpen(false);
    remove(draft.original, scope);
  };

  return (
    <QuickAddContext.Provider value={api}>
      {children}
      <QuickAddSheet open={open} onOpenChange={setOpen} draft={draft} setDraft={setDraft} onSave={onSave} onDelete={onDelete} />
    </QuickAddContext.Provider>
  );
}
