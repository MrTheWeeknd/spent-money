import * as RadioGroup from '@radix-ui/react-radio-group';
import { Check } from 'lucide-react';
import { BrandLockup } from '@/components/brand/BrandLogo';
import { BRANDS, setBrand, useBrand, type Brand } from '@/lib/brand';

const ORDER: Brand[] = ['geometrico', 'ludico'];

/**
 * Escolha da identidade visual. Cada opção é renderizada dentro do próprio
 * data-brand, então a prévia mostra as cores e a fonte reais de cada uma.
 */
export function BrandPicker() {
  const brand = useBrand();
  return (
    <section className="mx-4 mb-6" aria-labelledby="identidade">
      <h2 id="identidade" className="mb-1.5 px-4 text-[13px] text-muted uppercase">
        Identidade visual
      </h2>
      <RadioGroup.Root
        value={brand}
        onValueChange={(v) => setBrand(v as Brand)}
        aria-labelledby="identidade"
        className="grid grid-cols-2 gap-3"
      >
        {ORDER.map((b) => (
          <RadioGroup.Item
            key={b}
            value={b}
            data-brand={b}
            aria-label={`${BRANDS[b].label}: ${BRANDS[b].tagline}`}
            className="relative flex flex-col items-start gap-3 rounded-2xl bg-bg p-4 text-left text-fg ring-1 ring-separator transition-shadow data-[state=checked]:ring-2 data-[state=checked]:ring-accent"
          >
            <BrandLockup brand={b} size="sm" />
            <span className="flex gap-1" aria-hidden>
              {['var(--accent)', 'var(--fab)', 'var(--fg)', 'var(--surface-2)'].map((c) => (
                <span key={c} className="size-4 rounded-full ring-1 ring-separator" style={{ backgroundColor: c }} />
              ))}
            </span>
            <span className="font-display text-[15px] font-bold">{BRANDS[b].label}</span>
            <RadioGroup.Indicator className="absolute top-3 right-3 flex size-6 items-center justify-center rounded-full bg-accent text-accent-fg">
              <Check className="size-4" strokeWidth={3} />
            </RadioGroup.Indicator>
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>
      <p className="mt-1.5 px-4 text-[13px] text-muted">{BRANDS[brand].tagline} Vale para este aparelho.</p>
    </section>
  );
}
