import * as RadioGroup from '@radix-ui/react-radio-group';
import { cn } from '@/lib/utils';

interface SegmentedProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: { value: T; label: string }[];
  label: string;
  className?: string;
}

/** Controle segmentado do iOS (radio group acessível). */
export function Segmented<T extends string>({ value, onValueChange, options, label, className }: SegmentedProps<T>) {
  return (
    <RadioGroup.Root
      value={value}
      onValueChange={(v) => onValueChange(v as T)}
      aria-label={label}
      orientation="horizontal"
      className={cn('grid auto-cols-fr grid-flow-col rounded-xl bg-fg/[0.07] p-0.5', className)}
    >
      {options.map((o) => (
        <RadioGroup.Item
          key={o.value}
          value={o.value}
          className="h-10 rounded-[10px] text-[15px] font-medium text-fg transition-colors data-[state=checked]:bg-surface data-[state=checked]:shadow-sm dark:data-[state=checked]:bg-surface-2"
        >
          {o.label}
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
