import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { headers } from "next/headers";
import { db, ensureSchema, hasDatabase } from "@/lib/db";
import { authSchema } from "@/lib/db/schema";

/**
 * Better Auth for Waku.
 *
 * Sessions are cookie-based and stored in the same Neon database as the
 * published profiles, so the only stateful dependency is DATABASE_URL. Sign-in
 * is social-only (GitHub and Google) — there is no email/password flow to
 * maintain, and no user-visible registration form.
 *
 * Providers are wired up only when their credentials are present, so a fresh
 * checkout runs without OAuth secrets and reports the gap through /api/config
 * instead of failing mid-redirect.
 */

const githubClientId = process.env.GITHUB_CLIENT_ID?.trim();
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET?.trim();
const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

function hasGithub(): boolean {
  return Boolean(githubClientId && githubClientSecret);
}

function hasGoogle(): boolean {
  return Boolean(googleClientId && googleClientSecret);
}

/** Which sign-in providers this server can actually use, for the editor UI. */
export function socialProviderAvailability(): {
  github: boolean;
  google: boolean;
} {
  return { github: hasGithub(), google: hasGoogle() };
}

// Better Auth probes the database schema once while initialising. The tables
// may not exist yet on a fresh database, so make sure they do first — a missed
// probe is only logged, but a warm database keeps startup honest.
if (hasDatabase()) void ensureSchema();

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET?.trim() || undefined,
  baseURL: process.env.BETTER_AUTH_URL?.trim() || undefined,
  database: db
    ? drizzleAdapter(db, {
        provider: "pg",
        schema: authSchema,
        // Neon's serverless HTTP driver cannot run transactions; Better Auth
        // writes the user, account and session rows sequentially instead.
        transaction: false,
      })
    : undefined,
  socialProviders: {
    ...(hasGithub()
      ? { github: { clientId: githubClientId!, clientSecret: githubClientSecret! } }
      : {}),
    ...(hasGoogle()
      ? { google: { clientId: googleClientId!, clientSecret: googleClientSecret! } }
      : {}),
  },
});

export type Session = typeof auth.$Infer.Session;

/**
 * The session for the current request, or null when the visitor is anonymous.
 * Never throws — a broken auth probe must not take down publishing or the
 * public pages, and callers treat null as "not signed in".
 */
export async function getSession(): Promise<Session | null> {
  if (!hasDatabase()) return null;

  try {
    return await auth.api.getSession({ headers: await headers() });
  } catch {
    return null;
  }
}
