import { loadEnvConfig } from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { chromium } from '@playwright/test';
import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';

loadEnvConfig(process.cwd());
async function main() {
  const base = 'http://localhost:3015';
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  const fixtures: Array<{ id: string; client: ReturnType<typeof createClient>; token: string }> = [];
  const browser = await chromium.launch({ headless: true });
  const errors: string[] = [];
  const checks: unknown[] = [];
  mkdirSync('test-results/launch-audit', { recursive: true });
  const api = async (index: number, path: string, method = 'GET', body?: unknown) => {
    const response = await fetch(`${base}/api/v1/${path}`, { method, headers: { authorization: `Bearer ${fixtures[index].token}`, 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
    const json = await response.json();
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status} ${json.error?.code}`);
    return json.data;
  };
  try {
    for (let index = 0; index < 2; index++) {
      const email = `oppscout-audit-${randomBytes(8).toString('hex')}@example.invalid`;
      const password = randomBytes(24).toString('base64url');
      const created = await admin.auth.admin.createUser({ email, password, email_confirm: true, app_metadata: { role: 'user' } });
      if (created.error || !created.data.user) throw new Error('Could not create temporary audit identity');
      const client = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false } });
      fixtures.push({ id: created.data.user.id, client, token: '' });
      const signedIn = await client.auth.signInWithPassword({ email, password });
      if (signedIn.error || !signedIn.data.session) throw new Error('Temporary audit identity sign-in failed');
      fixtures[index].token = signedIn.data.session.access_token;
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${base}/login`);
      await page.getByLabel('Email', { exact: true }).fill(email);
      await page.getByLabel('Password', { exact: true }).fill(password);
      await page.locator('form').getByRole('button', { name: 'Sign in', exact: true }).click();
      await page.waitForURL('**/profile', { timeout: 30000 });
      await page.getByLabel('Your name', { exact: true }).fill(`Audit Seeker ${index + 1}`);
      console.log(`Seeker ${index + 1} profile form: ${await page.locator('select').count()} selects; headings: ${await page.locator('h1,h2').allTextContents()}`);
      await page.screenshot({ path: `test-results/launch-audit/profile-${index + 1}.png`, fullPage: true });
      await page.locator('select[name="educationLevel"]').selectOption(index === 0 ? 'bachelors' : 'diploma');
      await page.locator('select[name="fieldOfStudy"]').selectOption(index === 0 ? 'computer science' : 'agriculture');
      await page.locator('select[name="graduationStatus"]').selectOption(index === 0 ? 'final year' : 'graduated');
      await page.locator('select[name="location"]').selectOption(index === 0 ? 'Kampala' : 'Mbale');
      await page.getByLabel('Date of birth', { exact: true }).fill(index === 0 ? '2002-05-14' : '1985-01-01');
      await page.locator('label').filter({ has: page.locator('input[name="languages"][value="English"]') }).click();
      await page.getByRole('button', { name: 'Add work experience', exact: true }).click();
      await page.getByLabel('Work role 1', { exact: true }).fill(index === 0 ? 'Research assistant' : 'Farm assistant');
      await page.getByLabel('Work months 1', { exact: true }).fill(index === 0 ? '6' : '24');
      await page.getByRole('button', { name: 'Save my profile' }).click();
      await page.getByRole('status').filter({ hasText: 'Profile saved' }).waitFor();
      const profile = await api(index, 'profile');
      if (profile.id !== fixtures[index].id || profile.location !== (index === 0 ? 'Kampala' : 'Mbale')) throw new Error('Profile identity/value mismatch');
      if (profile.workExperience[0]?.months !== (index === 0 ? 6 : 24)) throw new Error('Experience was not saved');
      await page.goto(`${base}/feed`);
      await page.locator('article').first().waitFor();
      for (const width of [390, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.waitForTimeout(500);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
        if (overflow) throw new Error(`Feed overflow at ${width}`);
        await page.screenshot({ path: `test-results/launch-audit/seeker-${index + 1}-${width}.png`, fullPage: true });
        checks.push({ seeker: index + 1, width, cards: await page.locator('article').count(), overflow });
      }
      await page.getByRole('link', { name: 'View match', exact: true }).first().click();
      await page.getByRole('heading', { name: 'Your match', exact: true }).waitFor();
      await context.close();
    }
    const first = await api(0, 'matches');
    const second = await api(1, 'matches');
    if (first.some((m: { userId: string }) => m.userId !== fixtures[0].id) || second.some((m: { userId: string }) => m.userId !== fixtures[1].id)) throw new Error('Cross-user match data');
    const saved = await api(0, 'saved', 'POST', { opportunityId: first[0].opportunityId });
    if (saved.userId !== fixtures[0].id || (await api(1, 'saved')).length !== 0) throw new Error('Saved items crossed user boundary');
    for (const table of ['UserProfile', 'MatchResult', 'SavedOpportunity']) {
      const direct = await fixtures[1].client.from(table).select('id').limit(1);
      if (direct.data?.length) throw new Error(`Direct authenticated Data API exposes ${table}`);
      if (direct.error && direct.error.code !== '42501') throw new Error(`Could not verify direct data denial: ${table}/${direct.error.code}`);
    }
    const started = performance.now();
    const samples = await Promise.all(Array.from({ length: 100 }, async (_, index) => {
      const began = performance.now();
      try { await api(index % 2, 'matches'); return { ok: true, ms: Math.round(performance.now() - began) }; }
      catch (error) { return { ok: false, ms: Math.round(performance.now() - began), error: error instanceof Error ? error.message : 'Unknown' }; }
    }));
    const times = samples.map(s => s.ms).sort((a, b) => a - b);
    const result = { capturedAt: new Date().toISOString(), scope: 'Local production Next server, live Supabase Auth/Postgres and configured Redis; two temporary identities; 100 simultaneous HTTP match reads, not 100 distinct signed-in users or production-host load.', browserChecks: checks, pageErrors: errors, distinctMatchCounts: [first.length, second.length], savedIsolation: true, directPrivateDataDenied: true, http: { passed: samples.filter(s => s.ok).length, p95Ms: times[94], elapsedMs: Math.round(performance.now() - started), failures: samples.filter(s => !s.ok) } };
    writeFileSync('docs/audits/live-user-verification.json', JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
    if (errors.length || result.http.passed !== 100) process.exitCode = 1;
  } finally {
    await browser.close();
    for (const fixture of fixtures) {
      await fixture.client.auth.signOut();
      const removedProfile = await admin.from('UserProfile').delete().eq('id', fixture.id);
      const removedAuth = await admin.auth.admin.deleteUser(fixture.id);
      if (removedProfile.error || removedAuth.error) throw new Error(`Temporary fixture cleanup failed for ${fixture.id}`);
    }
    console.log(`Removed ${fixtures.length} temporary audit accounts and their profiles.`);
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
