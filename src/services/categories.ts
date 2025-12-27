// src/services/categories.ts
import api from './api';

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  is_active: boolean;
  sort_order?: number | null;
  created_at?: string;
  updated_at?: string;
};

export const ALL_CATEGORY_ID = 'all';

export function getAllCategory(): Category {
  return {
    id: ALL_CATEGORY_ID,
    name: 'All',
    slug: 'all',
    description: null,
    icon: null,
    is_active: true,
    sort_order: -999,
  };
}

export async function getCategoriesWithAll(): Promise<Category[]> {
  const res = await api.get<Category[]>('/categories');
  const list = Array.isArray(res.data) ? res.data : [];

  const active = list
    .filter((c) => c.is_active !== false)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  return [getAllCategory(), ...active];
}

export function isAllCategory(categoryId?: string | null) {
  return !categoryId || categoryId === ALL_CATEGORY_ID;
}

// Home quick pills (All + top 6 + More)
export type HomeCategoryPill =
  | { kind: 'all'; id: typeof ALL_CATEGORY_ID; name: 'All'; icon?: null }
  | { kind: 'category'; id: string; name: string; icon?: string | null }
  | { kind: 'more'; id: 'more'; name: 'More'; icon?: null };

export async function getHomeCategoryPills(topN = 6): Promise<HomeCategoryPill[]> {
  const res = await api.get<Category[]>('/categories');
  const list = Array.isArray(res.data) ? res.data : [];

  const active = list
    .filter((c) => c.is_active !== false)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .slice(0, topN);

  return [
    { kind: 'all', id: ALL_CATEGORY_ID, name: 'All', icon: null } as const,
    ...active.map(
      (c) =>
        ({
          kind: 'category',
          id: c.id,
          name: c.name,
          icon: c.icon ?? null,
        } as const)
    ),
    { kind: 'more', id: 'more', name: 'More', icon: null } as const,
  ];
}