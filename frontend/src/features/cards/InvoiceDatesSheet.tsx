import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useSetInvoiceDates } from '@/api/finance';
import type { InvoiceDetail } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Sheet } from '@/components/ui/sheet';
import { monthLabel } from '@/lib/dates';
import { ddmm } from '@/lib/invoice';

/**
 * Ajuste das datas reais de uma fatura (o banco moveu por fim de semana/feriado).
 * Mudar o fechamento redistribui as compras próximas da data entre as faturas.
 */
export function InvoiceDatesSheet({
  open,
  onOpenChange,
  invoice,
  cardName,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  invoice: InvoiceDetail;
  cardName: string;
}) {
  const save = useSetInvoiceDates(invoice.cardId, invoice.month);
  const [closing, setClosing] = useState(invoice.closingDate);
  const [due, setDue] = useState(invoice.dueDate);

  useEffect(() => {
    if (open) {
      setClosing(invoice.closingDate);
      setDue(invoice.dueDate);
    }
  }, [open, invoice.closingDate, invoice.dueDate]);

  const submit = (input: { closingDate?: string | null; dueDate?: string | null }, message: string) =>
    save.mutate(input, {
      onSuccess: () => {
        toast.success(message);
        onOpenChange(false);
      },
    });

  const adjusted = invoice.closingAdjusted || invoice.dueAdjusted;
  const changes: { closingDate?: string; dueDate?: string } = {};
  if (closing && closing !== invoice.closingDate) changes.closingDate = closing;
  if (due && due !== invoice.dueDate) changes.dueDate = due;

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Datas desta fatura"
      description={`${cardName} · ${monthLabel(invoice.month)}`}
    >
      <div className="space-y-4">
        <p className="px-1 text-sm text-muted">
          Use quando o banco mudar o fechamento ou o vencimento por causa de fim de semana ou feriado. Vale só para esta
          fatura.
        </p>
        <Field id="dates-closing" label="Fecha em" hint={`Pelo cartão: ${ddmm(invoice.nominalClosingDate)}. Compras a partir desta data vão para a próxima fatura.`}>
          <Input id="dates-closing" type="date" value={closing} onChange={(e) => setClosing(e.target.value)} />
        </Field>
        <Field id="dates-due" label="Vence em" hint={`Pelo cartão: ${ddmm(invoice.nominalDueDate)}${invoice.dueShifted ? ' (não é dia útil; o app já usa o próximo dia útil)' : ''}.`}>
          <Input id="dates-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </Field>
        <Button
          size="lg"
          disabled={save.isPending || Object.keys(changes).length === 0}
          onClick={() => submit(changes, 'Datas da fatura ajustadas')}
        >
          Salvar datas
        </Button>
        {adjusted && (
          <Button
            variant="secondary"
            size="lg"
            disabled={save.isPending}
            onClick={() => submit({ closingDate: null, dueDate: null }, 'Datas voltaram ao padrão do cartão')}
          >
            Voltar ao padrão do cartão
          </Button>
        )}
      </div>
    </Sheet>
  );
}
