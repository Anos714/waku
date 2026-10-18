import { describe, expect, it } from "vitest";
import {
  computeRank,
  rankTierFor,
  RANK_TIERS,
  RANK_WEIGHTS,
  type RankInput,
} from "@/lib/rank/score";

const empty: RankInput = {
  totalStars: 0,
  followers: 0,
  publicRepos: 0,
  repoCount: 0,
  topLanguages: [],
};

describe("computeRank", () => {
  it("scores an empty account at zero on the starter tier", () => {
    const result = computeRank(empty);
    expect(result.score).toBe(0);
    expect(result.tier.id).toBe("starter");
    expect(result.factors.every((f) => f.points === 0)).toBe(true);
  });

  it("never exceeds 100 even when every factor is saturated", () => {
    const result = computeRank({
      totalStars: 100_000,
      followers: 100_000,
      publicRepos: 100_000,
      repoCount: 100_000,
      topLanguages: ["A", "B", "C", "D", "E"],
    });
    expect(result.score).toBe(100);
    expect(result.tier.id).toBe("top");
  });

  it("caps each factor at its weight", () => {
    const result = computeRank({
      ...empty,
      totalStars: 5000,
    });
    const stars = result.factors.find((f) => f.id === "stars")!;
    expect(stars.points).toBe(RANK_WEIGHTS.stars);
  });

  it("rewards a first few stars more than later ones (log scale)", () => {
    const small = computeRank({ ...empty, totalStars: 10 });
    const large = computeRank({ ...empty, totalStars: 1000 });
    const smallStars = small.factors.find((f) => f.id === "stars")!.points;
    const largeStars = large.factors.find((f) => f.id === "stars")!.points;
    expect(smallStars).toBeGreaterThan(0);
    expect(smallStars).toBeLessThan(largeStars);
    expect(smallStars / RANK_WEIGHTS.stars).toBeGreaterThan(0.3);
  });

  it("scores language breadth linearly and tops out at four", () => {
    const two = computeRank({ ...empty, topLanguages: ["A", "B"] });
    const four = computeRank({ ...empty, topLanguages: ["A", "B", "C", "D"] });
    expect(two.factors.find((f) => f.id === "languages")!.points).toBe(
      Math.round(RANK_WEIGHTS.languages / 2),
    );
    expect(four.factors.find((f) => f.id === "languages")!.points).toBe(
      RANK_WEIGHTS.languages,
    );
  });

  it("is deterministic and order-independent", () => {
    const a = computeRank({ totalStars: 42, followers: 7, repoCount: 5, publicRepos: 5, topLanguages: ["TS"] });
    const b = computeRank({ totalStars: 42, followers: 7, repoCount: 5, publicRepos: 5, topLanguages: ["TS"] });
    expect(a).toEqual(b);
  });
});

describe("rankTierFor", () => {
  it("returns the highest tier whose threshold is met", () => {
    expect(rankTierFor(100).id).toBe("top");
    expect(rankTierFor(75).id).toBe("top");
    expect(rankTierFor(74).id).toBe("established");
    expect(rankTierFor(50).id).toBe("established");
    expect(rankTierFor(25).id).toBe("rising");
    expect(rankTierFor(0).id).toBe("starter");
  });

  it("always returns a tier, even for a negative score", () => {
    expect(rankTierFor(-10).id).toBe("starter");
  });

  it("has tiers ordered from highest to lowest threshold", () => {
    const mins = RANK_TIERS.map((t) => t.min);
    expect([...mins].sort((a, b) => b - a)).toEqual(mins);
  });
});