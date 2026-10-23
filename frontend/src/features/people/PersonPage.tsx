import { HandCoins, Plus, Receipt, Share } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/api/client';
import { useDeleteSettlement, useStatement } from '@/api/finance';
import type { Person, Statement, Transaction } from '@/api/types';
import { CategoryBadge, PersonAvatar } from '@/components/badges';
import { EmptyState } from '@/components/EmptyState';
import { BackHeader } from '@/components/layout/BackHeader';
import { useQuickAdd } from '@/components/quick-add/context';
import { ListSkeleton } from '@/components/Skeleton';
import { SwipeRow } from '@/components/SwipeRow';
import { Button } from '@/components/ui/button';
import { ListGroup } from '@/components/ui/list';
import { useCatalog } from '@/hooks/useCatalog';
import { formatDate } from '@/lib/dates';
import { METHOD_LABELS } from '@/lib/labels';
import { formatBRL } from '@/lib/money';
import { cn } from '@/lib/utils';
import { SettlementSheet } from './SettlementSheet';

export function PersonPage() {
  const { personId = '' } = useParams();
  const { data, isPending } = useStatement(personId);
  const cat = useCatalog();
  const person = cat.person.get(personId);
  const [paying, setPaying] = useState(false);
  const quickAdd = useQuickAdd();
  const removeSettlement = useDeleteSettlement();
  const balance = data?.balance?.balance ?? 0;

  const openTransaction = async (id: string) => {
    try {
      quickAdd.edit(await api<Transaction>(`/transactions/${id}`));
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const share = async () => {
    if (!person || !data) return;
    const text = shareText(person, data, cat);
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        toast.success('Resumo copiado. Cole no WhatsApp.');
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') toast.error('Não foi possível compartilhar');
    }
  };

  return (
    <>
      <BackHeader
        to="/pessoas"
        back="Pessoas"
        title={person?.name ?? ''}
        action={
          <button
            type="button"
            onClick={() => quickAdd.open({ personId })}
            aria-label={`Novo gasto de ${person?.name ?? 'pessoa'}`}
            className="tap -mr-2 flex items-center justify-center text-accent"
          >
            <Plus className="size-6" />
          </button>
        }
      />
      {isPending || !person || !data ? (
        <ListSkeleton />
      ) : (
        <>
          <section className="mx-4 mb-4 flex flex-col items-center rounded-3xl bg-surface p-5 text-center">
            <PersonAvatar person={person} size="lg" />
            <p className="mt-3 text-sm text-muted">{balance >= 0 ? 'Saldo devedor' : 'Crédito com você'}</p>
            <p className={cn('font-display text-[38px] leading-tight font-bold tabular', balance < 0 && 'text-income')}>
              {formatBRL(Math.abs(balance))}
            </p>
            {data.balance && (
              <p className="mt-1 text-sm text-muted tabular">
                Gastou {formatBRL(data.balance.charged)} · pagou {formatBRL(data.balance.settled)}
                {data.balance.future > 0 && (
                  <>
                    <br />
                    {formatBRL(data.balance.future)} em parcelas de faturas futuras
                  </>
                )}
              </p>
            )}
          </section>
          <div className="mx-4 mb-6 flex gap-3">
            <Button size="lg" className="flex-1" onClick={() => setPaying(true)}>
              <HandCoins className="size-5" aria-hidden /> Registrar pagamento
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={share}
              disabled={!data.items.length}
              aria-label="Compartilhar resumo"
              className="w-14 shrink-0 px-0 text-accent"
            >
              <Share className="size-5" aria-hidden />
            </Button>
          </div>

          {data.items.length === 0 ? (
            <EmptyState icon={Receipt} title="Sem movimentações" description={`Gastos de ${person.name} aparecem aqui.`} />
          ) : (
            <ListGroup header="Extrato">
              {data.items.map((item) => {
                if (item.kind === 'payment') {
                  return (
                    <SwipeRow
                      key={`p-${item.id}`}
                      label={`Pagamento de ${formatBRL(item.amount)} em ${formatDate(item.date, 'dd/MM')}`}
                      onOpen={() => toast(item.note || 'Pagamento registrado', { description: formatDate(item.date, "d 'de' MMMM 'de' yyyy") })}
                      onDelete={() =>
                        removeSettlement.mutate(item.id, { onSuccess: () => toast.success('Pagamento removido') })
                      }
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-income/15 text-income">
                        <HandCoins className="size-[18px]" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">Pagamento{item.note ? ` · ${item.note}` : ''}</span>
                        <span className="block text-sm text-muted">{formatDate(item.date, 'dd/MM/yyyy')}</span>
                      </span>
                      <span className="font-semibold text-income tabular">− {formatBRL(item.amount)}</span>
                    </SwipeRow>
                  );
                }
                const c = cat.category.get(item.categoryId);
                const card = item.cardId ? cat.card.get(item.cardId) : undefined;
                return (
                  <SwipeRow
                    key={`c-${item.id}`}
                    label={`${item.description || c?.name}, ${formatBRL(item.amount)}`}
                    onOpen={() => openTransaction(item.id)}
                  >
                    {c && <CategoryBadge category={c} />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{item.description || c?.name}</span>
                      <span className="block truncate text-sm text-muted">
                        {formatDate(item.date, 'dd/MM/yyyy')} · {card?.name ?? METHOD_LABELS[item.method]}
                        {item.installments > 1 && ` · ${item.installments}x`}
                      </span>
                    </span>
                    <span className="tabular">{formatBRL(item.amount)}</span>
                  </SwipeRow>
                );
              })}
            </ListGroup>
          )}
          <SettlementSheet open={paying} onOpenChange={setPaying} person={person} suggested={Math.max(0, balance)} />
        </>
      )}
    </>
  );
}

/** Texto pronto para WhatsApp: gastos desde o último pagamento e o saldo. */
function shareText(person: Person, data: Statement, cat: ReturnType<typeof useCatalog>) {
  const lastPayment = data.items.find((i) => i.kind === 'payment');
  const charges = data.items.filter(
    (i): i is Extract<typeof i, { kind: 'charge' }> => i.kind === 'charge' && (!lastPayment || i.date > lastPayment.date),
  );
  const lines = charges
    .slice(0, 30)
    .reverse()
    .map((i) => {
      const name = i.description || cat.category.get(i.categoryId)?.name || 'Compra';
      const card = i.cardId ? cat.card.get(i.cardId)?.name : METHOD_LABELS[i.method];
      return `• ${formatDate(i.date, 'dd/MM')} ${name}${i.installments > 1 ? ` (${i.installments}x)` : ''} – ${formatBRL(i.amount)} (${card})`;
    });
  const b = data.balance;
  const firstName = person.name.split(' ')[0];
  return [
    `Oi, ${firstName}! Resumo dos seus gastos nos meus cartões:`,
    '',
    ...(lines.length ? lines : ['Nenhum gasto novo desde o último pagamento.']),
    ...(charges.length > 30 ? [`… e mais ${charges.length - 30}`] : []),
    '',
    b ? `Total gasto: ${formatBRL(b.charged)}` : '',
    b && b.settled ? `Já pago: ${formatBRL(b.settled)}` : '',
    b ? `*Saldo em aberto: ${formatBRL(b.balance)}*` : '',
    b && b.future > 0 ? `(${formatBRL(b.future)} são parcelas que ainda vão vencer)` : '',
  ]
    .filter((l, i, arr) => l !== '' || (i > 0 && arr[i - 1] !== ''))
    .join('\n')
    .trim();
}
