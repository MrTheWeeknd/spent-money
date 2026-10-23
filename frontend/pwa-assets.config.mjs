// Gera os ícones das duas identidades: npx pwa-assets-generator
// Fonte quadrada sem margem: o iOS e o Android aplicam a própria máscara arredondada.
import { defineConfig, minimal2023Preset as preset } from '@vite-pwa/assets-generator/config';

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...preset,
    transparent: { ...preset.transparent, padding: 0 },
    maskable: { ...preset.maskable, padding: 0 },
    apple: { ...preset.apple, padding: 0 },
  },
  images: ['public/brand/geometrico/icon-full.svg', 'public/brand/ludico/icon-full.svg'],
});
