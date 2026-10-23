import { useMemo } from 'react';
import { accountsApi, cardsApi, categoriesApi, peopleApi } from '@/api/catalog';
import type { Account, Card, Category, Person } from '@/api/types';

const byId = <T extends { id: string }>(list: T[] | undefined) => new Map((list ?? []).map((x) => [x.id, x]));

/** Cadastros indexados por id, para resolver nomes/cores em listas. */
export function useCatalog() {
  const cards = cardsApi.useList();
  const people = peopleApi.useList();
  const categories = categoriesApi.useList();
  const accounts = accountsApi.useList();
  return useMemo(
    () => ({
      ready: !!(cards.data && people.data && categories.data && accounts.data),
      cards: cards.data ?? ([] as Card[]),
      people: people.data ?? ([] as Person[]),
      categories: categories.data ?? ([] as Category[]),
      accounts: accounts.data ?? ([] as Account[]),
      card: byId(cards.data),
      person: byId(people.data),
      category: byId(categories.data),
      account: byId(accounts.data),
      self: people.data?.find((p) => p.isSelf),
    }),
    [cards.data, people.data, categories.data, accounts.data],
  );
}
