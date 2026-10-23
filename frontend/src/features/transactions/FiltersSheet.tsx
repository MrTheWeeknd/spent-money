import { useEffect, useState } from 'react';
import type { TransactionFilters } from '@/api/types';
import { ChipRow, type ChipOption } from '@/components/quick-add/ChipRow';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { useCatalog } from '@/hooks/useCatalog';
import { METHOD_LABELS } from '@/lib/labels';

export type ListFilters = Pick<TransactionFilters, 'type' | 'status' | 'method' | 'cardId' | 'personId' | 'categoryId' | 'accountId'>;

const ALL = '__all';

export function FiltersSheet({
  open,
  onOpenChange,
  value,
  onChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  value: ListFilters;
  onChange: (f: ListFilters) => void;
}) {
  const cat = useCatalog();
  const [draft, setDraft] = useState<ListFilters>(value);
  useEffect(() => {
    if (open) setDraft(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = (k: keyof ListFilters) => (v: string) => setDraft((d) => ({ ...d, [k]: v === ALL ? undefined : v }));
  const all: ChipOption = { value: ALL, label: 'Todos' };
  const meio = draft.cardId ? `card:${draft.cardId}` : (draft.method ?? ALL);

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Filtros">
      <div className="space-y-4">
        <ChipRow
          label="Tipo"
          value={draft.type ?? ALL}
          onChange={set('type')}
          options={[all, { value: 'expense', label: 'Despesas' }, { value: 'income', label: 'Receitas' }]}
        />
        <ChipRow
          label="Situação"
          value={draft.status ?? ALL}
          onChange={set('status')}
          options={[all, { value: 'confirmed', label: 'Confirmados' }, { value: 'planned', label: 'Previstos' }]}
        />
        <ChipRow
          label="Meio"
          value={meio}
          onChange={(v) =>
            setDraft((d) =>
              v.startsWith('card:')
                ? { ...d, method: undefined, cardId: v.slice(5) }
                : { ...d, cardId: undefined, method: v === ALL ? undefined : (v as ListFilters['method']) },
            )
          }
          options={[
            all,
            ...cat.cards.map((c) => ({ value: `card:${c.id}`, label: c.name, color: c.color })),
            ...(['credit_card', 'debit', 'pix', 'cash'] as const).map((m) => ({
              value: m,
              label: m === 'credit_card' ? 'Qualquer cartão' : METHOD_LABELS[m],
            })),
          ]}
        />
        <ChipRow
          label="Pessoa"
          value={draft.personId ?? ALL}
          onChange={set('personId')}
          options={[all, ...cat.people.map((p) => ({ value: p.id, label: p.isSelf ? 'Eu' : p.name, color: p.color }))]}
        />
        <ChipRow
          label="Categoria"
          value={draft.categoryId ?? ALL}
          onChange={set('categoryId')}
          options={[
            all,
            ...cat.categories
              .filter((c) => !draft.type || c.type === draft.type)
              .map((c) => ({ value: c.id, label: c.name, color: c.color })),
          ]}
        />
        {cat.accounts.length > 0 && (
          <ChipRow
            label="Conta"
            value={draft.accountId ?? ALL}
            onChange={set('accountId')}
            options={[all, ...cat.accounts.map((a) => ({ value: a.id, label: a.name, color: a.color }))]}
          />
        )}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => {
              onChange({});
              onOpenChange(false);
            }}
          >
            Limpar
          </Button>
          <Button
            size="lg"
            onClick={() => {
              onChange(draft);
              onOpenChange(false);
            }}
          >
            Aplicar
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
