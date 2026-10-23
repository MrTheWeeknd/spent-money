import { useSyncExternalStore } from 'react';

export type Brand = 'geometrico' | 'ludico';

export const BRANDS: Record<Brand, { label: string; tagline: string; themeColor: { light: string; dark: string } }> = {
  geometrico: {
    label: 'Geométrico',
    tagline: 'Calmo e equilibrado: o sol nascendo sobre a linha do horizonte.',
    themeColor: { light: '#f5efe3', dark: '#111918' },
  },
  ludico: {
    label: 'Lúdico',
    tagline: 'Direto e bem-humorado: um olho aberto, outro piscando.',
    themeColor: { light: '#f3f3f6', dark: '#141418' },
  },
};

// Preferência por aparelho. O index.html lê a mesma chave antes do React para não piscar.
const KEY = 'qd-brand';
const listeners = new Set<() => void>();

function read(): Brand {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'ludico' ? 'ludico' : 'geometrico';
  } catch {
    return 'geometrico';
  }
}

/** Aplica a marca no documento: tokens CSS, cor da barra do Safari e ícones. */
export function applyBrand(brand: Brand) {
  const root = document.documentElement;
  root.dataset.brand = brand;
  const { light, dark } = BRANDS[brand].themeColor;
  document.querySelector('meta[name="theme-color"][media*="light"]')?.setAttribute('content', light);
  document.querySelector('meta[name="theme-color"][media*="dark"]')?.setAttribute('content', dark);
  // O iOS usa o apple-touch-icon do momento em que o app é adicionado à tela de início.
  document.querySelector('link[rel="apple-touch-icon"]')?.setAttribute('href', `/brand/${brand}/apple-touch-icon-180x180.png`);
  document.querySelector('link[rel="icon"]')?.setAttribute('href', `/brand/${brand}/icon.svg`);
}

export function setBrand(brand: Brand) {
  try {
    localStorage.setItem(KEY, brand);
  } catch {
    // Navegação privada: vale só nesta sessão.
  }
  applyBrand(brand);
  listeners.forEach((l) => l());
}

export function useBrand(): Brand {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => (document.documentElement.dataset.brand as Brand) || read(),
  );
}
