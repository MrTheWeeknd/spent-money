import type { ReactNode } from 'react';
import { Label } from './label';

/** Rótulo + controle + mensagem de erro com ids ligados para leitores de tela. */
export function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="px-1">
        {label}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="px-1 text-sm text-danger">
          {error}
        </p>
      ) : (
        hint && <p className="px-1 text-sm text-muted">{hint}</p>
      )}
    </div>
  );
}

