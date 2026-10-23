import type { Card, Category, Person } from '@/api/types';
import { contrastText } from '@/lib/colors';
import { categoryIcon } from '@/lib/icons';
import { cn } from '@/lib/utils';

export function CategoryBadge({ category, size = 'md' }: { category: Pick<Category, 'icon' | 'color'>; size?: 'sm' | 'md' }) {
  const Icon = categoryIcon(category.icon);
  return (
    <span
      className={cn('flex items-center justify-center rounded-full text-white', size === 'md' ? 'size-9' : 'size-7')}
      style={{ backgroundColor: category.color }}
      aria-hidden
    >
      <Icon className={size === 'md' ? 'size-[18px]' : 'size-4'} />
    </span>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export function PersonAvatar({ person, size = 'md' }: { person: Pick<Person, 'name' | 'color' | 'avatar'>; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span
      className={cn(
        'flex items-center justify-center rounded-full font-semibold',
        size === 'sm' && 'size-7 text-xs',
        size === 'md' && 'size-9 text-sm',
        size === 'lg' && 'size-16 text-2xl',
      )}
      style={{ backgroundColor: person.color, color: contrastText(person.color) }}
      aria-hidden
    >
      {person.avatar || initials(person.name)}
    </span>
  );
}

/** Miniatura do cartão na cor escolhida. */
export function CardChip({ card, className }: { card: Pick<Card, 'color' | 'last4'>; className?: string }) {
  return (
    <span
      className={cn('flex h-7 w-11 items-end justify-end rounded-md px-1 pb-0.5 text-[9px] font-semibold tabular', className)}
      style={{ backgroundColor: card.color, color: contrastText(card.color) }}
      aria-hidden
    >
      {card.last4 ?? ''}
    </span>
  );
}
