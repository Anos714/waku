/**
 * The Waku rank: a deterministic score over a user's *public* GitHub signal.
 *
 * Deliberately pure and dependency-free so the same formula runs in the editor,
 * on the server and in tests. Every input comes from the stored `github_stats`
 * snapshot, which only ever totals public, non-fork data — there is no private
 * signal in a rank, and no invented number anywhere.
 *
 * Stars, followers and repository counts are weighted on a log scale: the first
 * few of each move the needle, while an account with thousands does not drown
 * out everyone else. Language breadth is linear because it tops out at four.
 */

export interface RankInput {
  totalStars: number;
  followers: number;
  publicRepos: number;
  repoCount: number;
  topLanguages: string[];
}

export type RankTierId = "starter" | "rising" | "established" | "top";

export interface RankTier {
  id: RankTierId;
  label: string;
  /** Lowest score (inclusive) that earns this tier. */
  min: number;
}

export interface RankFactor {
  id: "stars" | "followers" | "repos" | "languages";
  label: string;
  /** Points earned (0…max). */
  points: number;
  max: number;
  /** Human-readable source value, for a breakdown UI. */
  detail: string;
}

export interface RankResult {
  /** 0…100. */
  score: number;
  tier: RankTier;
  factors: RankFactor[];
}

/** Per-factor ceilings. Together they sum to 100, so `score` is a percentage. */
export const RANK_WEIGHTS = {
  stars: 40,
  followers: 25,
  repos: 20,
  languages: 15,
} as const;

/** The input value that earns a full factor. */
const CEILINGS = {
  stars: 1000,
  followers: 500,
  repos: 50,
  languages: 4,
} as const;

/** Highest tier first, so `rankTierFor` can take the first match. */
export const RANK_TIERS: RankTier[] = [
  { id: "top", label: "Top builder", min: 75 },
  { id: "established", label: "Established", min: 50 },
  { id: "rising", label: "Rising", min: 25 },
  { id: "starter", label: "Starter", min: 0 },
];

/** The tier a score falls into. Always returns a tier, never null. */
export function rankTierFor(score: number): RankTier {
  return RANK_TIERS.find((tier) => score >= tier.min) ?? RANK_TIERS[RANK_TIERS.length - 1];
}

function logPoints(value: number, ceiling: number, max: number): number {
  const clamped = Math.max(0, Math.min(value, ceiling));
  const ratio = Math.log10(1 + clamped) / Math.log10(1 + ceiling);
  return Math.round(ratio * max);
}

function linearPoints(value: number, ceiling: number, max: number): number {
  const ratio = Math.max(0, Math.min(value, ceiling)) / ceiling;
  return Math.round(ratio * max);
}

/** Scores a GitHub stats snapshot into 0–100 plus a tier and a breakdown. */
export function computeRank(input: RankInput): RankResult {
  const stars = Math.max(0, input.totalStars || 0);
  const followers = Math.max(0, input.followers || 0);
  const repos = Math.max(0, input.repoCount || 0);
  const languages = Math.max(0, input.topLanguages?.length ?? 0);

  const factors: RankFactor[] = [
    {
      id: "stars",
      label: "Stars earned",
      points: logPoints(stars, CEILINGS.stars, RANK_WEIGHTS.stars),
      max: RANK_WEIGHTS.stars,
      detail: `${stars.toLocaleString()} stars`,
    },
    {
      id: "followers",
      label: "Followers",
      points: logPoints(followers, CEILINGS.followers, RANK_WEIGHTS.followers),
      max: RANK_WEIGHTS.followers,
      detail: `${followers.toLocaleString()} followers`,
    },
    {
      id: "repos",
      label: "Projects shipped",
      points: logPoints(repos, CEILINGS.repos, RANK_WEIGHTS.repos),
      max: RANK_WEIGHTS.repos,
      detail: `${repos.toLocaleString()} public repos`,
    },
    {
      id: "languages",
      label: "Languages used",
      points: linearPoints(languages, CEILINGS.languages, RANK_WEIGHTS.languages),
      max: RANK_WEIGHTS.languages,
      detail: `${languages} ${languages === 1 ? "language" : "languages"}`,
    },
  ];

  const score = Math.min(
    100,
    factors.reduce((sum, factor) => sum + factor.points, 0),
  );

  return { score, tier: rankTierFor(score), factors };
}