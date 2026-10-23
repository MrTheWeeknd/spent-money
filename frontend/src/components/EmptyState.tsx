import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-8 py-16 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-surface-2">
        <Icon className="size-8 text-muted" aria-hidden />
      </div>
      <p className="text-lg font-semibold">{title}</p>
      {description && <p className="mt-1 text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
