import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { invalidateFinance } from './transactions';
import type {
  AppSettings,
  CardInvoices,
  CycleReport,
  CategoryReport,
  Dashboard,
  InvoiceDetail,
  InvoicePaymentInput,
  MonthlyRow,
  PersonBalance,
  Settlement,
  SettlementInput,
  Statement,
  TransactionType,
} from './types';

export function useDashboard(month: string) {
  return useQuery({
    queryKey: ['reports', 'dashboard', month],
    queryFn: () => api<Dashboard>(`/reports/dashboard?month=${month}`),
    placeholderData: (prev) => prev,
  });
}

export function useMonthly(months: number) {
  return useQuery({
    queryKey: ['reports', 'monthly', months],
    queryFn: () => api<MonthlyRow[]>(`/reports/monthly?months=${months}`),
  });
}

export function useCategoryReport(from: string, to: string, type: TransactionType) {
  return useQuery({
    queryKey: ['reports', 'categories', from, to, type],
    queryFn: () => api<CategoryReport>(`/reports/categories?from=${from}&to=${to}&type=${type}`),
    placeholderData: (prev) => prev,
  });
}

export function useInvoices() {
  return useQuery({ queryKey: ['invoices'], queryFn: () => api<CardInvoices[]>('/invoices') });
}

export function useInvoice(cardId: string, month: string | undefined) {
  return useQuery({
    queryKey: ['invoices', cardId, month],
    queryFn: () => api<InvoiceDetail>(`/invoices/${cardId}/${month}`),
    enabled: !!month,
    placeholderData: (prev) => (prev?.cardId === cardId ? prev : undefined),
  });
}

export function usePayInvoice(cardId: string, month: string) {
  const qc = useQueryClient();
  const key = ['invoices', cardId, month];
  return useMutation({
    mutationFn: (input: InvoicePaymentInput) =>
      api<InvoiceDetail>(`/invoices/${cardId}/${month}/payments`, { method: 'POST', json: input }),
    // Otimista: o "pago" e o "restante" mudam na hora.
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<InvoiceDetail>(key);
      if (prev) {
        const paid = prev.paid + input.amount;
        qc.setQueryData<InvoiceDetail>(key, {
          ...prev,
          paid,
          remaining: Math.max(0, prev.total - paid),
          status: prev.total > 0 && paid >= prev.total ? 'paid' : prev.status,
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(key, ctx.prev),
    onSuccess: (data) => qc.setQueryData(key, data),
    onSettled: () => invalidateFinance(qc),
  });
}

/** Ajusta as datas reais da fatura (null volta ao dia do cartão). */
export function useSetInvoiceDates(cardId: string, month: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { closingDate?: string | null; dueDate?: string | null }) =>
      api<InvoiceDetail>(`/invoices/${cardId}/${month}/dates`, { method: 'PUT', json: input }),
    onSuccess: (data) => qc.setQueryData(['invoices', cardId, month], data),
    onSettled: () => invalidateFinance(qc),
  });
}

export function useDeleteInvoicePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/invoices/payments/${id}`, { method: 'DELETE' }),
    onSettled: () => invalidateFinance(qc),
  });
}

export function useBalances() {
  return useQuery({ queryKey: ['balances'], queryFn: () => api<PersonBalance[]>('/balances') });
}

export function useStatement(personId: string) {
  return useQuery({
    queryKey: ['balances', personId, 'statement'],
    queryFn: () => api<Statement>(`/balances/${personId}/statement`),
  });
}

export function useCreateSettlement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SettlementInput) => api<Settlement>('/settlements', { method: 'POST', json: input }),
    // Otimista: o saldo da pessoa cai na hora.
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ['balances'] });
      const prev = qc.getQueryData<PersonBalance[]>(['balances']);
      qc.setQueryData<PersonBalance[]>(['balances'], (old) =>
        old?.map((b) =>
          b.personId === input.personId
            ? { ...b, settled: b.settled + input.amount, balance: b.balance - input.amount }
            : b,
        ),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(['balances'], ctx.prev),
    onSettled: () => invalidateFinance(qc),
  });
}

export function useDeleteSettlement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/settlements/${id}`, { method: 'DELETE' }),
    onSettled: () => invalidateFinance(qc),
  });
}

export function useSettings() {
  return useQuery({ queryKey: ['settings'], queryFn: () => api<AppSettings>('/settings'), staleTime: Infinity });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<AppSettings>) => api<AppSettings>('/settings', { method: 'PATCH', json: input }),
    onSuccess: (data) => qc.setQueryData(['settings'], data),
    onSettled: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  });
}

/** Balanço do "meu mês". Sem `month`, o ciclo de hoje. */
export function useCycle(month?: string) {
  return useQuery({
    queryKey: ['reports', 'cycle', month ?? 'current'],
    queryFn: () => api<CycleReport>(`/reports/cycle${month ? `?month=${month}` : ''}`),
    placeholderData: (prev) => prev,
  });
}
