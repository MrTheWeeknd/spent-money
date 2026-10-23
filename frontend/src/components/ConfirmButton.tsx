import { useEffect, useState } from 'react';
import { Button } from './ui/button';

/** Botão destrutivo de dois toques: o primeiro pede confirmação, o segundo executa. */
export function ConfirmButton({
  label,
  confirmLabel = 'Toque para confirmar',
  onConfirm,
  disabled,
}: {
  label: string;
  confirmLabel?: string;
  onConfirm: () => void;
  disabled?: boolean;
}) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);

  return (
    <Button
      type="button"
      variant={armed ? 'danger' : 'secondary'}
      size="lg"
      disabled={disabled}
      className={armed ? undefined : 'text-danger'}
      aria-live="polite"
      onClick={() => (armed ? onConfirm() : setArmed(true))}
    >
      {armed ? confirmLabel : label}
    </Button>
  );
}
