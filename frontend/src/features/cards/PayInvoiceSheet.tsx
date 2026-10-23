import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { usePayInvoice } from '@/api/finance';
import type { InvoiceDetail } from '@/api/types';
import { MoneyInput } from '@/components/MoneyInput';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Sheet } from '@/components/ui/sheet';
import { useCatalog } from '@/hooks/useCatalog';
import { fieldA11y } from '@/lib/a11y';
import { localDay, monthLabel } from '@/lib/dates';
import { formatBRL } from '@/lib/money';

const schema = z.object({
  amount: z.number({ error: 'Informe o valor' }).int().min(1, 'Informe um valor maior que zero'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data'),
  accountId: z.string(),
  note: z.string().trim().max(200),
});
type FormValues = z.infer<typeof schema>;

export function PayInvoiceSheet({
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
  const pay = usePayInvoice(invoice.cardId, invoice.month);
  const cat = useCatalog();
  const accounts = cat.accounts.filter((a) => !a.archived);
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (open) {
      reset({ amount: invoice.remaining || undefined, date: localDay(), accountId: accounts[0]?.id ?? '', note: '' });
    }
    // Só ao abrir: os valores sugeridos não devem mudar enquanto o usuário edita.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = handleSubmit((v) => {
    onOpenChange(false);
    pay.mutate(
      { amount: v.amount, date: v.date, accountId: v.accountId || null, note: v.note || undefined },
      {
        onSuccess: (inv) =>
          toast.success(
            inv.status === 'paid'
              ? `Fatura de ${monthLabel(inv.month)} paga`
              : `Pagamento de ${formatBRL(v.amount)} registrado · faltam ${formatBRL(inv.remaining)}`,
          ),
      },
    );
  });

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Pagar fatura"
      description={`${cardName} · ${monthLabel(invoice.month)} · restam ${formatBRL(invoice.remaining)}`}
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field id="pay-amount" label="Valor pago" error={errors.amount?.message}>
          <Controller
            control={control}
            name="amount"
            render={({ field }) => (
              <MoneyInput
                {...fieldA11y('pay-amount', errors.amount?.message)}
                value={field.value}
                onChange={(v) => field.onChange(v ?? undefined)}
                onBlur={field.onBlur}
                placeholder="R$ 0,00"
              />
            )}
          />
        </Field>
        {invoice.remaining > 0 && (
          <Button type="button" variant="secondary" onClick={() => setValue('amount', invoice.remaining)}>
            Valor total ({formatBRL(invoice.remaining)})
          </Button>
        )}
        <Field id="pay-date" label="Data do pagamento" error={errors.date?.message}>
          <Input {...fieldA11y('pay-date', errors.date?.message)} type="date" {...register('date')} />
        </Field>
        {accounts.length > 0 && (
          <Field id="pay-account" label="Pago com a conta (opcional)">
            <select id="pay-account" className="h-12 w-full rounded-xl bg-surface px-3 text-fg" {...register('accountId')}>
              <option value="">Nenhuma</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field id="pay-note" label="Observação (opcional)">
          <Input id="pay-note" autoComplete="off" placeholder="Ex.: pago pelo app do banco" {...register('note')} />
        </Field>
        <p className="px-1 text-sm text-muted">
          O pagamento não entra como despesa nova: as compras já contam no mês da fatura.
        </p>
        <Button type="submit" size="lg">
          Registrar pagamento
        </Button>
      </form>
    </Sheet>
  );
}
