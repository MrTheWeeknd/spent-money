import type { AccountType, CardBrand, CategoryType } from '@/api/types';

export const BRAND_LABELS: Record<CardBrand, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  elo: 'Elo',
  amex: 'Amex',
  hipercard: 'Hipercard',
  other: 'Outra',
};

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  checking: 'Conta corrente',
  wallet: 'Carteira',
  savings: 'Poupança',
};

export const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  expense: 'Despesa',
  income: 'Receita',
};

export const METHOD_LABELS: Record<import('@/api/types').PaymentMethod, string> = {
  credit_card: 'Crédito',
  debit: 'Débito',
  pix: 'Pix',
  cash: 'Dinheiro',
};

export const INVOICE_STATUS_LABELS: Record<import('@/api/types').InvoiceStatus, string> = {
  open: 'Aberta',
  closed: 'Fechada',
  past: 'Vencida',
  paid: 'Paga',
};
