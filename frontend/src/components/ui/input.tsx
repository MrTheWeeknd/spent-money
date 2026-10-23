import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'h-12 w-full rounded-xl bg-surface px-4 text-base text-fg placeholder:text-muted outline-none focus-visible:ring-2 focus-visible:ring-accent aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-danger',
        className,
      )}
      {...props}
    />
  );
}
