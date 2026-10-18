import type { GithubProfile, GithubRepo } from "./map";

/**
 * Server-only GitHub API client.
 *
 * The OAuth access token is read from the database by the caller and passed in;
 * it is never returned to the browser and never logged. All calls are plain
 * `fetch` (no SDK), matching the Groq/Gemini integration style.
 */

const GITHUB_API = "https://api.github.com";
const UPSTREAM_TIMEOUT_MS = 15_000;
/** One page is enough for autofill and the public stats snapshot. */
const PER_PAGE = 100;

/** True when this server has the OAuth credentials GitHub sign-in needs. */
export function hasGithubCredentials(): boolean {
  return Boolean(
    process.env.GITHUB_CLIENT_ID?.trim() &&
      process.env.GITHUB_CLIENT_SECRET?.trim(),
  );
}

export class GithubError extends Error {
  status: number | null;
  constructor(message: string, status: number | null) {
    super(message);
    this.name = "GithubError";
    this.status = status;
  }
}

async function githubGet<T>(path: string, token: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${GITHUB_API}${path}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        Authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch {
    throw new GithubError("GITHUB_NETWORK_ERROR", null);
  }

  if (!response.ok) {
    // 401 means the stored token no longer carries the scopes we need (a
    // session created before `repo` was requested, or a revoked token): the
    // user must reconnect GitHub rather than see a generic failure.
    if (response.status === 401) {
      throw new GithubError("GITHUB_REAUTH_REQUIRED", 401);
    }
    throw new GithubError("GITHUB_REQUEST_FAILED", response.status);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new GithubError("GITHUB_BAD_RESPONSE", response.status);
  }
}

/** The authenticated user's GitHub profile. */
export async function fetchGithubProfile(token: string): Promise<GithubProfile> {
  return githubGet<GithubProfile>("/user", token);
}

/**
 * The authenticated user's own repositories (public and private), most recently
 * pushed first. Selection, ordering and sanitizing happen in `map.ts` so this
 * stays a thin transport function.
 */
export async function fetchGithubRepos(token: string): Promise<GithubRepo[]> {
  const repos = await githubGet<GithubRepo[]>(
    `/user/repos?per_page=${PER_PAGE}&sort=pushed&affiliation=owner,collaborator,organization_member`,
    token,
  );
  return Array.isArray(repos) ? repos : [];
}