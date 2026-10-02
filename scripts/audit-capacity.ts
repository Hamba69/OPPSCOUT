import { loadEnvConfig } from '@next/env';
import { randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import type { UserProfile } from '../src/core/entities/domain';
import { buildRankedFeed } from '../src/services/matching/feed';
import { OrbitMatchEngine } from '../src/services/matching/orbit/engine';

loadEnvConfig(process.cwd());
async function main() {
  const { SupabaseRepository } = await import('../src/lib/repository/supabase');
  const fields = ['computer science', 'agriculture', 'education', 'nursing', 'business', 'law', 'engineering', 'media', 'environment', 'social work'];
  const levels = ['secondary', 'certificate', 'diploma', 'bachelors', 'masters'];
  const profiles = Array.from({ length: 100 }, (_, i): UserProfile => ({
    id: randomUUID(), name: `Synthetic cohort ${i + 1}`, email: null, phone: null,
    preferredChannel: 'web', secondaryChannels: [], notificationsEnabled: false, notificationFrequency: 'weekly',
    educationLevel: levels[Math.floor(i / 10) % levels.length], institution: null, fieldOfStudy: fields[i % fields.length],
    graduationStatus: i % 2 ? 'graduated' : 'final year', dateOfBirth: new Date(`${1980 + i % 30}-01-01T00:00:00Z`),
    skills: i % 3 === 0 ? ['research', 'communication'] : i % 3 === 1 ? ['agriculture', 'project management'] : [],
    workExperience: [], internshipExperience: [], certifications: [], location: ['Kampala', 'Gulu', 'Mbale', 'Nairobi', 'Kigali'][i % 5], preferredLocations: [],
    careerInterests: [fields[i % fields.length]], opportunityCategories: [i % 2 ? 'job' : 'scholarship'],
    workModePreference: i % 2 ? 'remote' : 'onsite', languages: ['English'], profileCompletenessScore: 60,
    createdAt: new Date(), updatedAt: new Date(),
  }));
  class CohortRepository extends SupabaseRepository {
    override async getProfile(id: string) { return profiles.find(p => p.id === id) ?? null; }
  }
  const repository = new CohortRepository();
  const engine = new OrbitMatchEngine();
  const start = performance.now();
  const results = await Promise.all(profiles.map(async profile => {
    const began = performance.now();
    try {
      const matches = await buildRankedFeed(repository, profile.id, new Date(), engine, { persist: false });
      if (matches.some(m => m.userId !== profile.id)) throw new Error('Identity isolation failed');
      return { education: profile.educationLevel, field: profile.fieldOfStudy, eligibleListings: matches.length, preferredCategoryMatches: matches.filter(m => profile.opportunityCategories.includes(m.opportunity!.category)).length, strongMatches: matches.filter(m => m.score >= 60).length, durationMs: Math.round(performance.now() - began), ok: true };
    } catch (error) { return { ok: false, durationMs: Math.round(performance.now() - began), error: error instanceof Error ? error.message : 'Unknown failure' }; }
  }));
  const durations = results.map(r => r.durationMs).sort((a, b) => a - b);
  const report = { capturedAt: new Date().toISOString(), scope: '100 concurrent service feed builds with synthetic profiles and the live shared catalog. No synthetic users/profile rows written. Excludes HTTP, authentication, Redis, browser and production hosting.', elapsedMs: Math.round(performance.now() - start), success: results.filter(r => r.ok).length, p50Ms: durations[49], p95Ms: durations[94], p99Ms: durations[98], zeroPreferredCategory: results.filter(r => r.ok && r.preferredCategoryMatches === 0).length, zeroStrongMatches: results.filter(r => r.ok && r.strongMatches === 0).length, results };
  writeFileSync('docs/audits/capacity-100.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, results: undefined }, null, 2));
  if (report.success !== 100) process.exitCode = 1;
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
