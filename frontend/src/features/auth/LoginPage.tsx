import { Lock } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useLogin, useSession } from '@/api/auth';
import { BrandLockup } from '@/components/brand/BrandLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Formulário de um campo só: validação simples, sem RHF/Zod, para manter o bundle inicial pequeno.
export function LoginPage() {
  const session = useSession();
  const login = useLogin();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (session.data) return <Navigate to="/" replace />;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!password) return setError('Informe a senha');
    setError(null);
    login.mutate(password, { onError: (err) => setError(err.message) });
  };

  return (
    <div className="flex min-h-dvh flex-col justify-end px-safe pt-safe pb-safe">
      <div className="mb-auto flex flex-1 flex-col items-center justify-center gap-4">
        <h1>
          <BrandLockup size="lg" />
        </h1>
        <p className="max-w-64 text-center text-muted">A pergunta que todo mundo faz no fim do mês.</p>
      </div>
      <form onSubmit={onSubmit} className="mb-6 space-y-3" noValidate>
        <input type="text" name="username" autoComplete="username" value="financas" readOnly hidden />
        <Label htmlFor="password" className="flex items-center gap-1.5">
          <Lock className="size-4" aria-hidden /> Senha
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? 'password-error' : undefined}
        />
        {error && (
          <p id="password-error" role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" disabled={login.isPending}>
          {login.isPending ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </div>
  );
}
