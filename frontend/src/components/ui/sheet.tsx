import type { ReactNode } from 'react';
import { Drawer } from 'vaul';
import { cn } from '@/lib/utils';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/** Bottom sheet estilo iOS (arrastar para fechar, respeita o home indicator). */
export function Sheet({ open, onOpenChange, title, description, children, className }: SheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} repositionInputs>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-overlay" />
        <Drawer.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] max-w-lg flex-col rounded-t-[20px] bg-bg outline-none',
            className,
          )}
        >
          <div aria-hidden className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-muted/40" />
          <Drawer.Title className="px-5 pt-3 pb-1 text-center text-lg font-semibold">{title}</Drawer.Title>
          {description ? (
            <Drawer.Description className="px-5 text-center text-sm text-muted">{description}</Drawer.Description>
          ) : (
            <Drawer.Description className="sr-only">{title}</Drawer.Description>
          )}
          <div className="overflow-y-auto px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
