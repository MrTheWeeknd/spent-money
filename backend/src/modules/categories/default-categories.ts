import { CategoryType } from './category.schema';

type Seed = { name: string; icon: string; color: string; type: CategoryType };

const expense = (name: string, icon: string, color: string): Seed => ({
  name,
  icon,
  color,
  type: 'expense',
});
const income = (name: string, icon: string, color: string): Seed => ({
  name,
  icon,
  color,
  type: 'income',
});

export const DEFAULT_CATEGORIES: Seed[] = [
  expense('Alimentação', 'utensils', '#ff9500'),
  expense('Mercado', 'shopping-cart', '#34c759'),
  expense('Transporte', 'car', '#007aff'),
  expense('Combustível', 'fuel', '#5856d6'),
  expense('Moradia', 'house', '#a2845e'),
  expense('Contas e serviços', 'receipt', '#ff3b30'),
  expense('Saúde', 'heart-pulse', '#ff2d55'),
  expense('Farmácia', 'pill', '#30b0c7'),
  expense('Educação', 'graduation-cap', '#5ac8fa'),
  expense('Lazer', 'party-popper', '#af52de'),
  expense('Assinaturas', 'repeat', '#ff6482'),
  expense('Compras', 'shopping-bag', '#ffcc00'),
  expense('Vestuário', 'shirt', '#bf5af2'),
  expense('Viagem', 'plane', '#00c7be'),
  expense('Pets', 'paw-print', '#ac8e68'),
  expense('Presentes', 'gift', '#ff375f'),
  expense('Cuidados pessoais', 'sparkles', '#e5a0ff'),
  expense('Impostos e taxas', 'landmark', '#8e8e93'),
  expense('Outros', 'circle-ellipsis', '#636366'),
  income('Salário', 'briefcase', '#34c759'),
  income('Freelance', 'laptop', '#30d158'),
  income('Investimentos', 'trending-up', '#00c7be'),
  income('Reembolso', 'undo-2', '#007aff'),
  income('Presentes', 'gift', '#ff375f'),
  income('Outros', 'circle-ellipsis', '#636366'),
];
