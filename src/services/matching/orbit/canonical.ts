import { observeUnmatched } from "@/services/matching/telemetry";
import { COMMUTE_ZONES, FIELD_CONCEPTS, FIELD_RELATIONS, LOCATION_PARENT, SKILL_CONCEPTS, SKILL_RELATIONS, type Concept } from "@/services/matching/orbit/ontology";

const STOP = new Set(["and", "of", "the", "in", "for", "with", "to", "a", "an", "on", "at", "or", "skill", "ability", "basic", "strong", "good", "knowledge", "experience"]);

export function stemToken(raw: string): string {
  let t = raw;
  t = t.replace(/isation$/, "ization").replace(/^programme/, "program").replace(/elling$/, "eling").replace(/ise$/, "ize").replace(/ising$/, "izing").replace(/yse$/, "yze").replace(/ysing$/, "yzing");
  if (t.length > 4 && t.endsWith("ies")) return `${t.slice(0, -3)}y`;
  if (t.length > 3 && t.endsWith("s") && !t.endsWith("ss") && !t.endsWith("us") && !t.endsWith("is")) return t.slice(0, -1);
  return t;
}

export function canonicalTokens(value: string): string[] {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean).map(stemToken);
}
export function canonicalPhrase(value: string): string { return canonicalTokens(value).join(" "); }
export function contentTokens(value: string): string[] { return canonicalTokens(value).filter((t) => !STOP.has(t) && t.length > 1); }

export function trigrams(value: string): Set<string> {
  const padded = `  ${value} `;
  const out = new Set<string>();
  for (let i = 0; i + 3 <= padded.length; i++) out.add(padded.slice(i, i + 3));
  return out;
}
export function dice(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let hit = 0;
  for (const x of a) if (b.has(x)) hit++;
  return (2 * hit) / (a.size + b.size);
}

export interface Resolved { concept: string; confidence: number; }

export class ConceptIndex {
  private readonly exact = new Map<string, string>();
  private readonly aliasGrams: Array<{ concept: string; phrase: string; grams: Set<string> }> = [];
  private readonly relations = new Map<string, number>();
  public constructor(concepts: Concept[], relations: Array<[string, string, number]>, private readonly kind: "skill" | "field" = "skill") { this.load(concepts, relations); }

  /** Replace the vocabulary in place. Used by the simulation to test engines against unseen aliases. */
  public load(concepts: Concept[], relations: Array<[string, string, number]>): void {
    this.exact.clear(); this.aliasGrams.length = 0; this.relations.clear();
    for (const concept of concepts) {
      for (const alias of [concept.id, ...concept.aliases]) {
        const phrase = canonicalPhrase(alias);
        if (!this.exact.has(phrase)) this.exact.set(phrase, concept.id);
        if (phrase.length >= 5) this.aliasGrams.push({ concept: concept.id, phrase, grams: trigrams(phrase) });
      }
    }
    for (const [a, b, w] of relations) { this.relations.set(`${a}|${b}`, w); this.relations.set(`${b}|${a}`, w); }
  }
  public relation(a: string, b: string): number { return a === b ? 1 : (this.relations.get(`${a}|${b}`) ?? 0); }

  /** Resolve one short label (a skill, a field) to its orbit. Typos snap to the nearest alias. */
  public resolve(label: string, allowFuzzy: boolean): Resolved | null {
    const phrase = canonicalPhrase(label);
    if (!phrase) return null;
    const direct = this.exact.get(phrase);
    if (direct) return { concept: direct, confidence: 1 };
    const found = this.scan(phrase);
    if (found.length === 1) return { concept: found[0]!, confidence: 0.9 };
    if (allowFuzzy && phrase.length >= 5) {
      const grams = trigrams(phrase);
      let best: Resolved | null = null;
      for (const entry of this.aliasGrams) {
        const d = dice(grams, entry.grams);
        if (d >= 0.72 && (!best || d > best.confidence)) best = { concept: entry.concept, confidence: d * 0.9 };
      }
      if (!best) observeUnmatched(this.kind,label);
      return best;
    }
    observeUnmatched(this.kind,label);
    return null;
  }

  /** Find every concept mentioned anywhere in a longer text. Two-letter aliases never match inside prose. */
  public scan(text: string): string[] {
    const tokens = text.split(" ").filter(Boolean);
    const found = new Set<string>();
    for (let i = 0; i < tokens.length; i++) {
      for (let n = Math.min(4, tokens.length - i); n >= 1; n--) {
        const phrase = tokens.slice(i, i + n).join(" ");
        if (phrase.length <= 2 && tokens.length > 1) continue;
        const hit = this.exact.get(phrase);
        if (hit) { found.add(hit); i += n - 1; break; }
      }
    }
    return [...found];
  }
}

export const SKILL_INDEX = new ConceptIndex(SKILL_CONCEPTS, SKILL_RELATIONS);
export const FIELD_INDEX = new ConceptIndex(FIELD_CONCEPTS, FIELD_RELATIONS, "field");

// Location symmetry: same place 1, same commuting zone 0.85, same region 0.5, anything else 0.
export function locationSimilarity(a: string, b: string): number {
  const x = canonicalPhrase(a), y = canonicalPhrase(b);
  for (const [raw,key] of [[a,x],[b,y]]) if (key && key !== "uganda" && key !== "remote" && !LOCATION_PARENT[key] && !COMMUTE_ZONES.some(zone => zone.includes(key))) observeUnmatched("location",raw);
  if (!x || !y) return 0;
  if (x === y || y === "uganda" || x === "uganda") return 1;
  if (COMMUTE_ZONES.some((zone) => zone.includes(x) && zone.includes(y))) return 0.85;
  const px = LOCATION_PARENT[x] ?? x, py = LOCATION_PARENT[y] ?? y;
  if (px === py && px !== "uganda") return 0.5;
  return 0;
}
