import { CalendarRange } from 'lucide-react';
import { toast } from 'sonner';
import { useSettings, useUpdateSettings } from '@/api/finance';
import { ListGroup } from '@/components/ui/list';

const DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

/** Dia em que "meu mês" vira (ex.: 2 = depois de receber no dia 30 e pagar o último cartão). */
export function CycleSetting() {
  const { data } = useSettings();
  const update = useUpdateSettings();
  const value = data?.cycleEndDay ?? 0;

  return (
    <ListGroup
      header="Meu mês"
      footer={
        value
          ? `O ciclo vai do dia ${value + 1} até o dia ${value} do mês seguinte. Entram as faturas que vencem nesse período.`
          : 'Usando o mês do calendário (do dia 1 ao último dia).'
      }
    >
      <li className="flex min-h-12 items-center gap-3 px-4 py-1.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-[#5856d6] text-white" aria-hidden>
          <CalendarRange className="size-[18px]" />
        </span>
        <label htmlFor="cycle-end" className="flex-1">
          Meu mês fecha no dia
        </label>
        <select
          id="cycle-end"
          value={value}
          disabled={!data || update.isPending}
          onChange={(e) => {
            const v = Number(e.target.value);
            update.mutate(
              { cycleEndDay: v || null },
              { onSuccess: () => toast.success(v ? `Meu mês agora fecha no dia ${v}` : 'Usando o mês do calendário') },
            );
          }}
          className="h-10 rounded-lg bg-surface-2 px-2 text-fg"
        >
          <option value={0}>Fim do mês</option>
          {DAYS.map((d) => (
            <option key={d} value={d}>
              Dia {d}
            </option>
          ))}
        </select>
      </li>
    </ListGroup>
  );
}
