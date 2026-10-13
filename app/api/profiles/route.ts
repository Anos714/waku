import { NextResponse } from "next/server";
import { profileSchema } from "@/lib/validation/profile";
import { getSession } from "@/auth";
import { hasDatabase, publishProfile } from "@/lib/db";

/**
 * Publishes a profile so anyone with the link can view it at /p/[slug].
 *
 * Publishing requires a session: the server assigns the public URL and records
 * the owner, so an anonymous visitor can never write to the database. The
 * payload is validated with Zod before it touches the database, and the
 * database itself is the authority on ownership.
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
      "Add DATABASE_URL to a local .env file (see .env.example) and restart the dev server. Profiles are still saved as local drafts meanwhile.",
    );
  }

  const session = await getSession();
  if (!session) {
    return error(
      401,
      "UNAUTHENTICATED",
      "Sign in to publish your profile.",
      "Use a GitHub or Google account in the editor's Share panel. Anonymous drafts stay saved in this browser.",
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

  const profile = parsed.data as Parameters<typeof publishProfile>[0];
  const result = await publishProfile(profile, session.user.id);
  if (!result) {
    return error(
      502,
      "PUBLISH_FAILED",
      "The profile could not be written to the database.",
      "Check that DATABASE_URL points to a reachable Neon database.",
    );
  }

  return NextResponse.json({ ok: true, slug: result.slug, updated: result.updated });
}
