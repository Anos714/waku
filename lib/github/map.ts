import { isSafeUrl } from "@/lib/validation/profile";
import type { FeaturedProject } from "@/types";

/**
 * Pure mapping from GitHub API payloads to this app's profile shapes.
 *
 * Kept free of network and database access so the selection rules (which repos
 * count, how stars total, what a project card becomes) are unit-testable on
 * their own and can be reused by the rank score later.
 */

/** The subset of a GitHub repo payload this app reads. */
export interface GithubRepo {
  name: string;
  description?: string | null;
  html_url: string;
  language?: string | null;
  stargazers_count?: number;
  fork?: boolean;
  archived?: boolean;
  private?: boolean;
  pushed_at?: string | null;
  topics?: string[];
}

/** The subset of a GitHub user payload this app reads. */
export interface GithubProfile {
  login: string;
  name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  blog?: string | null;
  followers?: number;
  public_repos?: number;
}

/** A project before the editor assigns it a local id. */
export type MappedProject = Omit<FeaturedProject, "id">;

/**
 * The public stats snapshot a rank can score. Private repos are deliberately
 * excluded: the `repo` OAuth scope exists for autofill only, so no private
 * signal ever becomes part of a public number.
 */
export interface GithubStats {
  login: string;
  followers: number;
  publicRepos: number;
  /** Stars across public, non-fork repos. */
  totalStars: number;
  repoCount: number;
  topLanguages: string[];
}

const clamp = (value: string, max: number) => value.trim().slice(0, max);

function safeUrl(value: string | null | undefined): string {
  if (!value) return "";
  return isSafeUrl(value) ? value.trim() : "";
}

function pushedAt(repo: GithubRepo): string {
  return repo.pushed_at ?? "";
}

/**
 * Public, non-fork, non-archived repos, most-starred first with a recent push
 * as the tiebreak. Private repos stay in the list because the owner asked for
 * them in autofill; only the *project URL* is withheld (see `repoToProject`).
 */
export function selectRepos(repos: GithubRepo[], limit = 6): GithubRepo[] {
  return repos
    .filter((repo) => !repo.fork && !repo.archived && (repo.name ?? "").trim())
    .sort(
      (a, b) =>
        (b.stargazers_count ?? 0) - (a.stargazers_count ?? 0) ||
        pushedAt(b).localeCompare(pushedAt(a)),
    )
    .slice(0, limit);
}

/**
 * Maps one repo to a reviewable project card. A private repo keeps its name but
 * drops its URL, so an imported private project never renders a link that would
 * 404 for every visitor.
 */
export function repoToProject(repo: GithubRepo): MappedProject {
  return {
    title: clamp(repo.name ?? "", 80),
    description: clamp(repo.description ?? "", 220),
    url: repo.private ? "" : safeUrl(repo.html_url),
    tag: clamp(repo.language ?? repo.topics?.[0] ?? "", 24),
    imageUrl: "",
  };
}

/** Totals the public signal (stars, followers, languages) a rank can score. */
export function computeGithubStats(
  profile: GithubProfile,
  repos: GithubRepo[],
): GithubStats {
  const counted = repos.filter((repo) => !repo.fork && !repo.private);
  const totalStars = counted.reduce(
    (sum, repo) => sum + (repo.stargazers_count ?? 0),
    0,
  );

  const languages = new Map<string, number>();
  for (const repo of counted) {
    if (!repo.language) continue;
    languages.set(repo.language, (languages.get(repo.language) ?? 0) + 1);
  }

  const topLanguages = [...languages.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 4)
    .map(([language]) => language);

  return {
    login: profile.login,
    followers: profile.followers ?? 0,
    publicRepos: profile.public_repos ?? counted.length,
    totalStars,
    repoCount: counted.length,
    topLanguages,
  };
}

/** The basics GitHub can fill, sanitized for the profile schema. */
export function mapGithubBasics(profile: GithubProfile): {
  name: string;
  bio: string;
  websiteUrl: string;
  avatarUrl: string;
} {
  return {
    name: clamp(profile.name ?? "", 60),
    bio: (profile.bio ?? "").replace(/\s+/g, " ").trim().slice(0, 600),
    websiteUrl: safeUrl(profile.blog),
    avatarUrl: safeUrl(profile.avatar_url),
  };
}