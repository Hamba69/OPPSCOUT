import { describe, expect, it, vi } from 'vitest';
import { getDemoCatalog } from '@/data/demo-catalog';

const state = vi.hoisted(() => ({ opportunities: [] as Record<string, unknown>[], organizations: [] as Record<string, unknown>[] }));
vi.mock('@/lib/supabase/admin', () => ({ createServiceRoleClient: () => ({ from: (table: string) => {
  let cursor = '';
  let limit = 1000;
  const filters: Array<(row: Record<string, unknown>) => boolean> = [];
  const query = {
    select: () => query,
    order: () => query,
    limit: (value: number) => { limit = value; return query; },
    gt: (_key: string, value: string) => { cursor = value; return query; },
    eq: (key: string, value: string) => { filters.push(row => row[key] === value); return query; },
    in: (key: string, values: string[]) => { filters.push(row => values.includes(String(row[key]))); return query; },
    then: (resolve: (result: { data: Record<string, unknown>[]; error: null }) => unknown) => Promise.resolve(resolve({ data: (table === 'Opportunity' ? state.opportunities : state.organizations).filter(row => String(row.id) > cursor && filters.every(filter => filter(row))).slice(0, limit), error: null })),
  };
  return query;
} }) }));

import { SupabaseRepository } from '@/lib/repository/supabase';

describe('shared catalog pagination', () => {
  it('returns listings beyond the Data API default 1000-row cap with organization labels', async () => {
    const catalog = getDemoCatalog();
    const base = catalog.opportunities[0];
    state.opportunities = Array.from({ length: 1205 }, (_, i) => ({ ...base, id: `99999999-9999-4999-8999-${String(i).padStart(12, '0')}`, deadline: null, verificationStatus: 'verified' }));
    state.organizations = catalog.organizations.map(org => ({ ...org }));
    const result = await new SupabaseRepository().listOpportunities({ verificationStatus: 'verified' });
    expect(result).toHaveLength(1205);
    expect(new Set(result.map(row => row.id)).size).toBe(1205);
    expect(result[1204].organization?.name).toBeTruthy();
  });
});
