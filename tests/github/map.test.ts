import { describe, expect, it } from "vitest";
import {
  computeGithubStats,
  mapGithubBasics,
  repoToProject,
  selectRepos,
  type GithubProfile,
  type GithubRepo,
} from "@/lib/github/map";

const repo = (over: Partial<GithubRepo>): GithubRepo => ({
  name: "repo",
  html_url: "https://github.com/ada/repo",
  description: "A thing.",
  language: "TypeScript",
  stargazers_count: 0,
  ...over,
});

describe("selectRepos", () => {
  it("drops forks, archived repos and unnamed entries", () => {
    const kept = selectRepos([
      repo({ name: "keep" }),
      repo({ name: "fork", fork: true }),
      repo({ name: "old", archived: true }),
      repo({ name: "  " }),
    ]);
    expect(kept.map((r) => r.name)).toEqual(["keep"]);
  });

  it("sorts by stars, then most recent push, and caps the list", () => {
    const repos = [
      repo({ name: "low", stargazers_count: 1 }),
      repo({ name: "high", stargazers_count: 50 }),
      repo({ name: "mid", stargazers_count: 20 }),
      repo({ name: "fresh", stargazers_count: 20, pushed_at: "2026-01-01" }),
      repo({ name: "stale", stargazers_count: 20, pushed_at: "2020-01-01" }),
    ];
    expect(selectRepos(repos, 4).map((r) => r.name)).toEqual([
      "high",
      "fresh",
      "stale",
      "mid",
    ]);
    expect(selectRepos(repos, 2)).toHaveLength(2);
  });
});

describe("repoToProject", () => {
  it("maps a public repo with a safe URL", () => {
    const project = repoToProject(
      repo({ name: "waku", description: "Identity cards", language: "TypeScript" }),
    );
    expect(project).toEqual({
      title: "waku",
      description: "Identity cards",
      url: "https://github.com/ada/repo",
      tag: "TypeScript",
      imageUrl: "",
    });
  });

  it("withholds the URL of a private repo so the link never 404s", () => {
    const project = repoToProject(repo({ private: true }));
    expect(project.url).toBe("");
  });

  it("drops an unsafe URL and clamps long fields", () => {
    const project = repoToProject(
      repo({ html_url: "javascript:alert(1)", description: "D".repeat(400) }),
    );
    expect(project.url).toBe("");
    expect(project.description).toHaveLength(220);
  });

  it("falls back to the first topic when there is no language", () => {
    const project = repoToProject(
      repo({ language: null, topics: ["cli", "tooling"] }),
    );
    expect(project.tag).toBe("cli");
  });
});

describe("computeGithubStats", () => {
  const profile: GithubProfile = {
    login: "ada",
    followers: 120,
    public_repos: 9,
  };

  it("totals public non-fork stars and derives top languages", () => {
    const stats = computeGithubStats(profile, [
      repo({ language: "TypeScript", stargazers_count: 10 }),
      repo({ language: "TypeScript", stargazers_count: 5 }),
      repo({ language: "Rust", stargazers_count: 40 }),
      repo({ fork: true, language: "Go", stargazers_count: 100 }),
      repo({ private: true, language: "Python", stargazers_count: 999 }),
    ]);
    expect(stats.totalStars).toBe(55);
    expect(stats.repoCount).toBe(3);
    expect(stats.followers).toBe(120);
    expect(stats.publicRepos).toBe(9);
    expect(stats.topLanguages).toEqual(["TypeScript", "Rust"]);
  });

  it("never counts private repos in the public signal", () => {
    const stats = computeGithubStats(profile, [
      repo({ private: true, stargazers_count: 500 }),
    ]);
    expect(stats.totalStars).toBe(0);
    expect(stats.repoCount).toBe(0);
  });
});

describe("mapGithubBasics", () => {
  it("sanitizes URL fields and clamps strings", () => {
    const basics = mapGithubBasics({
      login: "ada",
      name: "Ada Lovelace",
      bio: "First   programmer.",
      blog: "javascript:alert(1)",
      avatar_url: "https://avatars.githubusercontent.com/u/1",
    });
    expect(basics.name).toBe("Ada Lovelace");
    expect(basics.bio).toBe("First programmer.");
    expect(basics.websiteUrl).toBe("");
    expect(basics.avatarUrl).toBe("https://avatars.githubusercontent.com/u/1");
  });
});