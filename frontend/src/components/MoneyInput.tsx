import { useEffect, useState, type ComponentProps } from 'react';
import { formatBRL, parseBRL } from '@/lib/money';
import { Input } from './ui/input';

type Props = Omit<ComponentProps<'input'>, 'value' | 'onChange'> & {
  value: number | null | undefined;
  onChange: (cents: number | null) => void;
  allowNegative?: boolean;
};

/** Campo de valor em reais que entrega centavos. Teclado decimal no iOS. */
export function MoneyInput({ value, onChange, allowNegative, onBlur, ...props }: Props) {
  const [text, setText] = useState(() => (value == null ? '' : formatBRL(value)));

  useEffect(() => {
    // Sincroniza quando o valor muda por fora (ex.: reset do formulário).
    setText((current) => (parseBRL(current) === value ? current : value == null ? '' : formatBRL(value)));
  }, [value]);

  return (
    <Input
      {...props}
      inputMode={allowNegative ? 'text' : 'decimal'}
      autoComplete="off"
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        const cents = parseBRL(e.target.value);
        onChange(cents === null ? null : allowNegative ? cents : Math.abs(cents));
      }}
      onBlur={(e) => {
        if (value != null) setText(formatBRL(value));
        onBlur?.(e);
      }}
      className="tabular"
    />
  );
}
