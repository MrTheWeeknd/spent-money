// Paleta para identificar cartões, pessoas, categorias e contas.
export const PALETTE = [
  '#ff3b30',
  '#ff9500',
  '#ffcc00',
  '#34c759',
  '#00c7be',
  '#30b0c7',
  '#007aff',
  '#5856d6',
  '#af52de',
  '#ff2d55',
  '#a2845e',
  '#8e8e93',
  '#820ad1',
  '#ec7000',
  '#cc092f',
  '#1c1c1e',
];

/** Cor de texto legível sobre um fundo hexadecimal. */
export function contrastText(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#000000' : '#ffffff';
}
