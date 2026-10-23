/** Props de acessibilidade para o controle dentro de um Field. */
export function fieldA11y(id: string, error?: string) {
  return { id, 'aria-invalid': !!error, 'aria-describedby': error ? `${id}-error` : undefined };
}
