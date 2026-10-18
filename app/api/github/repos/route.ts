import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/auth";
import {
  getGithubAccessToken,
  hasDatabase,
  saveGithubStats,
} from "@/lib/db";
import {
  computeGithubStats,
  mapGithubBasics,
  repoToProject,
  selectRepos,
  type MappedProject,
} from "@/lib/github/map";
import {
  fetchGithubProfile,
  fetchGithubRepos,
  GithubError,
  hasGithubCredentials,
} from "@/lib/github/client";

/**
 * GitHub import Route Handler.
 *
 * Reads the signed-in user's own repositories with their stored OAuth token and
 * returns a reviewable profile patch (basics, projects, languages) plus a public
 * stats snapshot. Nothing is written to the user's draft here — the editor shows
 * every group for approval first. The access token never leaves the server, and
 * the stats snapshot is best-effort so a failing write never blocks autofill.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z
  .object({ limit: z.number().int().min(1).max(12).optional() })
  .default({});

const DEFAULT_LIMIT = 6;

function error(status: number, code: string, message: string, hint?: string) {
  return NextResponse.json({ ok: false, code, message, hint }, { status });
}

export async function POST(request: Request) {
  if (!hasDatabase() || !hasGithubCredentials()) {
    return error(
      503,
      "MISSING_GITHUB",
      "GitHub import is not configured on this server.",
      "Set DATABASE_URL and GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET (see .env.example) and restart. The manual editor works either way.",
    );
  }

  const session = await getSession();
  if (!session) {
    return error(
      401,
      "UNAUTHENTICATED",
      "Sign in to import from GitHub.",
      "Sign in with GitHub, or sign in and connect GitHub, then try again.",
    );
  }

  let rawBody: unknown = {};
  try {
    rawBody = await request.json();
  } catch {
    // An empty body is valid: the default limit applies.
  }

  const parsed = bodySchema.safeParse(rawBody ?? {});
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return error(
      422,
      "INVALID_INPUT",
      first?.message ?? "The request did not pass validation.",
      first?.path.join(".") || undefined,
    );
  }
  const limit = parsed.data.limit ?? DEFAULT_LIMIT;

  const token = await getGithubAccessToken(session.user.id);
  if (!token) {
    return error(
      409,
      "GITHUB_NOT_CONNECTED",
      "This account is not connected to GitHub.",
      "Connect GitHub to import your repositories.",
    );
  }

  try {
    const [profile, repos] = await Promise.all([
      fetchGithubProfile(token),
      fetchGithubRepos(token),
    ]);

    const projects: MappedProject[] = selectRepos(repos, limit).map(repoToProject);
    const stats = computeGithubStats(profile, repos);
    const basics = mapGithubBasics(profile);

    const warnings: string[] = [];
    if (repos.length > 0 && projects.length === 0) {
      warnings.push("No public, non-fork repositories were found to suggest.");
    }

    // Best-effort: persisting the snapshot never blocks the response.
    await saveGithubStats(session.user.id, stats);

    return NextResponse.json({
      ok: true,
      profile: {
        login: stats.login,
        ...basics,
        followers: stats.followers,
        publicRepos: stats.publicRepos,
      },
      projects,
      skills: stats.topLanguages,
      stats,
      warnings,
    });
  } catch (err) {
    if (err instanceof GithubError) {
      if (err.message === "GITHUB_REAUTH_REQUIRED") {
        return error(
          403,
          "GITHUB_REAUTH_REQUIRED",
          "GitHub needs to be reconnected.",
          "Reconnect GitHub to grant read access to your repositories, then try again.",
        );
      }
      if (err.message === "GITHUB_NETWORK_ERROR") {
        return error(
          502,
          "GITHUB_NETWORK_ERROR",
          "GitHub could not be reached.",
          "This is usually temporary. Try again in a moment.",
        );
      }
    }

    return error(
      502,
      "GITHUB_REQUEST_FAILED",
      "GitHub did not return your repositories.",
      "Try again, or fill the editor by hand. It works either way.",
    );
  }
}