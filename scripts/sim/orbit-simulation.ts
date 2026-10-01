// Offline simulation: which matching algorithm best recovers "true" relevance when surface text is messy?
// Ground truth is a hidden latent model (concept sets + hidden weights + noise). Matchers only ever see strings.
// Usage: npx tsx scripts/sim/orbit-simulation.ts
import type { Opportunity, UserProfile } from "../../src/core/entities/domain";
import type { MatchEngine } from "../../src/core/interfaces/match-engine";
import { getDemoCatalog } from "../../src/data/demo-catalog";
import { getSeedOpportunities } from "../../src/data/seed-catalog";
import { RuleBasedMatchEngine } from "../../src/services/matching/rule-based/engine";
import { evaluateHardGates } from "../../src/services/matching/rule-based/hard-gates";
import { OrbitMatchEngine } from "../../src/services/matching/orbit/engine";
import { FIELD_CONCEPTS, SKILL_CONCEPTS, SKILL_RELATIONS, FIELD_RELATIONS } from "../../src/services/matching/orbit/ontology";
import { canonicalTokens, dice, trigrams, SKILL_INDEX, FIELD_INDEX } from "../../src/services/matching/orbit/canonical";

// ---------- deterministic RNG ----------
function rng(seed: number) { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const pick = <T,>(r: () => number, a: T[]): T => a[Math.floor(r() * a.length)]!;
const sample = <T,>(r: () => number, a: T[], n: number): T[] => { const c = [...a]; const out: T[] = []; while (out.length < n && c.length) out.push(c.splice(Math.floor(r() * c.length), 1)[0]!); return out; };

// ---------- surface noise ----------
// The matcher only knows the first `known` fraction of aliases; the rest are "unseen vocabulary" in the wild.
function typo(r: () => number, s: string): string { if (s.length < 5 || r() > 0.5) return s; const i = 1 + Math.floor(r() * (s.length - 2)); return r() < 0.5 ? s.slice(0, i) + s.slice(i + 1) : s.slice(0, i) + s[i + 1 - 1] + s.slice(i); }
const decor = (r: () => number, s: string) => { const x = r(); return x < 0.12 ? `${s} skills` : x < 0.2 ? s.toUpperCase() : x < 0.26 ? `basic ${s}` : s; };

interface Latent { skills: string[]; field: string; loc: string; interests: string[]; mode: "remote" | "onsite" | "hybrid" | null; months: number; }
interface OppLatent { req: string[]; pref: string[]; fields: string[]; loc: string; mode: "remote" | "onsite" | "hybrid"; months: number; category: string; topic: string[]; }
const SKILLS = SKILL_CONCEPTS.map((c) => c.id), FIELDS = FIELD_CONCEPTS.map((c) => c.id);
const PLACES = ["kampala", "wakiso", "mukono", "jinja", "mbale", "gulu", "mbarara", "entebbe", "lira", "soroti"];
const CATS = ["job", "internship", "scholarship", "fellowship"];
const TOPICS: Record<string, string[]> = { technology: ["javascript", "python", "software development", "it support"], data: ["data analysis", "sql", "excel", "data management"], "social impact": ["community engagement", "programme coordination"], finance: ["bookkeeping", "financial modelling"], agriculture: ["agronomy"], research: ["research", "report writing"], media: ["social media", "communication"] };

function relatedness(a: string, b: string, rel: Array<[string, string, number]>): number { if (a === b) return 1; for (const [x, y, w] of rel) if ((x === a && y === b) || (x === b && y === a)) return w; return 0; }
// TRUE similarity uses a slightly different graph than the engine's (edges jittered, a few extra edges) so the engine is not graded on its own table.
function trueRel(seedJ: number, a: string, b: string, rel: Array<[string, string, number]>): number { const base = relatedness(a, b, rel); const h = Math.abs(Math.sin((a.length * 131 + b.length * 17 + seedJ) * 12.9898)) % 1; if (base === 0) return h > 0.93 ? 0.3 : 0; return Math.max(0, Math.min(1, base + (h - 0.5) * 0.3)); }

function render(r: () => number, concept: string, concepts: typeof SKILL_CONCEPTS, known: number, noise: number): string {
  const c = concepts.find((x) => x.id === concept)!; const all = [c.id, ...c.aliases];
  // Aliases beyond the first `known` fraction are unseen by the engine's table. Some users write free text not in any table.
  const x = r();
  if (x < noise * 0.25) return typo(r, pick(r, all));
  void known; // the engine's table is truncated instead (see restrictVocabulary); users write from the full alias universe
  return decor(r, pick(r, all));
}

interface Cfg { known: number; noise: number; labelNoise: number; n: number; seed: number; truthGate: number; }

function tloc(a: string, b: string): number { if (a === b) return 1; const zone = [["kampala", "wakiso", "mukono", "entebbe"], ["jinja", "mbale", "soroti"], ["gulu", "lira"]]; if (zone[0]!.includes(a) && zone[0]!.includes(b)) return 0.9; if (zone.some((z) => z.includes(a) && z.includes(b))) return 0.4; return 0; }

function makeWorld(cfg: Cfg) {
  const r = rng(cfg.seed); const hw = { skills: 0.3 + r() * 0.15, field: 0.12 + r() * 0.1, loc: 0.1 + r() * 0.1, mode: 0.05 + r() * 0.05, exp: 0.08 + r() * 0.08, interest: 0.1 + r() * 0.12 };
  const sum = Object.values(hw).reduce((a, b) => a + b, 0); for (const k of Object.keys(hw) as Array<keyof typeof hw>) hw[k] /= sum;
  const now = new Date("2026-09-30T00:00:00Z");
  const profiles: Array<{ p: UserProfile; l: Latent }> = []; const opps: Array<{ o: Opportunity; l: OppLatent }> = [];
  for (let i = 0; i < 60; i++) {
    const topic = pick(r, Object.keys(TOPICS)); const base = TOPICS[topic]!;
    const skills = [...new Set([...sample(r, base, 1 + Math.floor(r() * 2)), ...sample(r, SKILLS, 2 + Math.floor(r() * 3))])];
    const l: Latent = { skills, field: pick(r, FIELDS), loc: pick(r, PLACES), interests: [topic, ...(r() < 0.5 ? [pick(r, Object.keys(TOPICS))] : [])], mode: r() < 0.2 ? null : pick(r, ["remote", "onsite", "hybrid"] as const), months: Math.floor(r() * 30) };
    const p: UserProfile = { id: `u${i}`, name: `U${i}`, phone: null, email: null, preferredChannel: "web", secondaryChannels: [], notificationsEnabled: false, notificationFrequency: "daily", educationLevel: "bachelors", institution: null, fieldOfStudy: render(r, l.field, FIELD_CONCEPTS, cfg.known, cfg.noise), graduationStatus: null, dateOfBirth: new Date("2001-01-01"), skills: l.skills.map((s) => render(r, s, SKILL_CONCEPTS, cfg.known, cfg.noise)), workExperience: l.months ? [{ title: "x", months: l.months }] : [], internshipExperience: [], certifications: [], location: l.loc[0]!.toUpperCase() + l.loc.slice(1), preferredLocations: r() < 0.4 ? [pick(r, PLACES)] : [], careerInterests: l.interests, opportunityCategories: r() < 0.5 ? [pick(r, CATS)] : [], workModePreference: l.mode, languages: ["english"], profileCompletenessScore: 80, createdAt: now, updatedAt: now };
    profiles.push({ p, l });
  }
  for (let i = 0; i < 80; i++) {
    const topicKey = pick(r, Object.keys(TOPICS)); const base = TOPICS[topicKey]!;
    const req = [...new Set([pick(r, base), ...sample(r, SKILLS, Math.floor(r() * 3))])]; const pref = sample(r, SKILLS.filter((s) => !req.includes(s)), Math.floor(r() * 3));
    const l: OppLatent = { req, pref, fields: r() < 0.15 ? [] : sample(r, FIELDS, 1 + Math.floor(r() * 2)), loc: r() < 0.1 ? "uganda" : pick(r, PLACES), mode: pick(r, ["remote", "onsite", "hybrid"] as const), months: r() < 0.6 ? 0 : 6 * (1 + Math.floor(r() * 4)), category: pick(r, CATS), topic: base };
    const desc = `${l.category} in ${topicKey}. ${req.join(" and ")} work with a community team.`;
    const o: Opportunity = { id: `o${i}`, title: `${topicKey} ${l.category} ${i}`, organizationId: "org", category: l.category, description: desc, eligibility: { educationLevels: ["bachelors"], fieldsOfStudy: l.fields.map((f) => render(r, f, FIELD_CONCEPTS, cfg.known, cfg.noise * 0.4)), minimumExperienceMonths: l.months }, requiredSkills: req.map((s) => render(r, s, SKILL_CONCEPTS, cfg.known, cfg.noise * 0.4)), preferredSkills: pref.map((s) => render(r, s, SKILL_CONCEPTS, cfg.known, cfg.noise * 0.4)), location: l.loc === "uganda" ? "Uganda" : l.loc[0]!.toUpperCase() + l.loc.slice(1), workMode: l.mode, deadline: new Date(now.getTime() + 20 * 86400000), applicationMethod: "x", sourceUrl: "x", verificationStatus: "verified", source: "org_submitted", publicationDate: now, checkedAt: now, status: "open", reviewChecklist: {}, reviewNotes: null, reviewerId: null, reviewedAt: null };
    opps.push({ o, l });
  }
  // Hidden truth: graded utility from latent concepts with the TRUE (jittered) relation graph, plus label noise.
  const truth = (l: Latent, ol: OppLatent): { u: number; relevant: boolean } => {
    const cov = (need: string[], w: number) => need.reduce((s, n) => s + w * Math.max(...l.skills.map((k) => trueRel(cfg.seed, n, k, SKILL_RELATIONS))), 0);
    const wReq = 2, wPref = 1; const tot = ol.req.length * wReq + ol.pref.length * wPref;
    const skill = tot ? (cov(ol.req, wReq) + cov(ol.pref, wPref)) / tot : 0.8;
    const field = ol.fields.length ? Math.max(...ol.fields.map((f) => trueRel(cfg.seed, l.field, f, FIELD_RELATIONS))) : 0.8;
    const loc = ol.mode === "remote" ? 1 : ol.loc === "uganda" ? 1 : tloc(l.loc, ol.loc);
    const mode = l.mode === null ? 0.5 : l.mode === ol.mode ? 1 : (l.mode === "hybrid" || ol.mode === "hybrid") ? 0.5 : 0;
    const exp = ol.months === 0 ? 1 : Math.min(l.months / ol.months, 1);
    const interest = l.interests.some((t) => t === ol.topic.find(() => true) || ol.topic.some((b) => TOPICS[t]?.includes(b))) ? 1 : 0;
    const u = hw.skills * skill + hw.field * field + hw.loc * loc + hw.mode * mode + hw.exp * exp + hw.interest * interest;
    // Competence gate (humans dislike "right city, wrong skills"): truth is itself anchored, which is the behaviour the anchor parameter tests.
    const gated = u * ((1 - cfg.truthGate) + cfg.truthGate * (0.7 * skill + 0.3 * field));
    return { u: gated, relevant: gated + (r() - 0.5) * cfg.labelNoise >= 0.58 };
  };
  const pairs: Array<{ p: UserProfile; o: Opportunity; u: number; relevant: boolean }> = [];
  for (const { p, l } of profiles) for (const { o, l: ol } of opps) { const t = truth(l, ol); pairs.push({ p, o, u: t.u, relevant: t.relevant }); }
  return pairs;
}

// ---------- competitor: plain TF-IDF cosine over profile text vs opportunity text (what "no-API semantic matching" usually means) ----------
class TfIdfEngine implements MatchEngine {
  private idf = new Map<string, number>();
  public constructor(docs: Opportunity[]) { const df = new Map<string, number>(); for (const d of docs) for (const t of new Set(this.tok(d))) df.set(t, (df.get(t) ?? 0) + 1); for (const [t, c] of df) this.idf.set(t, Math.log((1 + docs.length) / (1 + c)) + 1); }
  private tok(o: Opportunity) { return canonicalTokens(`${o.title} ${o.description} ${o.requiredSkills.join(" ")} ${o.preferredSkills.join(" ")} ${(o.eligibility.fieldsOfStudy ?? []).join(" ")}`); }
  public async score(p: UserProfile, o: Opportunity) {
    const v = (toks: string[]) => { const m = new Map<string, number>(); for (const t of toks) m.set(t, (m.get(t) ?? 0) + (this.idf.get(t) ?? 1)); return m; };
    const a = v(canonicalTokens(`${p.skills.join(" ")} ${p.fieldOfStudy ?? ""} ${p.careerInterests.join(" ")}`)), b = v(this.tok(o));
    let dot = 0, na = 0, nb = 0; for (const [t, x] of a) { na += x * x; dot += x * (b.get(t) ?? 0); } for (const x of b.values()) nb += x * x;
    const cos = na && nb ? dot / Math.sqrt(na * nb) : 0; return { score: Math.round(Math.min(1, cos * 2.2) * 100), matchedFactors: [], missingFactors: [], generatedBy: "rules" as const };
  }
}

// ---------- metrics ----------
function auc(s: Array<{ score: number; y: boolean }>): number { const pos = s.filter((x) => x.y), neg = s.filter((x) => !x.y); if (!pos.length || !neg.length) return NaN; let w = 0; for (const a of pos) for (const b of neg) w += a.score > b.score ? 1 : a.score === b.score ? 0.5 : 0; return w / (pos.length * neg.length); }
function ndcgAt(k: number, byUser: Map<string, Array<{ score: number; u: number }>>): number { let tot = 0, n = 0; for (const rows of byUser.values()) { const ranked = [...rows].sort((a, b) => b.score - a.score).slice(0, k); const ideal = [...rows].sort((a, b) => b.u - a.u).slice(0, k); const dcg = (xs: typeof rows) => xs.reduce((s, x, i) => s + (Math.pow(2, x.u * 4) - 1) / Math.log2(i + 2), 0); const d = dcg(ideal); if (d > 0) { tot += dcg(ranked) / d; n++; } } return tot / n; }

async function evaluate(name: string, engine: MatchEngine, pairs: ReturnType<typeof makeWorld>, threshold = 60) {
  const rows: Array<{ score: number; y: boolean; u: number; uid: string; eligible: boolean }> = [];
  const t0 = performance.now();
  for (const x of pairs) { const eligible = evaluateHardGates(x.p, x.o).eligible; const score = eligible ? (await engine.score(x.p, x.o)).score : 0; rows.push({ score, y: x.relevant, u: x.u, uid: x.p.id, eligible }); }
  const ms = (performance.now() - t0) / pairs.length;
  const tp = rows.filter((r) => r.eligible && r.score >= threshold && r.y).length, fp = rows.filter((r) => r.eligible && r.score >= threshold && !r.y).length, fn = rows.filter((r) => r.y && !(r.eligible && r.score >= threshold)).length;
  const prec = tp + fp ? tp / (tp + fp) : 0, rec = tp + fn ? tp / (tp + fn) : 0; const by = new Map<string, Array<{ score: number; u: number }>>(); for (const r of rows) { if (!by.has(r.uid)) by.set(r.uid, []); by.get(r.uid)!.push({ score: r.score, u: r.u }); }
  // Best achievable F1 over thresholds tells us ranking quality independent of calibration.
  let bestF1 = 0, bestT = 0; for (let t = 10; t <= 95; t += 5) { const a = rows.filter((r) => r.score >= t && r.y).length, b = rows.filter((r) => r.score >= t && !r.y).length, c = rows.filter((r) => r.y && r.score < t).length; const p = a + b ? a / (a + b) : 0, q = a + c ? a / (a + c) : 0; const f = p + q ? (2 * p * q) / (p + q) : 0; if (f > bestF1) { bestF1 = f; bestT = t; } }
  return { name, prec, rec, f1: prec + rec ? (2 * prec * rec) / (prec + rec) : 0, bestF1, bestT, auc: auc(rows.map((r) => ({ score: r.score, y: r.y }))), ndcg10: ndcgAt(10, by), us: ms * 1000 };
}

function restrictVocabulary(known: number) {
  const cut = (cs: typeof SKILL_CONCEPTS) => cs.map((c) => ({ id: c.id, aliases: c.aliases.slice(0, Math.max(0, Math.ceil(c.aliases.length * known))) }));
  SKILL_INDEX.load(cut(SKILL_CONCEPTS), SKILL_RELATIONS); FIELD_INDEX.load(cut(FIELD_CONCEPTS), FIELD_RELATIONS);
}

export async function main() {
  const { opportunities } = getDemoCatalog(); void opportunities; void getSeedOpportunities;
  const settings: Cfg[] = [];
  for (const truthGate of [0, 0.5]) for (const [i, known] of [1.0, 0.7, 0.5, 0.3].entries()) settings.push({ known, noise: 0.15 + i * 0.15, labelNoise: 0.1 + i * 0.05, n: 0, seed: 1 + i + truthGate * 10, truthGate });
  const agg = new Map<string, Array<Awaited<ReturnType<typeof evaluate>>>>();
  for (const cfg of settings) for (const seedOffset of (process.env.SWEEP ? [0] : [0, 100, 200])) {
    restrictVocabulary(cfg.known);
    const pairs = makeWorld({ ...cfg, seed: cfg.seed + seedOffset });
    const docs = pairs.map((x) => x.o).filter((o, i, a) => a.findIndex((z) => z.id === o.id) === i);
    const engines: Array<[string, MatchEngine]> = [
      ["V0 baseline (current rules)", new RuleBasedMatchEngine()],
      ["V1 orbit canonical only", new OrbitMatchEngine({ canonical: true, soft: false, anchor: 0, emptyPrior: 1 })],
      ["V2 orbit + soft", new OrbitMatchEngine({ canonical: true, soft: true, anchor: 0, emptyPrior: 1 })],
      ["V3 orbit + soft + anchor .5", new OrbitMatchEngine({ canonical: true, soft: true, anchor: 0.5, emptyPrior: 1 })],
      ["V4 V3 + emptyPrior .8 (DEFAULT)", new OrbitMatchEngine()],
      ["V5 V4 with anchor .75", new OrbitMatchEngine({ anchor: 0.75 })],
      ["V6 TF-IDF cosine (no ontology)", new TfIdfEngine(docs)],
    ];
    if (process.env.SWEEP) { engines.length = 0; engines.push(["V0 baseline", new RuleBasedMatchEngine()]); for (const a of [0, 0.1, 0.2, 0.3]) for (const ep of [0.8, 0.9, 1]) engines.push([`anchor ${a} prior ${ep}`, new OrbitMatchEngine({ anchor: a, emptyPrior: ep })]); }
    for (const [name, e] of engines) { const res = await evaluate(name, e, pairs); if (!agg.has(name)) agg.set(name, []); agg.get(name)!.push(res); }
  }
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  console.log(`\n${"engine".padEnd(36)} prec   rec    F1@60  bestF1(T)    AUC    NDCG@10  us/pair`);
  for (const [name, rs] of agg) console.log(`${name.padEnd(36)} ${mean(rs.map((r) => r.prec)).toFixed(3)}  ${mean(rs.map((r) => r.rec)).toFixed(3)}  ${mean(rs.map((r) => r.f1)).toFixed(3)}  ${mean(rs.map((r) => r.bestF1)).toFixed(3)}(${Math.round(mean(rs.map((r) => r.bestT)))})  ${mean(rs.map((r) => r.auc)).toFixed(3)}  ${mean(rs.map((r) => r.ndcg10)).toFixed(3)}    ${mean(rs.map((r) => r.us)).toFixed(0)}`);
  console.log("\nAUC by condition. Columns: truthGate 0 (known 1.0/.7/.5/.3) | truthGate .5 (known 1.0/.7/.5/.3). 3 seeds each.");
  for (const [name, rs] of agg) { const cols = Array.from({ length: 8 }, (_, k) => mean(rs.filter((_, i) => Math.floor(i / (process.env.SWEEP ? 1 : 3)) === k).map((r) => r.auc))); console.log(`${name.padEnd(36)} ${cols.slice(0, 4).map((c) => c.toFixed(3)).join(" ")} | ${cols.slice(4).map((c) => c.toFixed(3)).join(" ")}`); }
  console.log("\nNDCG@10 by condition");
  for (const [name, rs] of agg) { const cols = Array.from({ length: 8 }, (_, k) => mean(rs.filter((_, i) => Math.floor(i / (process.env.SWEEP ? 1 : 3)) === k).map((r) => r.ndcg10))); console.log(`${name.padEnd(36)} ${cols.slice(0, 4).map((c) => c.toFixed(3)).join(" ")} | ${cols.slice(4).map((c) => c.toFixed(3)).join(" ")}`); }
  void dice; void trigrams;
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
