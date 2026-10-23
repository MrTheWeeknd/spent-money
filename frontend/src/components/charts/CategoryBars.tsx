import { useCatalog } from '@/hooks/useCatalog';
import { formatBRL } from '@/lib/money';
import { CategoryBadge } from '../badges';

/**
 * Gastos por categoria como lista ordenada de barras finas.
 * A identidade vem do ícone + nome (não só da cor); o valor fica escrito em cada linha.
 */
export function CategoryBars({
  data,
  limit = 6,
}: {
  data: { categoryId: string; total: number }[];
  limit?: number;
}) {
  const cat = useCatalog();
  const total = data.reduce((s, d) => s + d.total, 0);
  if (!total) return null;

  const top = data.slice(0, limit);
  const rest = data.slice(limit).reduce((s, d) => s + d.total, 0);
  const rows = [
    ...top.map((d) => {
      const c = cat.category.get(d.categoryId);
      return { key: d.categoryId, name: c?.name ?? 'Categoria removida', color: c?.color ?? '#8e8e93', icon: c?.icon ?? 'circle-ellipsis', total: d.total };
    }),
    ...(rest > 0 ? [{ key: 'other', name: 'Outras', color: '#8e8e93', icon: 'circle-ellipsis', total: rest }] : []),
  ];
  const max = Math.max(...rows.map((r) => r.total));

  return (
    <ul className="space-y-3">
      {rows.map((r) => {
        const pct = Math.round((r.total / total) * 100);
        return (
          <li key={r.key} className="flex items-center gap-3">
            <CategoryBadge category={r} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2 text-[15px]">
                <span className="truncate">{r.name}</span>
                <span className="shrink-0 tabular">
                  {formatBRL(r.total)} <span className="text-sm text-muted">{pct}%</span>
                </span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-surface-2" aria-hidden>
                <div
                  className="h-2 rounded-full"
                  style={{ width: `${Math.max(2, (r.total / max) * 100)}%`, backgroundColor: r.color }}
                />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
