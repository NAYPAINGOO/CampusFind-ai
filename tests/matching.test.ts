import { describe, expect, it } from "vitest";
import { calculateMatchScore, confidenceLabel, DEFAULT_MATCH_WEIGHTS, validateWeights } from "@/lib/matching";

describe("weighted matching", () => {
  it("calculates the configured weighted score", () => {
    const score = calculateMatchScore({
      imageSimilarity: 90,
      textSimilarity: 80,
      categoryMatch: 100,
      colourSimilarity: 90,
      brandSimilarity: 100,
      locationSimilarity: 70,
      dateSimilarity: 80
    });
    expect(score).toBe(87.2);
    expect(confidenceLabel(score)).toBe("Very strong");
  });

  it("rejects weights that do not total 100", () => {
    expect(() => validateWeights({ ...DEFAULT_MATCH_WEIGHTS, image: 29 })).toThrow(/total 100/);
  });

  it("clamps component values to zero and one hundred", () => {
    const score = calculateMatchScore({
      imageSimilarity: 500,
      textSimilarity: -10,
      categoryMatch: 100,
      colourSimilarity: 100,
      brandSimilarity: 100,
      locationSimilarity: 100,
      dateSimilarity: 100
    });
    expect(score).toBe(75);
  });
});
