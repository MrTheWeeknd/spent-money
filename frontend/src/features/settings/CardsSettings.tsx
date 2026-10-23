import { zodResolver } from '@hookform/resolvers/zod';
import { CreditCard } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { cardsApi } from '@/api/catalog';
import { CARD_BRANDS, type Card } from '@/api/types';
import { CardChip } from '@/components/badges';
import { ColorPicker } from '@/components/ColorPicker';
import { ConfirmButton } from '@/components/ConfirmButton';
import { MoneyInput } from '@/components/MoneyInput';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { fieldA11y } from '@/lib/a11y';
import { Input } from '@/components/ui/input';
import { ListButton, ListGroup } from '@/components/ui/list';
import { Sheet } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { useEditor } from '@/hooks/useEditor';
import { BRAND_LABELS } from '@/lib/labels';
import { formatBRL } from '@/lib/money';
import { CatalogScreen } from './CatalogScreen';

const day = (label: string) =>
  z
    .number({ error: `Informe o ${label}` })
    .int()
    .min(1, 'Use um dia entre 1 e 31')
    .max(31, 'Use um dia entre 1 e 31');

const schema = z.object({
  name: z.string().trim().min(1, 'Dê um nome ao cartão').max(40),
  brand: z.enum(CARD_BRANDS),
  last4: z.string().regex(/^(\d{4})?$/, 'Use os 4 últimos dígitos (ou deixe vazio)'),
  color: z.string(),
  closingDay: day('dia de fechamento'),
  dueDay: day('dia de vencimento'),
  limit: z.number().int().min(0).nullable(),
  active: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export function CardsSettings() {
  const query = cardsApi.useList();
  const editor = useEditor<Card>();
  const cards = query.data ?? [];

  return (
    <CatalogScreen
      title="Cartões"
      query={query}
      isEmpty={cards.length === 0}
      empty={{ icon: CreditCard, title: 'Nenhum cartão', description: 'Cadastre seus cartões para acompanhar as faturas.' }}
      newLabel="Novo cartão"
      onNew={editor.openNew}
      sheet={
        <Sheet open={editor.open} onOpenChange={editor.setOpen} title={editor.item ? 'Editar cartão' : 'Novo cartão'}>
          <CardForm key={editor.item?.id ?? 'new'} card={editor.item} onDone={editor.close} />
        </Sheet>
      }
    >
      <ListGroup footer="Guardamos só o apelido, a bandeira e os 4 últimos dígitos.">
        {cards.map((c) => (
          <ListButton
            key={c.id}
            onClick={() => editor.openEdit(c)}
            leading={<CardChip card={c} />}
            title={c.name}
            subtitle={`${c.last4 ? `•••• ${c.last4} · ` : ''}fecha dia ${c.closingDay} · vence dia ${c.dueDay}`}
            trailing={!c.active ? 'Inativo' : c.limit ? formatBRL(c.limit) : undefined}
            dimmed={!c.active}
          />
        ))}
      </ListGroup>
    </CatalogScreen>
  );
}

function CardForm({ card, onDone }: { card: Card | null; onDone: () => void }) {
  const create = cardsApi.useCreate();
  const update = cardsApi.useUpdate();
  const remove = cardsApi.useRemove();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: card
      ? { ...card, last4: card.last4 ?? '', limit: card.limit ?? null }
      : { name: '', brand: 'mastercard', last4: '', color: '#820ad1', closingDay: undefined, dueDay: undefined, limit: null, active: true },
  });

  const onSubmit = handleSubmit((values) => {
    if (card) update.mutate({ id: card.id, ...values });
    else create.mutate(values);
    onDone();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field id="card-name" label="Apelido" error={errors.name?.message}>
        <Input {...fieldA11y('card-name', errors.name?.message)} placeholder="Ex.: Nubank" autoComplete="off" {...register('name')} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field id="card-brand" label="Bandeira">
          <select id="card-brand" className="h-12 w-full rounded-xl bg-surface px-3 text-fg" {...register('brand')}>
            {CARD_BRANDS.map((b) => (
              <option key={b} value={b}>
                {BRAND_LABELS[b]}
              </option>
            ))}
          </select>
        </Field>
        <Field id="card-last4" label="Final (opcional)" error={errors.last4?.message}>
          <Input
            {...fieldA11y('card-last4', errors.last4?.message)}
            inputMode="numeric"
            maxLength={4}
            placeholder="1234"
            autoComplete="off"
            className="tabular"
            {...register('last4')}
          />
        </Field>
        <Field id="card-closing" label="Dia do fechamento" error={errors.closingDay?.message}>
          <Input
            {...fieldA11y('card-closing', errors.closingDay?.message)}
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            {...register('closingDay', { valueAsNumber: true })}
          />
        </Field>
        <Field id="card-due" label="Dia do vencimento" error={errors.dueDay?.message}>
          <Input
            {...fieldA11y('card-due', errors.dueDay?.message)}
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            {...register('dueDay', { valueAsNumber: true })}
          />
        </Field>
      </div>
      <Field id="card-limit" label="Limite (opcional)">
        <Controller
          control={control}
          name="limit"
          render={({ field }) => (
            <MoneyInput id="card-limit" placeholder="R$ 0,00" value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
          )}
        />
      </Field>
      <Controller
        control={control}
        name="color"
        render={({ field }) => <ColorPicker value={field.value} onChange={field.onChange} label="Cor do cartão" />}
      />
      {card && (
        <Controller
          control={control}
          name="active"
          render={({ field }) => (
            <label className="flex min-h-12 items-center justify-between rounded-2xl bg-surface px-4">
              Ativo
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </label>
          )}
        />
      )}
      <Button type="submit" size="lg">
        Salvar
      </Button>
      {card && (
        <ConfirmButton
          label="Excluir cartão"
          onConfirm={() => {
            remove.mutate(card.id);
            onDone();
          }}
        />
      )}
    </form>
  );
}
