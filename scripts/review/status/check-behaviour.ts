import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const results: Array<[string, string]> = [];

const manual = resolve(root, "src/services/ingestion/manual/index.ts");
const hardGate = resolve(root, "src/services/matching/rule-based/hard-gates.ts");
const audience = resolve(root, "src/services/matching/audience.ts");
const appendix = resolve(root, "scripts/review/verify-appendix-b.ts");

results.push(["B1", existsSync(manual) ? "manual ingestion code exists; re-ingestion rule not proven in a memory adapter harness" : "no manual ingestion path"]);
results.push(["B2", existsSync(hardGate) ? "hard-gate function exists and is relevant to Gulu/Uganda rule checks" : "hard-gate function absent"]);
results.push(["A1", existsSync(audience) ? "audience gate module present" : "audience gate module absent: no provider implementation in src/services/matching/audience.ts"]);
results.push(["AppendixB", existsSync(appendix) ? "scratch contract test exists in scripts/review/verify-appendix-b.ts" : "Appendix B harness missing"]);

for (const [id, line] of results) {
  console.log(`${id}: ${line}`);
}
