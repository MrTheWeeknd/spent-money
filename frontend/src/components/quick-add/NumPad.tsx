import { Delete } from 'lucide-react';
import { useRef } from 'react';
import { KEYS, type NumKey } from './numpad-keys';

/** Teclado numérico grande, sempre visível (não depende do teclado do iOS). */
export function NumPad({ onKey }: { onKey: (k: NumKey) => void }) {
  const holdTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  return (
    <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Teclado numérico">
      {KEYS.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onKey(k)}
          // Segurar o apagar limpa tudo.
          onPointerDown={k === 'back' ? () => (holdTimer.current = setTimeout(() => onKey('clear'), 500)) : undefined}
          onPointerUp={k === 'back' ? () => clearTimeout(holdTimer.current) : undefined}
          onPointerLeave={k === 'back' ? () => clearTimeout(holdTimer.current) : undefined}
          aria-label={k === 'back' ? 'Apagar (segure para limpar)' : k === '00' ? 'Dois zeros' : k}
          className="flex h-[52px] items-center justify-center rounded-xl bg-surface text-[26px] font-medium tabular shadow-[0_1px_0_rgb(0_0_0/0.08)] select-none active:bg-surface-2 dark:shadow-none"
        >
          {k === 'back' ? <Delete className="size-6" aria-hidden /> : k}
        </button>
      ))}
    </div>
  );
}
