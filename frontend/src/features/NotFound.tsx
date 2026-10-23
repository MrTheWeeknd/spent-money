import { Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';

export function NotFound() {
  return (
    <div className="pt-16">
      <EmptyState
        icon={Compass}
        title="Página não encontrada"
        action={
          <Button asChild>
            <Link to="/">Ir para o início</Link>
          </Button>
        }
      />
    </div>
  );
}
