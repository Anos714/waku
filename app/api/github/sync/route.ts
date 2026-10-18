import { NextResponse } from "next/server";
import { getSession } from "@/auth";
import { getGithubAccessToken, hasDatabase, saveGithubStats } from "@/lib/db";
import { computeRank } from "@/lib/rank/score";
import { computeGithubStats } from "@/lib/github/map";
import {
  fetchGithubProfile,
  fetchGithubRepos,
  GithubError,
  hasGithubCredentials,
} from "@/lib/github/client";

/**
 * Rank sync Route Handler.
 *
 * Unlike `/api/github/repos` (which returns a reviewable patch for autofill),
 * this reads only the public stats snapshot and persists it, so a signed-in user
 * gets a rank without having to import anything first. The editor calls it
 * automatically on load for GitHub-connected accounts, throttled client-side.
 *
 * Nothing is returned to the browser except the user's own public numbers.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function error(status: number, code: string, message: string, hint?: string) {
  return NextResponse.json({ ok: false, code, message, hint }, { status });
}

export async function POST() {
  if (!hasDatabase() || !hasGithubCredentials()) {
    return error(
      503,
      "MISSING_GITHUB",
      "GitHub ranks are not configured on this server.",
      "Set DATABASE_URL and GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET (see .env.example) and restart.",
    );
  }

  const session = await getSession();
  if (!session) {
    return error(
      401,
      "UNAUTHENTICATED",
      "Sign in to get a rank.",
      "Sign in with GitHub, or sign in and connect GitHub.",
    );
  }

  const token = await getGithubAccessToken(session.user.id);
  if (!token) {
    return error(
      409,
      "GITHUB_NOT_CONNECTED",
      "This account is not connected to GitHub.",
      "Connect GitHub to get a rank.",
    );
  }

  try {
    const [profile, repos] = await Promise.all([
      fetchGithubProfile(token),
      fetchGithubRepos(token),
    ]);

    const stats = computeGithubStats(profile, repos);
    // Persisting is what puts the account on the leaderboard, so a failure here
    // is reported rather than swallowed.
    const saved = await saveGithubStats(session.user.id, stats);
    if (!saved) {
      return error(
        502,
        "GITHUB_SYNC_FAILED",
        "Your rank could not be saved.",
        "Try again in a moment.",
      );
    }

    return NextResponse.json({ ok: true, stats, rank: computeRank(stats) });
  } catch (err) {
    if (err instanceof GithubError) {
      if (err.message === "GITHUB_REAUTH_REQUIRED") {
        return error(
          403,
          "GITHUB_REAUTH_REQUIRED",
          "GitHub needs to be reconnected.",
          "Reconnect GitHub to grant read access, then try again.",
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
      "GitHub did not return your stats.",
      "Try again in a moment.",
    );
  }
}