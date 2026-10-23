import type { Brand } from '@/lib/brand';
import { useBrand } from '@/lib/brand';
import { cn } from '@/lib/utils';

/**
 * Símbolo da marca, nas cores do tema atual (--brand-mark / --brand-mark-2).
 * Geométrico: o sol nascendo sobre a linha do horizonte.
 * Lúdico: um olho aberto, outro piscando.
 */
export function BrandMark({ brand, className }: { brand?: Brand; className?: string }) {
  const current = useBrand();
  const b = brand ?? current;
  return b === 'ludico' ? (
    <svg viewBox="0 0 56 32" className={cn('h-8 w-auto', className)} aria-hidden>
      <circle cx="13" cy="16" r="10" fill="var(--brand-mark)" />
      <rect x="29" y="12" width="22" height="8" rx="4" fill="var(--brand-mark-2)" className="origin-[40px_16px] motion-safe:animate-[wink_4s_ease-in-out_infinite]" />
    </svg>
  ) : (
    <svg viewBox="0 0 56 40" className={cn('h-8 w-auto', className)} aria-hidden>
      <path d="M9 25 A19 19 0 0 1 47 25 Z" fill="var(--brand-mark)" />
      <rect x="7" y="29" width="42" height="7" rx="3.5" fill="var(--brand-mark-2)" />
    </svg>
  );
}

/** Logotipo "quanto deu" em duas linhas. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn('block font-display tracking-[-0.03em] text-brand-ink lowercase', className)}
      // Entrelinha fixa no style: as classes de tamanho (text-3xl…) trazem line-height próprio.
      style={{ fontWeight: 'var(--brand-weight)', lineHeight: 0.88 }}
    >
      quanto
      <br />
      deu
    </span>
  );
}

/** Símbolo + logotipo lado a lado, como na identidade. */
export function BrandLockup({ brand, size = 'md' }: { brand?: Brand; size?: 'sm' | 'md' | 'lg' }) {
  const mark = { sm: 'h-6', md: 'h-9', lg: 'h-14' }[size];
  const text = { sm: 'text-xl', md: 'text-3xl', lg: 'text-[52px]' }[size];
  return (
    <span className="inline-flex items-center gap-3" role="img" aria-label="Quanto Deu">
      <BrandMark brand={brand} className={mark} />
      <Wordmark className={text} />
    </span>
  );
}
