import type { MatchInput, MatchWeights } from "@/types/domain";
import { clampScore } from "@/lib/utils";

export const DEFAULT_MATCH_WEIGHTS: MatchWeights = {
  image: 30,
  text: 25,
  category: 10,
  colour: 10,
  brand: 10,
  location: 8,
  date: 7
};

export function validateWeights(weights: MatchWeights): void {
  const values = Object.values(weights);
  if (values.some((value) => value < 0 || !Number.isFinite(value))) {
    throw new Error("All matching weights must be finite, non-negative numbers.");
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  if (Math.abs(total - 100) > 0.001) {
    throw new Error(`Matching weights must total 100. Received ${total}.`);
  }
}

export function calculateMatchScore(
  input: MatchInput,
  weights: MatchWeights = DEFAULT_MATCH_WEIGHTS
): number {
  validateWeights(weights);

  const weighted =
    clampScore(input.imageSimilarity) * weights.image +
    clampScore(input.textSimilarity) * weights.text +
    clampScore(input.categoryMatch) * weights.category +
    clampScore(input.colourSimilarity) * weights.colour +
    clampScore(input.brandSimilarity) * weights.brand +
    clampScore(input.locationSimilarity) * weights.location +
    clampScore(input.dateSimilarity) * weights.date;

  return Math.round((weighted / 100) * 100) / 100;
}

export function confidenceLabel(score: number): "Very strong" | "Strong" | "Possible" | "Weak" {
  if (score >= 85) return "Very strong";
  if (score >= 70) return "Strong";
  if (score >= 50) return "Possible";
  return "Weak";
}

export function explainMatch(input: MatchInput, score: number): string {
  const reasons: string[] = [];
  if (input.imageSimilarity >= 75) reasons.push("visually similar images");
  if (input.textSimilarity >= 75) reasons.push("closely matching descriptions");
  if (input.categoryMatch >= 90) reasons.push("the same item category");
  if (input.colourSimilarity >= 75) reasons.push("similar colours");
  if (input.brandSimilarity >= 75) reasons.push("matching brand or model details");
  if (input.locationSimilarity >= 75) reasons.push("nearby campus locations");
  if (input.dateSimilarity >= 75) reasons.push("dates recorded close together");

  const reasonText = reasons.length > 0 ? reasons.join(", ") : "several moderately similar attributes";
  return `${Math.round(score)}% recommendation based on ${reasonText}. Human verification is required.`;
}
