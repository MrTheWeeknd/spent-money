import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useCreateSettlement } from '@/api/finance';
import type { Person } from '@/api/types';
import { MoneyInput } from '@/components/MoneyInput';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Sheet } from '@/components/ui/sheet';
import { fieldA11y } from '@/lib/a11y';
import { localDay } from '@/lib/dates';
import { formatBRL } from '@/lib/money';

const schema = z.object({
  amount: z.number({ error: 'Informe o valor' }).int().min(1, 'Informe um valor maior que zero'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data'),
  note: z.string().trim().max(200),
});
type FormValues = z.infer<typeof schema>;

export function SettlementSheet({
  open,
  onOpenChange,
  person,
  suggested,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  person: Person;
  suggested: number;
}) {
  const create = useCreateSettlement();
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (open) reset({ amount: suggested || undefined, date: localDay(), note: '' });
  }, [open, suggested, reset]);

  const onSubmit = handleSubmit((v) => {
    onOpenChange(false);
    create.mutate(
      { personId: person.id, ...v, note: v.note || undefined },
      { onSuccess: () => toast.success(`Pagamento de ${formatBRL(v.amount)} registrado`) },
    );
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Registrar pagamento" description={`Quanto ${person.name} te pagou?`}>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field id="st-amount" label="Valor" error={errors.amount?.message}>
          <Controller
            control={control}
            name="amount"
            render={({ field }) => (
              <MoneyInput
                {...fieldA11y('st-amount', errors.amount?.message)}
                value={field.value}
                onChange={(v) => field.onChange(v ?? undefined)}
                onBlur={field.onBlur}
                placeholder="R$ 0,00"
              />
            )}
          />
        </Field>
        {suggested > 0 && (
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => reset((v) => ({ ...v, amount: suggested }))}>
              Tudo ({formatBRL(suggested)})
            </Button>
          </div>
        )}
        <Field id="st-date" label="Data" error={errors.date?.message}>
          <Input {...fieldA11y('st-date', errors.date?.message)} type="date" {...register('date')} />
        </Field>
        <Field id="st-note" label="Observação (opcional)">
          <Input id="st-note" placeholder="Ex.: Pix" autoComplete="off" {...register('note')} />
        </Field>
        <Button type="submit" size="lg">
          Registrar
        </Button>
      </form>
    </Sheet>
  );
}
