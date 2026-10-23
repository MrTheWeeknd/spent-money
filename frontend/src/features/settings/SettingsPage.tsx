import { CreditCard, Download, Landmark, LogOut, Tags, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { accountsApi, cardsApi, categoriesApi, peopleApi } from '@/api/catalog';
import { useLogout } from '@/api/auth';
import { API_BASE } from '@/api/client';
import { BackHeader } from '@/components/layout/BackHeader';
import { ListButton, ListGroup, ListLink } from '@/components/ui/list';
import { BrandPicker } from './BrandPicker';
import { CycleSetting } from './CycleSetting';

const EXPORTS = [
  { kind: 'lancamentos', label: 'Lançamentos' },
  { kind: 'parcelas', label: 'Parcelas das faturas' },
  { kind: 'acertos', label: 'Acertos com pessoas' },
];

function RowIcon({ icon: Icon, color }: { icon: LucideIcon; color: string }) {
  return (
    <span className="flex size-8 items-center justify-center rounded-lg text-white" style={{ backgroundColor: color }} aria-hidden>
      <Icon className="size-[18px]" />
    </span>
  );
}

export function SettingsPage() {
  const logout = useLogout();
  const cards = cardsApi.useList();
  const people = peopleApi.useList();
  const categories = categoriesApi.useList();
  const accounts = accountsApi.useList();

  return (
    <>
      <BackHeader to="/" back="Início" title="Ajustes" />
      <BrandPicker />
      <CycleSetting />
      <ListGroup header="Cadastros">
        <ListLink to="/configuracoes/cartoes" leading={<RowIcon icon={CreditCard} color="#5856d6" />} title="Cartões" trailing={cards.data?.length} />
        <ListLink to="/configuracoes/pessoas" leading={<RowIcon icon={Users} color="#ff2d55" />} title="Pessoas" trailing={people.data?.length} />
        <ListLink to="/configuracoes/categorias" leading={<RowIcon icon={Tags} color="#ff9500" />} title="Categorias" trailing={categories.data?.length} />
        <ListLink to="/configuracoes/contas" leading={<RowIcon icon={Landmark} color="#34c759" />} title="Contas" trailing={accounts.data?.length} />
      </ListGroup>
      <ListGroup header="Exportar dados (CSV)" footer="Arquivos com ; e vírgula decimal, prontos para Excel ou Numbers.">
        {EXPORTS.map((e) => (
          <li key={e.kind}>
            <a
              href={`${API_BASE}/api/export/${e.kind}.csv`}
              download
              className="flex min-h-12 w-full items-center gap-3 px-4 py-2.5 active:bg-surface-2"
            >
              <RowIcon icon={Download} color="#007aff" />
              <span className="flex-1">{e.label}</span>
            </a>
          </li>
        ))}
      </ListGroup>
      <ListGroup>
        <ListButton
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          leading={<RowIcon icon={LogOut} color="#ff3b30" />}
          title={<span className="text-danger">Sair</span>}
          chevron={false}
        />
      </ListGroup>
    </>
  );
}
