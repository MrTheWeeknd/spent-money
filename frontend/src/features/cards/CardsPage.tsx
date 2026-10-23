import { CreditCard, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useInvoices } from '@/api/finance';
import type { InvoiceSummary } from '@/api/types';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/layout/PageHeader';
import { Skeleton } from '@/components/Skeleton';
import { Button } from '@/components/ui/button';
import { useCatalog } from '@/hooks/useCatalog';
import { contrastText } from '@/lib/colors';
import { monthShort, shortDay } from '@/lib/dates';
import { formatDueDay } from '@/lib/invoice';
import { BRAND_LABELS, INVOICE_STATUS_LABELS } from '@/lib/labels';
import { formatBRL } from '@/lib/money';

export function CardsPage() {
  const { data, isPending } = useInvoices();
  const cat = useCatalog();

  return (
    <>
      <PageHeader
        title="Cartões"
        action={
          <Link to="/configuracoes/cartoes" aria-label="Gerenciar cartões" className="tap -mr-2 flex items-center justify-center text-accent">
            <Plus className="size-6" />
          </Link>
        }
      />
      {isPending ? (
        <div className="space-y-4 px-4" aria-busy="true">
          <Skeleton className="h-44 rounded-3xl" />
          <Skeleton className="h-44 rounded-3xl" />
        </div>
      ) : !data?.length ? (
        <EmptyState
          icon={CreditCard}
          title="Nenhum cartão ativo"
          description="Cadastre seus cartões para acompanhar as faturas."
          action={
            <Button asChild>
              <Link to="/configuracoes/cartoes">Cadastrar cartão</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-4 px-4">
          {data.map(({ cardId, current, closed, upcoming }) => {
            const card = cat.card.get(cardId);
            if (!card) return null;
            const fg = contrastText(card.color);
            // Limite comprometido = o que ainda não foi pago nas faturas em aberto.
            const used = [closed, current, ...upcoming].reduce((s, i) => s + (i?.remaining ?? 0), 0);
            return (
              <li key={cardId}>
                <Link
                  to={`/cartoes/${cardId}?fatura=${current.month}`}
                  className="block rounded-3xl p-5 shadow-sm active:opacity-90"
                  style={{ backgroundColor: card.color, color: fg }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-lg font-semibold">{card.name}</p>
                      <p className="text-sm opacity-80 tabular">
                        {BRAND_LABELS[card.brand]}
                        {card.last4 && ` •••• ${card.last4}`}
                      </p>
                    </div>
                    <span className="rounded-full bg-black/15 px-2.5 py-0.5 text-xs font-semibold">
                      {INVOICE_STATUS_LABELS[current.status]}
                    </span>
                  </div>
                  <p className="mt-4 text-sm opacity-80">
                    Fatura de {monthShort(current.month)} · fecha {shortDay(current.closingDate)} · {formatDueDay(current)}
                  </p>
                  <p className="font-display text-[32px] leading-tight font-bold tabular">{formatBRL(current.total)}</p>
                  {closed && closed.total > 0 && (
                    <p className="text-sm opacity-90">
                      {closed.status === 'paid' ? (
                        <>Fatura de {monthShort(closed.month)} paga ✓</>
                      ) : (
                        <>
                          {closed.status === 'past' ? 'Vencida em' : 'Fechada, vence'} {shortDay(closed.dueDate)}:{' '}
                          <span className="font-semibold tabular">{formatBRL(closed.remaining)}</span>
                        </>
                      )}
                    </p>
                  )}
                  {card.limit ? (
                    <div className="mt-3">
                      <div className="h-1.5 rounded-full bg-black/15" aria-hidden>
                        <div className="h-1.5 rounded-full bg-current opacity-80" style={{ width: `${Math.min(100, (used / card.limit) * 100)}%` }} />
                      </div>
                      <p className="mt-1 text-xs opacity-80 tabular">
                        Limite disponível {formatBRL(Math.max(0, card.limit - used))} de {formatBRL(card.limit)}
                      </p>
                    </div>
                  ) : null}
                  <UpcomingRow items={upcoming} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function UpcomingRow({ items }: { items: InvoiceSummary[] }) {
  if (!items.some((i) => i.total > 0)) return null;
  return (
    <div className="mt-4 grid grid-cols-3 gap-2 border-t border-current/20 pt-3 text-center">
      {items.map((i) => (
        <div key={i.month}>
          <p className="text-xs capitalize opacity-80">{monthShort(i.month)}</p>
          <p className="text-sm font-semibold tabular">{formatBRL(i.total)}</p>
        </div>
      ))}
    </div>
  );
}
