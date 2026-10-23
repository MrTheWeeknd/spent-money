import * as RadioGroup from '@radix-ui/react-radio-group';
import { CATEGORY_ICONS } from '@/lib/icons';

export function IconPicker({ value, onChange, color }: { value: string; onChange: (v: string) => void; color: string }) {
  return (
    <RadioGroup.Root
      value={value}
      onValueChange={onChange}
      aria-label="Ícone"
      className="grid grid-cols-7 justify-items-center gap-1 rounded-2xl bg-surface p-2"
    >
      {Object.entries(CATEGORY_ICONS).map(([name, Icon]) => (
        <RadioGroup.Item
          key={name}
          value={name}
          aria-label={name}
          className="tap flex items-center justify-center rounded-xl text-muted data-[state=checked]:text-white"
          style={value === name ? { backgroundColor: color } : undefined}
        >
          <Icon className="size-5" aria-hidden />
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
