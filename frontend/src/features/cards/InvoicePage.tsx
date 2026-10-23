import { CalendarCog, CircleCheck, Landmark, Plus, Receipt } from 'lucide-react';
import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useDeleteInvoicePayment, useInvoice, useInvoices } from '@/api/finance';
import { api } from '@/api/client';
import type { Transaction } from '@/api/types';
import { CategoryBadge, PersonAvatar } from '@/components/badges';
import { EmptyState } from '@/components/EmptyState';
import { BackHeader } from '@/components/layout/BackHeader';
import { MonthSwitcher } from '@/components/MonthSwitcher';
import { useQuickAdd } from '@/components/quick-add/context';
import { ListSkeleton } from '@/components/Skeleton';
import { SwipeRow } from '@/components/SwipeRow';
import { Button } from '@/components/ui/button';
import { ListGroup } from '@/components/ui/list';
import { useCatalog } from '@/hooks/useCatalog';
import { contrastText } from '@/lib/colors';
import { cap, formatDate, monthLabel, shortDay } from '@/lib/dates';
import { formatClosingDay, weekday } from '@/lib/invoice';
import { INVOICE_STATUS_LABELS } from '@/lib/labels';
import { formatBRL } from '@/lib/money';
import { toast } from 'sonner';
import { InvoiceDatesSheet } from './InvoiceDatesSheet';
import { PayInvoiceSheet } from './PayInvoiceSheet';

export function InvoicePage() {
  const { cardId = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const overview = useInvoices();
  const fallback = overview.data?.find((c) => c.cardId === cardId)?.current.month;
  const month = params.get('fatura') ?? fallback;
  const { data, isPending } = useInvoice(cardId, month);
  const cat = useCatalog();
  const quickAdd = useQuickAdd();
  const card = cat.card.get(cardId);
  const [paying, setPaying] = useState(false);
  const [editingDates, setEditingDates] = useState(false);
  const removePayment = useDeleteInvoicePayment();

  const openTransaction = async (id: string) => {
    try {
      quickAdd.edit(await api<Transaction>(`/transactions/${id}`));
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <>
      <BackHeader
        to="/cartoes"
        back="Cartões"
        title={card?.name ?? 'Fatura'}
        action={
          <button
            type="button"
            onClick={() => quickAdd.open({ cardId })}
            aria-label="Nova compra neste cartão"
            className="tap -mr-2 flex items-center justify-center text-accent"
          >
            <Plus className="size-6" />
          </button>
        }
      />
      {month && (
        <MonthSwitcher
          value={month}
          onChange={(m) => setParams({ fatura: m }, { replace: true })}
          className="px-2"
          label={(m) => `Fatura de ${monthLabel(m)}`}
        />
      )}

      {isPending || !data ? (
        <ListSkeleton rows={5} />
      ) : (
        <>
          <section
            className="mx-4 mt-2 mb-6 rounded-3xl p-5"
            style={card ? { backgroundColor: card.color, color: contrastText(card.color) } : undefined}
            aria-label="Resumo da fatura"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="opacity-80">{data.isCurrent ? 'Fatura atual' : 'Total da fatura'}</span>
              <span className="rounded-full bg-black/15 px-2.5 py-0.5 text-xs font-semibold">{INVOICE_STATUS_LABELS[data.status]}</span>
            </div>
            <p className="font-display text-[38px] leading-tight font-bold tabular">{formatBRL(data.total)}</p>
            <div className="mt-2 grid grid-cols-2 text-sm">
              <span>
                <span className="block opacity-80">Fecha em</span>
                <span className="font-semibold">{formatClosingDay(data)}</span>
              </span>
              <span>
                <span className="block opacity-80">Vence em</span>
                <span className="font-semibold">
                  {cap(weekday(data.dueDate))}, {shortDay(data.dueDate)}
                  {data.dueAdjusted && ' · ajustada'}
                </span>
              </span>
            </div>
            {data.dueShifted && (
              <p className="mt-2 text-xs opacity-85">
                Dia {data.nominalDueDate.slice(8, 10)} não é dia útil: o vencimento vai para o próximo dia útil.
              </p>
            )}
            <button
              type="button"
              onClick={() => setEditingDates(true)}
              className="tap -mb-2 -ml-1 flex items-center gap-1.5 px-1 text-sm font-semibold underline-offset-4 active:underline"
            >
              <CalendarCog className="size-4" aria-hidden /> O banco mudou as datas? Ajustar
            </button>
            {data.paid > 0 && (
              <div className="mt-3 flex items-center justify-between border-t border-current/20 pt-3 text-sm">
                <span>
                  Pago <span className="font-semibold tabular">{formatBRL(data.paid)}</span>
                </span>
                {data.status === 'paid' ? (
                  <span className="flex items-center gap-1 font-semibold">
                    <CircleCheck className="size-4" aria-hidden /> Quitada
                  </span>
                ) : (
                  <span>
                    Falta <span className="font-semibold tabular">{formatBRL(data.remaining)}</span>
                  </span>
                )}
              </div>
            )}
          </section>

          {data.total > 0 && data.remaining > 0 && (
            <div className="mx-4 -mt-2 mb-6">
              <Button size="lg" onClick={() => setPaying(true)}>
                <CircleCheck className="size-5" aria-hidden />
                {data.paid > 0 ? 'Pagar o restante' : 'Pagar fatura'}
              </Button>
            </div>
          )}

          {data.payments.length > 0 && (
            <ListGroup header="Pagamentos">
              {data.payments.map((p) => {
                const acc = p.accountId ? cat.account.get(p.accountId) : undefined;
                return (
                  <SwipeRow
                    key={p.id}
                    label={`Pagamento de ${formatBRL(p.amount)} em ${formatDate(p.date, 'dd/MM')}`}
                    onOpen={() => toast(p.note || 'Pagamento da fatura', { description: formatDate(p.date, "d 'de' MMMM 'de' yyyy") })}
                    onDelete={() => removePayment.mutate(p.id, { onSuccess: () => toast.success('Pagamento removido') })}
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-income/15 text-income">
                      <Landmark className="size-[18px]" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{p.note || 'Pagamento'}</span>
                      <span className="block truncate text-sm text-muted">
                        {formatDate(p.date, 'dd/MM/yyyy')}
                        {acc && ` · ${acc.name}`}
                      </span>
                    </span>
                    <span className="font-semibold text-income tabular">{formatBRL(p.amount)}</span>
                  </SwipeRow>
                );
              })}
            </ListGroup>
          )}

          {data.byPerson.length > 1 || (data.byPerson[0] && !cat.person.get(data.byPerson[0].personId)?.isSelf) ? (
            <ListGroup header="Quem gastou">
              {data.byPerson.map((b) => {
                const p = cat.person.get(b.personId);
                if (!p) return null;
                return (
                  <li key={b.personId} className="flex min-h-12 items-center gap-3 px-4 py-2">
                    <PersonAvatar person={p} size="sm" />
                    <span className="flex-1">{p.isSelf ? 'Eu' : p.name}</span>
                    <span className="font-semibold tabular">{formatBRL(b.amount)}</span>
                    <span className="w-10 text-right text-sm text-muted tabular">
                      {Math.round((b.amount / data.total) * 100)}%
                    </span>
                  </li>
                );
              })}
            </ListGroup>
          ) : null}

          {data.items.length === 0 ? (
            <EmptyState icon={Receipt} title="Fatura vazia" description="Nenhuma compra caiu nesta fatura." />
          ) : (
            <ListGroup header={`${data.items.length} ${data.items.length === 1 ? 'lançamento' : 'lançamentos'}`}>
              {data.items.map((i) => {
                const c = cat.category.get(i.categoryId);
                const p = cat.person.get(i.personId);
                return (
                  <li key={i.id}>
                    <button
                      type="button"
                      onClick={() => openTransaction(i.transactionId)}
                      className="flex min-h-[60px] w-full items-center gap-3 px-4 py-2 text-left active:bg-surface-2"
                    >
                      {c && <CategoryBadge category={c} />}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{i.description || c?.name}</span>
                        <span className="block truncate text-sm text-muted">
                          {formatDate(i.date, 'dd/MM')}
                          {i.total > 1 && ` · parcela ${i.number}/${i.total}`}
                          {p && !p.isSelf && (
                            <span className="font-medium text-fg">
                              {' '}· {p.name}
                            </span>
                          )}
                        </span>
                      </span>
                      <span className="text-right tabular">
                        {formatBRL(i.amount)}
                        {i.status === 'planned' && <span className="block text-[11px] font-semibold text-warning-fg">Previsto</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ListGroup>
          )}
          {card && <PayInvoiceSheet open={paying} onOpenChange={setPaying} invoice={data} cardName={card.name} />}
          {card && <InvoiceDatesSheet open={editingDates} onOpenChange={setEditingDates} invoice={data} cardName={card.name} />}
        </>
      )}
    </>
  );
}
