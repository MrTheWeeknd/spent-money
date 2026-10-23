import { createResource } from './resource';
import type {
  Account,
  AccountInput,
  Card,
  CardInput,
  Category,
  CategoryInput,
  Person,
  PersonInput,
} from './types';

export const cardsApi = createResource<Card, CardInput>('/cards');
export const peopleApi = createResource<Person, PersonInput>('/people');
export const categoriesApi = createResource<Category, CategoryInput>('/categories');
export const accountsApi = createResource<Account, AccountInput>('/accounts');
