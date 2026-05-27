import { apiFetch } from '@/lib/api/client';
import { Category } from '@/types/api';
import { adaptCategory } from './adapters';

export const categoriesService = {
  async list(): Promise<Category[]> {
    const raw = await apiFetch<any[]>('/categories', { method: 'GET' });
    return (raw ?? []).map(adaptCategory);
  },
};
