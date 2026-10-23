import * as RadioGroup from '@radix-ui/react-radio-group';
import { useEffect, useRef, type ReactNode } from 'react';
import { contrastText } from '@/lib/colors';
import { cn } from '@/lib/utils';

export interface ChipOption {
  value: string;
  label: string;
  leading?: ReactNode;
  color?: string;
}

/** Linha de chips com rolagem horizontal (radio group: um selecionado por vez). */
export function ChipRow({
  label,
  hint,
  value,
  onChange,
  options,
}: {
  label: string;
  hint?: string;
  value: string | null;
  onChange: (v: string) => void;
  options: ChipOption[];
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Mantém o chip selecionado visível.
  useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>('[data-state="checked"]');
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [value]);

  return (
    <div>
      <div className="mb-1 flex items-baseline gap-2 px-1 text-xs font-medium text-muted">
        <span>{label}</span>
        {hint && <span className="text-accent">{hint}</span>}
      </div>
      <RadioGroup.Root
        ref={ref}
        value={value ?? ''}
        onValueChange={onChange}
        aria-label={label}
        orientation="horizontal"
        loop={false}
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {options.map((o) => (
          <RadioGroup.Item
            key={o.value}
            value={o.value}
            className={cn(
              'flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-separator bg-surface px-3.5 text-[15px] font-medium whitespace-nowrap transition-colors',
              'data-[state=checked]:border-transparent',
            )}
            style={
              value === o.value
                ? o.color
                  ? { backgroundColor: o.color, color: contrastText(o.color) }
                  : { backgroundColor: 'var(--accent)', color: 'var(--accent-fg)' }
                : undefined
            }
          >
            {o.leading}
            {o.label}
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>
    </div>
  );
}
