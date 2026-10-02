import { readFileSync, writeFileSync } from 'node:fs';

async function main() {
  const { opportunities } = JSON.parse(readFileSync('docs/audits/catalog-snapshot.json', 'utf8')) as { opportunities: Array<{ id: string; title: string; sourceUrl: string; verificationStatus: string; deadline: string | null }> };
  const pending = opportunities.filter(row => row.verificationStatus !== 'verified');
  const results: unknown[] = [];
  let next = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    for (;;) {
      const row = pending[next++];
      if (!row) return;
      let source: Record<string, unknown>;
      try {
        const response = await fetch(row.sourceUrl, { signal: AbortSignal.timeout(12000), headers: { 'user-agent': 'OppScout source quality review' } });
        const content = (await response.text()).slice(0, 1_000_000);
        const text = content.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
        source = { httpStatus: response.status, resolvedUrl: response.url, pageTitle: content.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim(), titleMentioned: text.toLowerCase().includes(row.title.toLowerCase()), reviewOutcome: 'Reachability only; official listing identity, dates and eligibility still require review.' };
      } catch { source = { httpStatus: null, reviewOutcome: 'Source could not be retrieved within 12 seconds; keep unverified.' }; }
      results.push({ ...row, ...source, checkedAt: new Date().toISOString() });
    }
  }));
  writeFileSync('docs/audits/pending-source-checks.json', JSON.stringify(results, null, 2));
  console.log(JSON.stringify({ checked: results.length, note: 'No reachability result automatically approves a listing.' }));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
