/**
 * The score a listing needs to count as one of the seeker's matches. Matching scores every listing that passes
 * the eligibility gates, including poor fits (an unrelated job scores about 20 to 25), so anything below this bar
 * is shown as an ordinary opportunity, never as a match.
 *
 * Set at 55 with OrbitMatch 2.1.0, which scores on what each listing states: a profile meeting every stated
 * requirement scores a median of 93, a poor-fit profile about 46. At the old bar of 40 (set for 2.0.0, which
 * under-scored good fits) most poor fits counted as matches.
 * This is separate from the admin relevance threshold (AI_RULES.relevanceThreshold), which stays at 60.
 */
export const MATCH_SCORE_THRESHOLD = 55;

export const isMatchScore = (score: number): boolean => score >= MATCH_SCORE_THRESHOLD;
