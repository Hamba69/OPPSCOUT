import { describe, expect, it, vi } from 'vitest';
import { DEMO_ORG_ID, DEMO_USER_ID, MemoryRepository } from '@/lib/repository/memory';
import { ingestManualOpportunity } from '@/services/ingestion/manual';
import { AnthropicOpportunityExtractor } from '@/services/ai/anthropic-extractor';
import { buildRankedFeed } from '@/services/matching/feed';
import { checklistIsComplete } from '@/services/trust/checklist';
import type { TrustChecklist } from '@/core/entities/domain';

describe('catalog trust and eligibility safety', () => {
  it('does not accept an empty or partial trust checklist', () => {
    expect(checklistIsComplete({} as TrustChecklist)).toBe(false);
    expect(checklistIsComplete({ sourceAuthentic: true } as TrustChecklist)).toBe(false);
  });
  it('requires re-review when an approved listing is replaced by a duplicate submission', async () => {
    const repository = new MemoryRepository();
    const current = (await repository.listOpportunities({ organizationId: DEMO_ORG_ID, verificationStatus: 'verified' }))[0];
    expect(current).toBeTruthy();
    const updated = await ingestManualOpportunity(repository, { ...current, description: 'Changed eligibility and application instructions requiring a fresh review.' });
    expect(updated.id).toBe(current.id);
    expect(updated.verificationStatus).toBe('pending');
    expect(updated.checkedAt).toEqual(current.checkedAt);
    expect((await buildRankedFeed(repository, DEMO_USER_ID)).some(m => m.opportunityId === current.id)).toBe(false);
  });

  it('preserves age, programme rules and unsupported profile requirements during AI extraction', async () => {
    const eligibility = { minimumAge: 20, maximumAge: 32, programmeRules: [{ field: 'language', allowedValues: ['French'], label: 'Working language' }], additionalRequirements: ['Must have work authorization in the host country.'] };
    const fetcher = vi.fn(async () => Response.json({ content: [{ type: 'tool_use', name: 'record_opportunity', input: { title: 'Research internship', category: 'internship', description: 'A research internship with explicit eligibility requirements.', eligibility, requiredSkills: [], preferredSkills: [], location: 'Kampala', workMode: 'onsite', deadline: null, applicationMethod: 'Apply through the official portal.' } }] }));
    const result = await new AnthropicOpportunityExtractor('test-only-key', fetcher).extract('https://official.example/opportunity', 'Source content');
    expect(result.eligibility).toEqual(eligibility);
  });

  it('keeps requirements absent from the profile visible in match explanations', async () => {
    const repository = new MemoryRepository();
    const current = (await repository.listOpportunities({ verificationStatus: 'verified' }))[0];
    await repository.updateOpportunity(current.id, { eligibility: { additionalRequirements: ['Confirm citizenship with the provider.'] } });
    const match = (await buildRankedFeed(repository, DEMO_USER_ID)).find(m => m.opportunityId === current.id);
    expect(match?.missingFactors).toContainEqual({ label: 'Confirm eligibility with provider', detail: 'Confirm citizenship with the provider.' });
  });
});
