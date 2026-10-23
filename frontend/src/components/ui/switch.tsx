import * as SwitchPrimitive from '@radix-ui/react-switch';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'relative inline-flex h-[31px] w-[51px] shrink-0 items-center rounded-full bg-fg/15 transition-colors data-[state=checked]:bg-income focus-visible:outline-2 focus-visible:outline-accent',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-[27px] translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
    </SwitchPrimitive.Root>
  );
}
