import { auth } from "@/auth";
import { ensureSchema } from "@/lib/db";

/**
 * Better Auth's mounted handler. Every auth request — social sign-in, the OAuth
 * callback, session reads, sign-out — flows through here. The schema is ensured
 * first so the handler never races a fresh database.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await ensureSchema();
  return auth.handler(request);
}

export async function POST(request: Request) {
  await ensureSchema();
  return auth.handler(request);
}
