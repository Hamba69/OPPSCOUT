# OrbitMatch: drop-in matching engine (no API, no per-call cost)

Deterministic, explainable, about 0.5 ms per profile/opportunity pair. Same `MatchEngine` interface, same hard gates, same 0..100 score.

## Install
Copy these paths into the repo root, keeping folders:
- `src/services/matching/orbit/ontology.ts`   vocabulary tables (edit this to improve matching)
- `src/services/matching/orbit/canonical.ts`  normalisation, concept resolution, typo snapping, location hierarchy
- `src/services/matching/orbit/engine.ts`     `OrbitMatchEngine`
- `src/services/matching/engine-selector.ts`  replaces the existing file; Orbit is now the non-AI default
- `tests/unit/orbit-matching.test.ts`
- `scripts/sim/orbit-simulation.ts`           simulation harness (`npx tsx scripts/sim/orbit-simulation.ts`)

Set `OPPSCOUT_MATCH_ENGINE=rules` to fall back to the old engine instantly. `OPPSCOUT_AI_DEFAULT` behaviour is unchanged.

## How it works (SCC protocol, applied honestly)
1. Find the symmetry: "Data Analytics", "analysing data" and "statistical analysis" are one skill. Same for fields, places and work modes. Each class is an orbit.
2. Compress: resolve every label to its orbit once, so matching compares orbits, not strings (cuts the surface space from thousands of phrasings to about 30 skills and 13 fields).
3. Dual view: orbit-to-orbit relations give partial credit (`javascript` to `software development` 0.7), and a boundary view reads concepts out of free-text descriptions for career interest.
4. Certify: every point of score is traceable to a matched or missing factor shown to the user; hard gates stay untouched and still exclude ineligible users before scoring.

Note: the SCC reference's P=NP claims are unproven research conjecture. Only the practical heuristic (find the equivalence classes, compare classes) is used here, and it is validated by simulation, not by the theory.

## Simulation results (3 seeds x 8 conditions, 4,800 pairs per run)
Ground truth is a hidden latent model the engines never see; users write from the full alias universe while the engine's table is truncated to 100/70/50/30 percent to test unseen vocabulary.

| Engine | AUC | NDCG@10 |
|---|---|---|
| Current rules (V0) | 0.79 | 0.70 |
| TF-IDF cosine | 0.81 | 0.70 |
| Orbit canonical only | 0.83 | 0.77 |
| Orbit + soft relations | 0.86 | 0.80 |
| **Orbit default (anchor .1, empty prior .8)** | **0.86** | **0.79** |

Findings: soft relations are the main gain; a strong competence anchor raises precision but lowers recall without improving ranking, so it ships at 0.1; empty-requirement listings get 0.8 credit not 1.0.

## Limits you should know
- Simulation is synthetic. The ground truth shares assumptions with the ontology, so absolute numbers flatter the engine. Treat the ranking between engines as meaningful, not the decimals.
- With only 30% of vocabulary known, AUC drops to about 0.80 (still above baseline). The fix is data: log unmatched skill strings and add them to `ontology.ts` weekly.
- Calibrated threshold is about 55, not 60. `AI_RULES.relevanceThreshold` is untouched; adjust if you compare engines.
- Real validation: label 200 real user/opportunity pairs by hand and run `compareMatchEngines` from `ai-assisted/comparison.ts` on them.
