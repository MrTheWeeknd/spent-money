import { zodResolver } from '@hookform/resolvers/zod';
import { Tags } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { categoriesApi } from '@/api/catalog';
import type { Category, CategoryType } from '@/api/types';
import { CategoryBadge } from '@/components/badges';
import { ColorPicker } from '@/components/ColorPicker';
import { ConfirmButton } from '@/components/ConfirmButton';
import { IconPicker } from '@/components/IconPicker';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { fieldA11y } from '@/lib/a11y';
import { Input } from '@/components/ui/input';
import { ListButton, ListGroup } from '@/components/ui/list';
import { Segmented } from '@/components/ui/segmented';
import { Sheet } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { useEditor } from '@/hooks/useEditor';
import { CATEGORY_TYPE_LABELS } from '@/lib/labels';
import { CatalogScreen } from './CatalogScreen';

const schema = z.object({
  name: z.string().trim().min(1, 'Informe o nome').max(40),
  icon: z.string(),
  color: z.string(),
  archived: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

const typeOptions = (['expense', 'income'] as const).map((value) => ({ value, label: CATEGORY_TYPE_LABELS[value] }));

export function CategoriesSettings() {
  const query = categoriesApi.useList();
  const editor = useEditor<Category>();
  const [type, setType] = useState<CategoryType>('expense');
  const items = (query.data ?? []).filter((c) => c.type === type);
  const active = items.filter((c) => !c.archived);
  const archived = items.filter((c) => c.archived);

  const row = (c: Category) => (
    <ListButton key={c.id} onClick={() => editor.openEdit(c)} leading={<CategoryBadge category={c} />} title={c.name} dimmed={c.archived} />
  );

  return (
    <CatalogScreen
      title="Categorias"
      query={query}
      isEmpty={false}
      empty={{ icon: Tags, title: '', description: '' }}
      newLabel="Nova categoria"
      onNew={editor.openNew}
      sheet={
        <Sheet open={editor.open} onOpenChange={editor.setOpen} title={editor.item ? 'Editar categoria' : `Nova categoria de ${CATEGORY_TYPE_LABELS[type].toLowerCase()}`}>
          <CategoryForm key={editor.item?.id ?? `new-${type}`} category={editor.item} type={type} onDone={editor.close} />
        </Sheet>
      }
    >
      <div className="px-4 pb-4">
        <Segmented label="Tipo de categoria" value={type} onValueChange={setType} options={typeOptions} />
      </div>
      {active.length > 0 && <ListGroup>{active.map(row)}</ListGroup>}
      {archived.length > 0 && <ListGroup header="Arquivadas">{archived.map(row)}</ListGroup>}
    </CatalogScreen>
  );
}

function CategoryForm({ category, type, onDone }: { category: Category | null; type: CategoryType; onDone: () => void }) {
  const create = categoriesApi.useCreate();
  const update = categoriesApi.useUpdate();
  const remove = categoriesApi.useRemove();
  const {
    register,
    control,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: category?.name ?? '',
      icon: category?.icon ?? 'circle-ellipsis',
      color: category?.color ?? '#007aff',
      archived: category?.archived ?? false,
    },
  });
  const color = watch('color');

  const onSubmit = handleSubmit((values) => {
    if (category) update.mutate({ id: category.id, ...values });
    else create.mutate({ ...values, type });
    onDone();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field id="cat-name" label="Nome" error={errors.name?.message}>
        <Input {...fieldA11y('cat-name', errors.name?.message)} autoComplete="off" {...register('name')} />
      </Field>
      <Controller
        control={control}
        name="icon"
        render={({ field }) => <IconPicker value={field.value} onChange={field.onChange} color={color} />}
      />
      <Controller control={control} name="color" render={({ field }) => <ColorPicker value={field.value} onChange={field.onChange} />} />
      {category && (
        <Controller
          control={control}
          name="archived"
          render={({ field }) => (
            <label className="flex min-h-12 items-center justify-between rounded-2xl bg-surface px-4">
              <span>
                Arquivada
                <span className="block text-sm text-muted">Some das sugestões, mas fica nos lançamentos antigos.</span>
              </span>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </label>
          )}
        />
      )}
      <Button type="submit" size="lg">
        Salvar
      </Button>
      {category && (
        <ConfirmButton
          label="Excluir categoria"
          onConfirm={() => {
            remove.mutate(category.id);
            onDone();
          }}
        />
      )}
    </form>
  );
}
