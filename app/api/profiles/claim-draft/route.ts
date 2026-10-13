import { NextResponse } from "next/server";
import { profileSchema } from "@/lib/validation/profile";
import { getSession } from "@/auth";
import { claimDraftForUser, hasDatabase } from "@/lib/db";

/**
 * Imports the browser's local draft as the signed-in user's first published
 * page, so work done anonymously is not lost on sign-in.
 *
 * Idempotent by design: once the user owns a profile the draft is left alone and
 * the existing page's slug is returned, so this endpoint can be called after
 * every sign-in without creating duplicate pages.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function error(status: number, code: string, message: string, hint?: string) {
  return NextResponse.json({ ok: false, code, message, hint }, { status });
}

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return error(
      503,
      "MISSING_DATABASE",
      "Publishing is not configured on this server.",
      "Add DATABASE_URL to a local .env file (see .env.example) and restart the dev server.",
    );
  }

  const session = await getSession();
  if (!session) {
    return error(
      401,
      "UNAUTHENTICATED",
      "Sign in before importing a draft.",
      "Use a GitHub or Google account in the editor's Share panel.",
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error(400, "BAD_BODY", "The request body could not be read as JSON.");
  }

  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return error(
      422,
      "INVALID_PROFILE",
      first?.message ?? "The profile did not pass validation.",
      first?.path.join(".") || undefined,
    );
  }

  const profile = parsed.data as Parameters<typeof claimDraftForUser>[0];
  const result = await claimDraftForUser(profile, session.user.id);
  if (!result.slug) {
    return error(
      502,
      "PUBLISH_FAILED",
      "The draft could not be written to the database.",
      "Check that DATABASE_URL points to a reachable Neon database.",
    );
  }

  return NextResponse.json({ ok: true, ...result });
}
