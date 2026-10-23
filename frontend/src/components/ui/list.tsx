import { ChevronRight } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

/** Grupo de linhas estilo "inset grouped" do iOS. */
export function ListGroup({
  header,
  footer,
  children,
  className,
}: {
  header?: string;
  footer?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('mx-4 mb-6', className)}>
      {header && <h2 className="mb-1.5 px-4 text-[13px] text-muted uppercase">{header}</h2>}
      <ul className="divide-y divide-separator overflow-hidden rounded-2xl bg-surface">{children}</ul>
      {footer && <p className="mt-1.5 px-4 text-[13px] text-muted">{footer}</p>}
    </section>
  );
}

interface RowContent {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  chevron?: boolean;
  dimmed?: boolean;
}

function RowInner({ leading, title, subtitle, trailing, chevron, dimmed }: RowContent) {
  return (
    <>
      {leading && <span className="shrink-0">{leading}</span>}
      <span className={cn('min-w-0 flex-1', dimmed && 'opacity-50')}>
        <span className="block truncate">{title}</span>
        {subtitle && <span className="block truncate text-sm text-muted">{subtitle}</span>}
      </span>
      {trailing && <span className="shrink-0 text-muted">{trailing}</span>}
      {chevron && <ChevronRight className="size-5 shrink-0 text-muted/60" aria-hidden />}
    </>
  );
}

const rowClass =
  'flex min-h-12 w-full items-center gap-3 px-4 py-2.5 text-left active:bg-surface-2 disabled:opacity-50';

export function ListButton({
  className,
  ...props
}: RowContent & Omit<ComponentProps<'button'>, 'title'>) {
  const { leading, title, subtitle, trailing, chevron = true, dimmed, ...rest } = props;
  return (
    <li>
      <button type="button" className={cn(rowClass, className)} {...rest}>
        <RowInner {...{ leading, title, subtitle, trailing, chevron, dimmed }} />
      </button>
    </li>
  );
}

export function ListLink({ to, ...props }: RowContent & { to: string }) {
  return (
    <li>
      <Link to={to} className={rowClass}>
        <RowInner chevron {...props} />
      </Link>
    </li>
  );
}
