// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/auth", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/db", () => ({
  hasDatabase: vi.fn(),
  getGithubAccessToken: vi.fn(),
  saveGithubStats: vi.fn(),
}));
vi.mock("@/lib/github/client", () => ({
  hasGithubCredentials: vi.fn(),
  fetchGithubProfile: vi.fn(),
  fetchGithubRepos: vi.fn(),
  GithubError: class GithubError extends Error {
    status: number | null;
    constructor(message: string, status: number | null) {
      super(message);
      this.status = status;
    }
  },
}));

import { getSession } from "@/auth";
import { getGithubAccessToken, hasDatabase, saveGithubStats } from "@/lib/db";
import {
  fetchGithubProfile,
  fetchGithubRepos,
  hasGithubCredentials,
} from "@/lib/github/client";

const mockSession = getSession as unknown as ReturnType<typeof vi.fn>;
const mockHasDb = hasDatabase as unknown as ReturnType<typeof vi.fn>;
const mockToken = getGithubAccessToken as unknown as ReturnType<typeof vi.fn>;
const mockSave = saveGithubStats as unknown as ReturnType<typeof vi.fn>;
const mockHasCreds = hasGithubCredentials as unknown as ReturnType<typeof vi.fn>;
const mockProfile = fetchGithubProfile as unknown as ReturnType<typeof vi.fn>;
const mockRepos = fetchGithubRepos as unknown as ReturnType<typeof vi.fn>;

async function post() {
  const { POST } = await import("@/app/api/github/sync/route");
  return POST();
}

describe("POST /api/github/sync", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.resetModules();
    mockHasDb.mockReturnValue(true);
    mockHasCreds.mockReturnValue(true);
    mockSession.mockResolvedValue({ user: { id: "user-1" } });
    mockToken.mockResolvedValue("gho_token");
    mockSave.mockResolvedValue(true);
    mockProfile.mockResolvedValue({
      login: "ada",
      name: "Ada Lovelace",
      bio: "First programmer.",
      followers: 12,
      public_repos: 3,
    });
    mockRepos.mockResolvedValue([
      {
        name: "waku",
        html_url: "https://github.com/ada/waku",
        language: "TypeScript",
        stargazers_count: 7,
      },
      {
        name: "forked",
        html_url: "https://github.com/ada/forked",
        fork: true,
        stargazers_count: 99,
      },
    ]);
  });

  it("reports MISSING_GITHUB when the database is absent", async () => {
    mockHasDb.mockReturnValue(false);
    const response = await post();
    const body = await response.json();
    expect(response.status).toBe(503);
    expect(body.code).toBe("MISSING_GITHUB");
    expect(mockProfile).not.toHaveBeenCalled();
  });

  it("requires a session", async () => {
    mockSession.mockResolvedValue(null);
    const response = await post();
    const body = await response.json();
    expect(response.status).toBe(401);
    expect(body.code).toBe("UNAUTHENTICATED");
  });

  it("asks the account to connect GitHub when no token is stored", async () => {
    mockToken.mockResolvedValue(null);
    const response = await post();
    const body = await response.json();
    expect(response.status).toBe(409);
    expect(body.code).toBe("GITHUB_NOT_CONNECTED");
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("persists the snapshot and returns the rank", async () => {
    const response = await post();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.stats.totalStars).toBe(7);
    expect(body.rank.score).toBeGreaterThan(0);
    expect(body.rank.tier.label).toBeTruthy();
    expect(mockSave).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ login: "ada", totalStars: 7 }),
    );
  });

  it("fails loudly when the snapshot cannot be saved", async () => {
    mockSave.mockResolvedValue(false);
    const response = await post();
    const body = await response.json();
    expect(response.status).toBe(502);
    expect(body.code).toBe("GITHUB_SYNC_FAILED");
  });

  it("asks for a GitHub reconnect when the token lost its scope", async () => {
    const { GithubError } = await import("@/lib/github/client");
    mockRepos.mockRejectedValueOnce(
      new GithubError("GITHUB_REAUTH_REQUIRED", 401),
    );
    const response = await post();
    const body = await response.json();
    expect(response.status).toBe(403);
    expect(body.code).toBe("GITHUB_REAUTH_REQUIRED");
  });

  it("maps a network failure from GitHub to 502", async () => {
    const { GithubError } = await import("@/lib/github/client");
    mockProfile.mockRejectedValueOnce(new GithubError("GITHUB_NETWORK_ERROR", null));
    const response = await post();
    const body = await response.json();
    expect(response.status).toBe(502);
    expect(body.code).toBe("GITHUB_NETWORK_ERROR");
  });
});