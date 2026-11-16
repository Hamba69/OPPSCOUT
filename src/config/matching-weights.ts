import { isFlexibleGeographyCategory } from "@/config/opportunity-categories";

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

/**
 * OrbitMatch v2 weights. Adds education level and opportunity-type fit, and leans on competence
 * (skills, field, qualification, experience) rather than location, which says little in a
 * Uganda-wide catalogue. Each row sums to 100 before flexible-geography categories drop location.
 */
export interface OrbitMatchingWeights extends MatchingWeights {
  education: number;
  categoryFit: number;
}

export const ORBIT_DEFAULT_WEIGHTS: OrbitMatchingWeights = {
  skills: 25, fieldRelevance: 17, education: 10, experience: 15, careerInterest: 12, categoryFit: 9, location: 8, workMode: 4,
};

export const ORBIT_CATEGORY_WEIGHTS: Readonly<Record<string, OrbitMatchingWeights>> = {
  job: { skills: 28, fieldRelevance: 14, education: 12, experience: 20, careerInterest: 7, categoryFit: 7, location: 8, workMode: 4 },
  consultancy: { skills: 28, fieldRelevance: 14, education: 10, experience: 24, careerInterest: 7, categoryFit: 7, location: 6, workMode: 4 },
  internship: { skills: 24, fieldRelevance: 22, education: 12, experience: 8, careerInterest: 14, categoryFit: 10, location: 6, workMode: 4 },
  scholarship: { skills: 8, fieldRelevance: 26, education: 24, experience: 4, careerInterest: 24, categoryFit: 14, location: 0, workMode: 0 },
  fellowship: { skills: 16, fieldRelevance: 22, education: 16, experience: 12, careerInterest: 22, categoryFit: 12, location: 0, workMode: 0 },
  grant: { skills: 18, fieldRelevance: 16, education: 6, experience: 8, careerInterest: 32, categoryFit: 20, location: 0, workMode: 0 },
  training: { skills: 22, fieldRelevance: 16, education: 14, experience: 4, careerInterest: 28, categoryFit: 16, location: 0, workMode: 0 },
};

export function orbitWeightsFor(category: string): OrbitMatchingWeights {
  const normalizedCategory = category.trim().toLowerCase().replace(/s$/, "");
  const weights = ORBIT_CATEGORY_WEIGHTS[normalizedCategory] ?? ORBIT_DEFAULT_WEIGHTS;
  return isFlexibleGeographyCategory(category) ? { ...weights, location: 0, workMode: 0 } : weights;
}

export function matchingWeightsFor(category: string): MatchingWeights {
  const normalizedCategory = category.trim().toLowerCase().replace(/s$/, "");
  const weights = CATEGORY_MATCHING_WEIGHTS[normalizedCategory] ?? DEFAULT_MATCHING_WEIGHTS;
  return isFlexibleGeographyCategory(category)
    ? { ...weights, location: 0, workMode: 0 }
    : weights;
}
