export interface MatchingWeights {
  fieldRelevance: number;
  skills: number;
  experience: number;
  location: number;
  workMode: number;
  careerInterest: number;
}

export const DEFAULT_MATCHING_WEIGHTS: MatchingWeights = {
  fieldRelevance: 20,
  skills: 25,
  experience: 15,
  location: 10,
  workMode: 5,
  careerInterest: 10,
};

export const CATEGORY_MATCHING_WEIGHTS: Readonly<Record<string, MatchingWeights>> = {
  scholarship: {
    fieldRelevance: 25,
    skills: 15,
    experience: 5,
    location: 10,
    workMode: 5,
    careerInterest: 25,
  },
  internship: DEFAULT_MATCHING_WEIGHTS,
  job: {
    fieldRelevance: 15,
    skills: 30,
    experience: 20,
    location: 10,
    workMode: 5,
    careerInterest: 5,
  },
};

export const MAX_WEIGHTED_SCORE = 85;

export function matchingWeightsFor(category: string): MatchingWeights {
  return CATEGORY_MATCHING_WEIGHTS[category.toLowerCase()] ?? DEFAULT_MATCHING_WEIGHTS;
}
