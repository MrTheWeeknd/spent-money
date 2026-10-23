import { Pencil, Trash2 } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

const ACTION_WIDTH = 76;

/**
 * Linha com swipe para a esquerda revelando "Editar" e "Excluir" (estilo iOS).
 * Tocar na linha chama onOpen. As ações também existem no sheet de edição,
 * então os botões revelados ficam fora da ordem de tabulação.
 * `accessory` é um botão extra à direita que acompanha o deslize (ex.: marcar pago).
 */
export function SwipeRow({
  children,
  onOpen,
  onEdit,
  onDelete,
  label,
  accessory,
}: {
  children: ReactNode;
  onOpen: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  label: string;
  accessory?: ReactNode;
}) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ x: number; y: number; base: number; locked?: 'x' | 'y' } | null>(null);
  const moved = useRef(false);
  const width = ((onEdit ? 1 : 0) + (onDelete ? 1 : 0)) * ACTION_WIDTH;

  const close = () => setOffset(0);
  const end = () => {
    if (!start.current) return;
    start.current = null;
    setDragging(false);
    setOffset((o) => (o < -width / 2 ? -width : 0));
  };

  return (
    <li className="relative overflow-hidden">
      {width > 0 && (offset < 0 || dragging) && (
        <div className="absolute inset-y-0 right-0 flex" style={{ width }} aria-hidden>
          {onEdit && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => (close(), onEdit())}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 bg-accent text-xs font-medium text-accent-fg"
            >
              <Pencil className="size-5" /> Editar
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => (close(), onDelete())}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 bg-danger text-xs font-medium text-white"
            >
              <Trash2 className="size-5" /> Excluir
            </button>
          )}
        </div>
      )}
      <div
        className={cn('relative flex items-center bg-surface', !dragging && 'transition-transform duration-200 ease-out')}
        style={{ transform: `translateX(${offset}px)`, touchAction: 'pan-y' }}
        onPointerDown={(e) => {
          if (!width || e.pointerType === 'mouse') return;
          start.current = { x: e.clientX, y: e.clientY, base: offset };
          moved.current = false;
        }}
        onPointerMove={(e) => {
          const s = start.current;
          if (!s) return;
          const dx = e.clientX - s.x;
          const dy = e.clientY - s.y;
          if (!s.locked && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) s.locked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
          if (s.locked !== 'x') return;
          moved.current = true;
          setDragging(true);
          setOffset(Math.max(-width - 24, Math.min(0, s.base + dx)));
        }}
        onPointerUp={end}
        onPointerCancel={() => {
          start.current = null;
          setDragging(false);
          setOffset(0);
        }}
      >
        <button
          type="button"
          aria-label={label}
          className="flex min-h-15 min-w-0 flex-1 items-center gap-3 py-2 pl-4 text-left outline-none active:bg-surface-2 focus-visible:bg-surface-2 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
          style={{ paddingRight: accessory ? 4 : 16 }}
          onClick={() => {
            if (moved.current) return void (moved.current = false);
            if (offset !== 0) return close();
            onOpen();
          }}
        >
          {children}
        </button>
        {accessory}
      </div>
    </li>
  );
}
