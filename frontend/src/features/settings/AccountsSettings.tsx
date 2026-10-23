import { zodResolver } from '@hookform/resolvers/zod';
import { Landmark, PiggyBank, Wallet } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { accountsApi } from '@/api/catalog';
import { ACCOUNT_TYPES, type Account, type AccountType } from '@/api/types';
import { ColorPicker } from '@/components/ColorPicker';
import { ConfirmButton } from '@/components/ConfirmButton';
import { MoneyInput } from '@/components/MoneyInput';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ListButton, ListGroup } from '@/components/ui/list';
import { Segmented } from '@/components/ui/segmented';
import { Sheet } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { useEditor } from '@/hooks/useEditor';
import { ACCOUNT_TYPE_LABELS } from '@/lib/labels';
import { formatBRL } from '@/lib/money';
import { CatalogScreen } from './CatalogScreen';

const schema = z.object({
  name: z.string().trim().min(1, 'Informe o nome').max(40),
  type: z.enum(ACCOUNT_TYPES),
  initialBalance: z.number({ error: 'Informe o saldo inicial' }).int(),
  color: z.string(),
  archived: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

const TYPE_ICONS: Record<AccountType, typeof Wallet> = { checking: Landmark, wallet: Wallet, savings: PiggyBank };
const typeOptions = ACCOUNT_TYPES.map((value) => ({ value, label: ACCOUNT_TYPE_LABELS[value] }));

export function AccountsSettings() {
  const query = accountsApi.useList();
  const editor = useEditor<Account>();
  const accounts = query.data ?? [];

  return (
    <CatalogScreen
      title="Contas"
      query={query}
      isEmpty={accounts.length === 0}
      empty={{ icon: Landmark, title: 'Nenhuma conta', description: 'Opcional: use contas para organizar receitas, débito e Pix.' }}
      newLabel="Nova conta"
      onNew={editor.openNew}
      sheet={
        <Sheet open={editor.open} onOpenChange={editor.setOpen} title={editor.item ? 'Editar conta' : 'Nova conta'}>
          <AccountForm key={editor.item?.id ?? 'new'} account={editor.item} onDone={editor.close} />
        </Sheet>
      }
    >
      <ListGroup>
        {accounts.map((a) => {
          const Icon = TYPE_ICONS[a.type];
          return (
            <ListButton
              key={a.id}
              onClick={() => editor.openEdit(a)}
              leading={
                <span className="flex size-9 items-center justify-center rounded-full text-white" style={{ backgroundColor: a.color }} aria-hidden>
                  <Icon className="size-[18px]" />
                </span>
              }
              title={a.name}
              subtitle={a.archived ? 'Arquivada' : ACCOUNT_TYPE_LABELS[a.type]}
              trailing={<span className="tabular">{formatBRL(a.initialBalance)}</span>}
              dimmed={a.archived}
            />
          );
        })}
      </ListGroup>
    </CatalogScreen>
  );
}

function AccountForm({ account, onDone }: { account: Account | null; onDone: () => void }) {
  const create = accountsApi.useCreate();
  const update = accountsApi.useUpdate();
  const remove = accountsApi.useRemove();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: account ?? { name: '', type: 'checking', initialBalance: 0, color: '#007aff', archived: false },
  });

  const onSubmit = handleSubmit((values) => {
    if (account) update.mutate({ id: account.id, ...values });
    else create.mutate(values);
    onDone();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field id="acc-name" label="Nome" error={errors.name?.message}>
        <Input id="acc-name" aria-invalid={!!errors.name} autoComplete="off" placeholder="Ex.: Nubank conta" {...register('name')} />
      </Field>
      <Controller
        control={control}
        name="type"
        render={({ field }) => <Segmented label="Tipo de conta" value={field.value} onValueChange={field.onChange} options={typeOptions} />}
      />
      <Field id="acc-balance" label="Saldo inicial" error={errors.initialBalance?.message} hint="Use um sinal de menos para saldo negativo.">
        <Controller
          control={control}
          name="initialBalance"
          render={({ field }) => (
            <MoneyInput id="acc-balance" allowNegative value={field.value} onChange={(v) => field.onChange(v ?? 0)} onBlur={field.onBlur} />
          )}
        />
      </Field>
      <Controller control={control} name="color" render={({ field }) => <ColorPicker value={field.value} onChange={field.onChange} />} />
      {account && (
        <Controller
          control={control}
          name="archived"
          render={({ field }) => (
            <label className="flex min-h-12 items-center justify-between rounded-2xl bg-surface px-4">
              Arquivada
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </label>
          )}
        />
      )}
      <Button type="submit" size="lg">
        Salvar
      </Button>
      {account && (
        <ConfirmButton
          label="Excluir conta"
          onConfirm={() => {
            remove.mutate(account.id);
            onDone();
          }}
        />
      )}
    </form>
  );
}
