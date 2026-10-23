import { Check, Repeat } from 'lucide-react';
import type { Transaction } from '@/api/types';
import { useCatalog } from '@/hooks/useCatalog';
import { formatDate } from '@/lib/dates';
import { METHOD_LABELS } from '@/lib/labels';
import { formatBRL } from '@/lib/money';
import { CategoryBadge, PersonAvatar } from './badges';
import { Money } from './Money';
import { SwipeRow } from './SwipeRow';

/** Conteúdo da linha de um lançamento (ícone, descrição, meio/pessoa, valor). */
export function TransactionRowContent({ tx, showDate }: { tx: Transaction; showDate?: boolean }) {
  const cat = useCatalog();
  const category = cat.category.get(tx.categoryId);
  const card = tx.cardId ? cat.card.get(tx.cardId) : undefined;
  const person = cat.person.get(tx.personId);
  const via = card ? card.name : METHOD_LABELS[tx.method];
  const parts = [
    showDate && formatDate(tx.date, 'dd/MM'),
    via,
    tx.installments > 1 && `${tx.installments}x`,
    category && tx.description ? category.name : null,
  ].filter(Boolean);

  return (
    <>
      <span className="relative shrink-0">
        {category ? <CategoryBadge category={category} /> : <span className="block size-9 rounded-full bg-surface-2" />}
        {person && !person.isSelf && (
          <span className="absolute -right-1 -bottom-1 rounded-full ring-2 ring-surface">
            <PersonAvatar person={person} size="sm" />
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate">{tx.description || category?.name || 'Sem descrição'}</span>
          {tx.recurrence && <Repeat className="size-3.5 shrink-0 text-muted" aria-label="Recorrente" />}
        </span>
        <span className="block truncate text-sm text-muted">
          {person && !person.isSelf && <span className="font-medium text-fg">{person.name} · </span>}
          {parts.join(' · ')}
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end">
        <Money cents={tx.amount} type={tx.type} signed className={tx.status === 'planned' ? 'opacity-60' : undefined} />
        {tx.status === 'planned' && (
          <span className="mt-0.5 rounded-full bg-warning/15 px-1.5 text-[11px] font-semibold text-warning-fg">Previsto</span>
        )}
      </span>
    </>
  );
}

export function TransactionRow({
  tx,
  onOpen,
  onDelete,
  onToggleStatus,
  showDate,
}: {
  tx: Transaction;
  onOpen: () => void;
  onDelete?: () => void;
  onToggleStatus?: () => void;
  showDate?: boolean;
}) {
  const cat = useCatalog();
  const category = cat.category.get(tx.categoryId);
  const label = `${tx.type === 'income' ? 'Receita' : 'Despesa'} ${tx.description || category?.name || ''}, ${formatBRL(tx.amount)}${tx.status === 'planned' ? ', previsto' : ''}`;
  const accessory =
    tx.status === 'planned' && onToggleStatus ? (
      <button
        type="button"
        onClick={onToggleStatus}
        aria-label={tx.type === 'income' ? 'Marcar como recebido' : 'Marcar como pago'}
        className="mr-1 flex size-11 shrink-0 items-center justify-center rounded-full text-income active:bg-income/10"
      >
        <span className="flex size-7 items-center justify-center rounded-full border-2 border-current">
          <Check className="size-4" strokeWidth={3} />
        </span>
      </button>
    ) : undefined;
  return (
    <SwipeRow label={label} onOpen={onOpen} onEdit={onOpen} onDelete={onDelete} accessory={accessory}>
      <TransactionRowContent tx={tx} showDate={showDate} />
    </SwipeRow>
  );
}
