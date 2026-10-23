export type NumKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '00' | 'back' | 'clear';

export const KEYS: NumKey[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'back'];

/** Aplica uma tecla ao valor em centavos (digitação estilo caixa: 1 → 0,01 → 0,12 → 1,25). */
export function applyKey(cents: number, key: NumKey): number {
  if (key === 'clear') return 0;
  if (key === 'back') return Math.floor(cents / 10);
  const next = Number(`${cents}${key}`);
  return next > 99_999_999_99 ? cents : next;
}

