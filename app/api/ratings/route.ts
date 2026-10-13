import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ratingSchema } from "@/lib/validation/rating";
import { getRatingStats, hasDatabase, listApprovedRatings, saveRating } from "@/lib/db";

/**
 * Visitor ratings for the `/rate` page.
 *
 * `GET` returns the approved ratings and the running average so the page (and
 * the landing strip) can render them server-side or after a submit.
 *
 * `POST` is anonymous by design — no account is needed to rate — but the
 * client's IP + user agent are hashed into a unique fingerprint, so one person
 * can only ever have one rating, which they may revise. A new rating revalidates
 * the landing page so the social-proof strip picks it up.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function error(status: number, code: string, message: string, hint?: string) {
  return NextResponse.json({ ok: false, code, message, hint }, { status });
}

/**
 * Stable per-client key. Prefers the first forwarded-for hop (the original
 * client) and falls back to whatever the platform reported; a missing IP is
 * still combined with the user agent so two browsers behind one address do not
 * collide.
 */
function clientFingerprint(request: Request): string {
  const headers = request.headers;
  const forwarded = headers.get("x-forwarded-for");
  const ip = (forwarded ? forwarded.split(",")[0] : null) ?? headers.get("x-real-ip") ?? "unknown";
  const ua = headers.get("user-agent") ?? "unknown";

  return `${ip.trim()}::${ua.trim()}`;
}

export async function GET(request: Request) {
  if (!hasDatabase()) {
    return NextResponse.json({ ok: true, ratings: [], average: 0, count: 0 });
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "12");

  const [ratings, stats] = await Promise.all([
    listApprovedRatings(Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 48) : 12),
    getRatingStats(),
  ]);

  return NextResponse.json({
    ok: true,
    ratings,
    average: stats.average,
    count: stats.count,
  });
}

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return error(
      503,
      "MISSING_DATABASE",
      "Ratings are not being collected on this server.",
      "Add DATABASE_URL to a local .env file (see .env.example) and restart the dev server to enable ratings.",
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error(400, "BAD_BODY", "The request body could not be read as JSON.");
  }

  const parsed = ratingSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return error(
      422,
      "INVALID_RATING",
      first?.message ?? "The rating did not pass validation.",
      first?.path.join(".") || undefined,
    );
  }

  const saved = await saveRating({
    authorName: parsed.data.authorName,
    rating: parsed.data.rating,
    message: parsed.data.message,
    fingerprint: clientFingerprint(request),
  });

  if (!saved) {
    return error(
      502,
      "SAVE_FAILED",
      "The rating could not be written to the database.",
      "Check that DATABASE_URL points to a reachable Neon database.",
    );
  }

  // The landing page's ratings strip reads from the same rows, so refresh it
  // now rather than waiting for the next revalidate window.
  revalidatePath("/");

  return NextResponse.json({ ok: true, rating: saved });
}
