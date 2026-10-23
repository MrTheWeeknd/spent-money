// Valores sempre em centavos (inteiro). Formatação BRL só na UI.

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatBRL(cents: number): string {
  return brl.format(cents / 100);
}

const num = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Valor sem símbolo da moeda (tabelas). */
export function formatNumber(cents: number): string {
  return num.format(cents / 100);
}

/** Converte texto digitado ("1.234,56" ou "1234.56") em centavos. Retorna null se inválido. */
export function parseBRL(input: string): number | null {
  const clean = input.replace(/[^\d,.-]/g, '');
  if (!clean) return null;
  const normalized = clean.includes(',') ? clean.replace(/\./g, '').replace(',', '.') : clean;
  const value = Number(normalized);
  return Number.isFinite(value) ? Math.round(value * 100) : null;
}
