import { CalendarDays, ChevronDown, Minus, Plus, Repeat, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Drawer } from 'vaul';
import { useTransactionDefaults } from '@/api/transactions';
import type { TransactionType } from '@/api/types';
import { CategoryBadge, PersonAvatar } from '@/components/badges';
import { Segmented } from '@/components/ui/segmented';
import { Switch } from '@/components/ui/switch';
import { useCatalog } from '@/hooks/useCatalog';
import { localDay, shortDay } from '@/lib/dates';
import { METHOD_LABELS } from '@/lib/labels';
import { formatBRL } from '@/lib/money';
import { cn } from '@/lib/utils';
import { ChipRow, type ChipOption } from './ChipRow';
import {
  defaultsFor,
  descriptionMatches,
  sortedCards,
  sortedCategories,
  sortedPeople,
  suggestCategory,
  type Draft,
} from './draft';
import { NumPad } from './NumPad';
import { applyKey, type NumKey } from './numpad-keys';

const TYPE_OPTIONS = [
  { value: 'expense' as const, label: 'Despesa' },
  { value: 'income' as const, label: 'Receita' },
];
const SCOPE_OPTIONS = [
  { value: 'one' as const, label: 'Só este' },
  { value: 'future' as const, label: 'Este e próximos' },
];
const INCOME_METHOD_LABELS = { pix: 'Pix', debit: 'Transferência', cash: 'Dinheiro' } as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: Draft;
  setDraft: (fn: (d: Draft) => Draft) => void;
  onSave: (scope: 'one' | 'future') => void;
  onDelete: (scope: 'one' | 'future') => void;
}

export function QuickAddSheet({ open, onOpenChange, draft, setDraft, onSave, onDelete }: Props) {
  const cat = useCatalog();
  const { data: defaults } = useTransactionDefaults();
  const [more, setMore] = useState(false);
  const [scope, setScope] = useState<'one' | 'future'>('one');
  const [suggested, setSuggested] = useState(false);
  const [descFocused, setDescFocused] = useState(false);
  const editing = !!draft.id;
  const isCredit = draft.method === 'credit_card';
  const update = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  useEffect(() => {
    if (open) {
      setMore(false);
      setScope('one');
      setSuggested(false);
    }
  }, [open]);

  // Teclado físico (desktop) quando o foco não está num campo de texto.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, select')) return;
      if (/^\d$/.test(e.key)) press(e.key as NumKey);
      else if (e.key === 'Backspace') press('back');
      else if (e.key === 'Enter' && canSave) onSave(scope);
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const press = (k: NumKey) => setDraft((d) => ({ ...d, amount: applyKey(d.amount, k) }));

  const categories = useMemo(() => sortedCategories(cat, draft.type, defaults), [cat, draft.type, defaults]);
  const validCategoryIds = useMemo(() => new Set(categories.map((c) => c.id)), [categories]);
  // Uma categoria arquivada em edição continua aparecendo.
  const categoryOptions: ChipOption[] = useMemo(() => {
    const list = [...categories];
    const current = draft.categoryId ? cat.category.get(draft.categoryId) : undefined;
    if (current && !list.includes(current)) list.unshift(current);
    return list.map((c) => ({
      value: c.id,
      label: c.name,
      color: c.color,
      leading: <CategoryBadge category={c} size="sm" />,
    }));
  }, [categories, draft.categoryId, cat.category]);

  const methodOptions: ChipOption[] = useMemo(() => {
    if (draft.type === 'income') {
      return (Object.keys(INCOME_METHOD_LABELS) as (keyof typeof INCOME_METHOD_LABELS)[]).map((m) => ({
        value: m,
        label: INCOME_METHOD_LABELS[m],
      }));
    }
    const cards = sortedCards(cat, defaults);
    const current = draft.cardId ? cat.card.get(draft.cardId) : undefined;
    if (current && !cards.includes(current)) cards.unshift(current);
    return [
      ...cards.map((c) => ({
        value: `card:${c.id}`,
        label: c.name,
        color: c.color,
        leading: <span className="size-3 rounded-full ring-2 ring-white/70" style={{ backgroundColor: c.color }} aria-hidden />,
      })),
      { value: 'other', label: 'Outro meio' },
    ];
  }, [draft.type, draft.cardId, cat, defaults]);

  const people = useMemo(() => sortedPeople(cat, defaults), [cat, defaults]);
  const personOptions: ChipOption[] = people.map((p) => ({
    value: p.id,
    label: p.isSelf ? 'Eu' : p.name,
    color: p.color,
    leading: (
      <span className="rounded-full ring-2 ring-white/80">
        <PersonAvatar person={p} size="sm" />
      </span>
    ),
  }));

  const accountsActive = cat.accounts.filter((a) => !a.archived || a.id === draft.accountId);
  const matches = descFocused ? descriptionMatches(draft.description, draft.type, defaults) : [];
  const canSave = draft.amount > 0 && !!draft.categoryId && !!draft.personId && (!isCredit || !!draft.cardId);
  const methodValue = draft.type === 'income' ? draft.method : isCredit ? `card:${draft.cardId}` : 'other';
  const otherMethodOptions: ChipOption[] = (['debit', 'pix', 'cash'] as const).map((m) => ({ value: m, label: METHOD_LABELS[m] }));
  const today = localDay();

  const setDescription = (description: string, categoryId?: string) => {
    if (draft.categoryTouched) return update({ description });
    const s = categoryId ?? suggestCategory(description, draft.type, defaults, validCategoryIds);
    setSuggested(!!s);
    update(s ? { description, categoryId: s } : { description });
  };

  const switchType = (type: TransactionType) => {
    if (type === draft.type) return;
    setSuggested(false);
    setDraft((d) => ({ ...d, type, installments: 1, categoryTouched: false, ...defaultsFor(type, cat, defaults) }));
  };

  const dateLabel = draft.date === today ? 'Hoje' : shortDay(draft.date);
  const amountColor = draft.type === 'income' ? 'text-income' : 'text-fg';

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-overlay" />
        <Drawer.Content
          className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[96dvh] max-w-lg flex-col rounded-t-[20px] bg-bg outline-none"
          aria-describedby={undefined}
        >
          <div aria-hidden className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-muted/40" />
          <Drawer.Title className="sr-only">{editing ? 'Editar lançamento' : 'Novo lançamento'}</Drawer.Title>

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center gap-2">
              <Segmented label="Tipo" value={draft.type} onValueChange={switchType} options={TYPE_OPTIONS} className="flex-1" />
              {editing && (
                <button
                  type="button"
                  onClick={() => onDelete(scope)}
                  aria-label="Excluir lançamento"
                  className="tap flex items-center justify-center rounded-xl text-danger active:bg-surface"
                >
                  <Trash2 className="size-5" />
                </button>
              )}
            </div>

            {/* Valor */}
            <div className="text-center">
              <output
                aria-live="polite"
                aria-label="Valor"
                className={cn('block font-display text-[44px] leading-none font-semibold tracking-tight tabular', amountColor, draft.amount === 0 && 'text-muted')}
              >
                {formatBRL(draft.amount)}
              </output>
              {isCredit && draft.installments > 1 && draft.amount > 0 && (
                <p className="mt-1 text-sm text-muted tabular">
                  {draft.installments}x de {formatBRL(Math.floor(draft.amount / draft.installments))}
                </p>
              )}
            </div>

            {/* Descrição com autocompletar */}
            <div className="relative">
              <input
                value={draft.description}
                onChange={(e) => setDescription(e.target.value)}
                onFocus={() => setDescFocused(true)}
                onBlur={() => setTimeout(() => setDescFocused(false), 150)}
                placeholder="Descrição (opcional)"
                aria-label="Descrição"
                autoComplete="off"
                enterKeyHint="done"
                maxLength={120}
                className="h-11 w-full rounded-xl bg-surface px-4 text-base outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent"
                onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
              />
              {matches.length > 0 && (
                <ul role="listbox" aria-label="Sugestões" className="absolute inset-x-0 top-12 z-10 overflow-hidden rounded-xl bg-surface shadow-lg ring-1 ring-separator">
                  {matches.map((m) => (
                    <li key={m.description} role="option" aria-selected={false}>
                      <button
                        type="button"
                        className="flex min-h-11 w-full items-center gap-2 px-4 text-left active:bg-surface-2"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setDescription(m.description, validCategoryIds.has(m.categoryId) ? m.categoryId : undefined);
                          setDescFocused(false);
                          (document.activeElement as HTMLElement | null)?.blur();
                        }}
                      >
                        {cat.category.get(m.categoryId) && <CategoryBadge category={cat.category.get(m.categoryId)!} size="sm" />}
                        {m.description}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <ChipRow
              label={draft.type === 'income' ? 'Recebido via' : 'Cartão'}
              value={methodValue}
              options={methodOptions}
              onChange={(v) =>
                v.startsWith('card:')
                  ? update({ method: 'credit_card', cardId: v.slice(5), accountId: null })
                  : v === 'other'
                    ? update({ method: 'pix', cardId: null, installments: 1 })
                    : update({ method: v as Draft['method'], cardId: null, installments: 1 })
              }
            />
            {draft.type === 'expense' && !isCredit && (
              <ChipRow
                label="Outro meio"
                value={draft.method}
                options={otherMethodOptions}
                onChange={(v) => update({ method: v as Draft['method'], cardId: null, installments: 1 })}
              />
            )}
            {draft.type === 'expense' && personOptions.length > 1 && (
              <ChipRow label="Quem gastou" value={draft.personId} options={personOptions} onChange={(v) => update({ personId: v })} />
            )}
            <ChipRow
              label="Categoria"
              hint={suggested && !draft.categoryTouched ? 'sugerida pela descrição' : undefined}
              value={draft.categoryId}
              options={categoryOptions}
              onChange={(v) => {
                setSuggested(false);
                update({ categoryId: v, categoryTouched: true });
              }}
            />

            {/* Opções: data, parcelas, repetir */}
            <div className="flex items-center gap-2">
              <label className="relative flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-surface px-3.5 text-[15px] font-medium">
                <CalendarDays className="size-4 text-muted" aria-hidden />
                <span aria-hidden>{dateLabel}</span>
                <input
                  type="date"
                  value={draft.date}
                  onChange={(e) => e.target.value && update({ date: e.target.value })}
                  aria-label={`Data: ${dateLabel}`}
                  className="absolute inset-0 opacity-0"
                />
              </label>
              {isCredit && !draft.recurring && (
                <div className="flex h-11 items-center rounded-full bg-surface" role="group" aria-label="Parcelas">
                  <button
                    type="button"
                    aria-label="Menos parcelas"
                    disabled={draft.installments <= 1}
                    onClick={() => update({ installments: draft.installments - 1 })}
                    className="tap flex items-center justify-center rounded-full disabled:opacity-30"
                  >
                    <Minus className="size-4" />
                  </button>
                  <span className="min-w-8 text-center text-[15px] font-semibold tabular" aria-live="polite">
                    {draft.installments}x
                  </span>
                  <button
                    type="button"
                    aria-label="Mais parcelas"
                    disabled={draft.installments >= 48}
                    onClick={() => update({ installments: draft.installments + 1 })}
                    className="tap flex items-center justify-center rounded-full disabled:opacity-30"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => setMore((m) => !m)}
                aria-expanded={more}
                className="ml-auto flex h-11 items-center gap-1 rounded-full px-3 text-[15px] font-medium text-accent"
              >
                {draft.recurring && <Repeat className="size-4" aria-label="Mensal" />}
                Mais
                <ChevronDown className={cn('size-4 transition-transform', more && 'rotate-180')} aria-hidden />
              </button>
            </div>

            {more && (
              <div className="space-y-2 rounded-2xl bg-surface p-3">
                {!editing && (
                  <label className="flex min-h-11 items-center justify-between gap-3">
                    <span>
                      Repetir todo mês
                      <span className="block text-sm text-muted">Gera os próximos 12 meses como previstos.</span>
                    </span>
                    <Switch
                      checked={draft.recurring}
                      onCheckedChange={(recurring) => update({ recurring, installments: 1 })}
                    />
                  </label>
                )}
                {editing && (
                  <label className="flex min-h-11 items-center justify-between gap-3">
                    <span>{draft.type === 'income' ? 'Recebido' : 'Pago'}</span>
                    <Switch
                      checked={draft.status === 'confirmed'}
                      onCheckedChange={(c) => update({ status: c ? 'confirmed' : 'planned' })}
                    />
                  </label>
                )}
                {!isCredit && accountsActive.length > 0 && (
                  <label className="flex min-h-11 items-center justify-between gap-3">
                    <span>Conta</span>
                    <select
                      value={draft.accountId ?? ''}
                      onChange={(e) => update({ accountId: e.target.value || null })}
                      className="h-10 max-w-[60%] rounded-lg bg-surface-2 px-2"
                    >
                      <option value="">Nenhuma</option>
                      {accountsActive.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <input
                  value={draft.note}
                  onChange={(e) => update({ note: e.target.value })}
                  placeholder="Observação"
                  aria-label="Observação"
                  maxLength={500}
                  className="h-11 w-full rounded-xl bg-surface-2 px-3 text-base outline-none placeholder:text-muted"
                />
              </div>
            )}

            {editing && draft.original?.recurrence && (
              <Segmented label="Aplicar a" value={scope} onValueChange={setScope} options={SCOPE_OPTIONS} />
            )}

            <div className="mt-auto space-y-2 pt-1">
              <NumPad onKey={press} />
              <button
                type="button"
                disabled={!canSave}
                onClick={() => onSave(scope)}
                className="h-14 w-full rounded-2xl bg-accent text-lg font-semibold text-accent-fg transition-[opacity,transform] active:scale-[0.98] disabled:opacity-40"
              >
                {editing ? 'Salvar alterações' : draft.type === 'income' ? 'Salvar receita' : 'Salvar despesa'}
              </button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
