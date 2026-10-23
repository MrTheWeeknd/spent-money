import * as RadioGroup from '@radix-ui/react-radio-group';
import { Check } from 'lucide-react';
import { contrastText, PALETTE } from '@/lib/colors';

export function ColorPicker({ value, onChange, label = 'Cor' }: { value: string; onChange: (c: string) => void; label?: string }) {
  return (
    <RadioGroup.Root
      value={value}
      onValueChange={onChange}
      aria-label={label}
      className="grid grid-cols-8 justify-items-center gap-y-2 rounded-2xl bg-surface p-3"
    >
      {PALETTE.map((c) => (
        <RadioGroup.Item
          key={c}
          value={c}
          aria-label={c}
          className="tap flex items-center justify-center rounded-full"
        >
          <span className="flex size-8 items-center justify-center rounded-full" style={{ backgroundColor: c }}>
            <RadioGroup.Indicator>
              <Check className="size-4" strokeWidth={3} style={{ color: contrastText(c) }} />
            </RadioGroup.Indicator>
          </span>
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
