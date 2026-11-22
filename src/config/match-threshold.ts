/**
 * The score a listing needs to count as one of the seeker's matches. Matching scores every listing that passes
 * the eligibility gates, including poor fits (an unrelated job scores about 20 to 25), so anything below this bar
 * is shown as an ordinary opportunity, never as a match.
 *
 * Set at 40 for the current catalogue: good-fit profiles' best listings score about 45 to 55 (see
 * scripts/sim/diagnose-scores.ts). Raise it as the catalogue gains listings with stated skills and fields.
 * This is separate from the admin relevance threshold (AI_RULES.relevanceThreshold), which stays at 60.
 */
export const MATCH_SCORE_THRESHOLD = 40;

export const isMatchScore = (score: number): boolean => score >= MATCH_SCORE_THRESHOLD;
