import { zodResolver } from '@hookform/resolvers/zod';
import { Users } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { peopleApi } from '@/api/catalog';
import type { Person } from '@/api/types';
import { PersonAvatar } from '@/components/badges';
import { ColorPicker } from '@/components/ColorPicker';
import { ConfirmButton } from '@/components/ConfirmButton';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { fieldA11y } from '@/lib/a11y';
import { Input } from '@/components/ui/input';
import { ListButton, ListGroup } from '@/components/ui/list';
import { Sheet } from '@/components/ui/sheet';
import { useEditor } from '@/hooks/useEditor';
import { CatalogScreen } from './CatalogScreen';

const schema = z.object({
  name: z.string().trim().min(1, 'Informe o nome').max(40),
  color: z.string(),
  avatar: z.string().trim().max(8, 'Use só um emoji'),
  note: z.string().trim().max(200, 'Máximo de 200 caracteres'),
});
type FormValues = z.infer<typeof schema>;

export function PeopleSettings() {
  const query = peopleApi.useList();
  const editor = useEditor<Person>();
  const people = query.data ?? [];

  return (
    <CatalogScreen
      title="Pessoas"
      query={query}
      isEmpty={people.length === 0}
      empty={{ icon: Users, title: 'Ninguém por aqui', description: 'Cadastre quem usa seus cartões.' }}
      newLabel="Nova pessoa"
      onNew={editor.openNew}
      sheet={
        <Sheet open={editor.open} onOpenChange={editor.setOpen} title={editor.item ? 'Editar pessoa' : 'Nova pessoa'}>
          <PersonForm key={editor.item?.id ?? 'new'} person={editor.item} onDone={editor.close} />
        </Sheet>
      }
    >
      <ListGroup footer="Pessoas que usam seus cartões. O saldo devedor de cada uma aparece na aba Pessoas.">
        {people.map((p) => (
          <ListButton
            key={p.id}
            onClick={() => editor.openEdit(p)}
            leading={<PersonAvatar person={p} />}
            title={p.name}
            subtitle={p.isSelf ? 'Você' : p.note}
          />
        ))}
      </ListGroup>
    </CatalogScreen>
  );
}

function PersonForm({ person, onDone }: { person: Person | null; onDone: () => void }) {
  const create = peopleApi.useCreate();
  const update = peopleApi.useUpdate();
  const remove = peopleApi.useRemove();
  const {
    register,
    control,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: person?.name ?? '',
      color: person?.color ?? '#5856d6',
      avatar: person?.avatar ?? '',
      note: person?.note ?? '',
    },
  });
  const preview = watch();

  const onSubmit = handleSubmit((values) => {
    if (person) update.mutate({ id: person.id, ...values });
    else create.mutate(values);
    onDone();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="flex justify-center py-1">
        <PersonAvatar person={{ name: preview.name || '?', color: preview.color, avatar: preview.avatar }} size="lg" />
      </div>
      <Field id="person-name" label="Nome" error={errors.name?.message}>
        <Input {...fieldA11y('person-name', errors.name?.message)} autoComplete="off" {...register('name')} />
      </Field>
      <Field id="person-avatar" label="Emoji (opcional)" error={errors.avatar?.message} hint="Aparece no lugar das iniciais.">
        <Input {...fieldA11y('person-avatar', errors.avatar?.message)} autoComplete="off" placeholder="🙂" {...register('avatar')} />
      </Field>
      <Field id="person-note" label="Observação (opcional)" error={errors.note?.message}>
        <Input {...fieldA11y('person-note', errors.note?.message)} autoComplete="off" {...register('note')} />
      </Field>
      <Controller
        control={control}
        name="color"
        render={({ field }) => <ColorPicker value={field.value} onChange={field.onChange} />}
      />
      <Button type="submit" size="lg">
        Salvar
      </Button>
      {person && !person.isSelf && (
        <ConfirmButton
          label="Excluir pessoa"
          onConfirm={() => {
            remove.mutate(person.id);
            onDone();
          }}
        />
      )}
    </form>
  );
}
