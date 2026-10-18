import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { nanoid } from "nanoid";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { profileSchema } from "@/lib/validation/profile";
import { generateProfileSlug } from "@/lib/profile/slug";
import { computeRank } from "@/lib/rank/score";
import type { Profile } from "@/types";
import { account, githubStats, profiles, ratings, session, user, verification } from "./db/schema";

/**
 * Server-only data access for published profiles and Better Auth, backed by
 * Neon Postgres via Drizzle ORM.
 *
 * The client never sees DATABASE_URL — every read/write goes through this
 * module from a Server Component or Route Handler. When DATABASE_URL is absent
 * the module reports a configuration error rather than throwing at import time,
 * so the rest of the app keeps working in local-only mode.
 */

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export { profiles, ratings, user, session, account, verification, githubStats };

// Drizzle's query builder only accepts a live client, so the connection is
// created lazily; callers must check hasDatabase() first.
export const db = hasDatabase()
  ? drizzle(neon(process.env.DATABASE_URL as string))
  : null;

export type Database = NonNullable<typeof db>;

/**
 * Creates every table this app needs, and is safe to call on every request —
 * each statement is a no-op once the schema exists. New columns are added with
 * ADD COLUMN IF NOT EXISTS so an existing database is upgraded in place without
 * a migration step.
 *
 * Statements run one at a time: Neon's serverless driver prepares each query,
 * and Postgres rejects several commands in a single prepared statement.
 *
 * Ownership: migrations (`pnpm db:migrate`) own the production schema, so this
 * fallback only runs outside production. The statements are purely additive,
 * but a migration that renames or retypes a column would otherwise race this
 * path and re-create the old shape. A dev or preview database still self-heals
 * on first request without a manual migration step.
 */
const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS profiles (
     slug text PRIMARY KEY,
     data jsonb NOT NULL,
     owner_id text,
     published_at timestamptz,
     updated_at timestamptz NOT NULL DEFAULT now()
   )`,
  `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS owner_id text`,
  `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS published_at timestamptz`,
  `CREATE INDEX IF NOT EXISTS profiles_owner_id_idx ON profiles (owner_id)`,
  `CREATE TABLE IF NOT EXISTS "user" (
     id text PRIMARY KEY,
     name text NOT NULL,
     email text NOT NULL UNIQUE,
     email_verified boolean NOT NULL DEFAULT false,
     image text,
     created_at timestamp NOT NULL DEFAULT now(),
     updated_at timestamp NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS "session" (
     id text PRIMARY KEY,
     expires_at timestamp NOT NULL,
     token text NOT NULL UNIQUE,
     created_at timestamp NOT NULL DEFAULT now(),
     updated_at timestamp NOT NULL DEFAULT now(),
     ip_address text,
     user_agent text,
     user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
   )`,
  `CREATE INDEX IF NOT EXISTS session_user_id_idx ON "session" (user_id)`,
  `CREATE TABLE IF NOT EXISTS "account" (
     id text PRIMARY KEY,
     account_id text NOT NULL,
     provider_id text NOT NULL,
     user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
     access_token text,
     refresh_token text,
     id_token text,
     access_token_expires_at timestamp,
     refresh_token_expires_at timestamp,
     scope text,
     password text,
     created_at timestamp NOT NULL DEFAULT now(),
     updated_at timestamp NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS account_user_id_idx ON "account" (user_id)`,
  `CREATE TABLE IF NOT EXISTS "verification" (
     id text PRIMARY KEY,
     identifier text NOT NULL,
     value text NOT NULL,
     expires_at timestamp NOT NULL,
     created_at timestamp NOT NULL DEFAULT now(),
     updated_at timestamp NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS "ratings" (
     id text PRIMARY KEY,
     author_name text NOT NULL,
     rating integer NOT NULL,
     message text,
     approved boolean NOT NULL DEFAULT true,
     fingerprint text NOT NULL,
     created_at timestamptz NOT NULL DEFAULT now(),
     CONSTRAINT ratings_fingerprint_unique UNIQUE (fingerprint)
   )`,
  `CREATE INDEX IF NOT EXISTS ratings_created_at_idx ON ratings (created_at)`,
  `CREATE TABLE IF NOT EXISTS "github_stats" (
     user_id text PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
     login text NOT NULL,
     followers integer NOT NULL DEFAULT 0,
     public_repos integer NOT NULL DEFAULT 0,
     total_stars integer NOT NULL DEFAULT 0,
     repo_count integer NOT NULL DEFAULT 0,
     top_languages jsonb NOT NULL DEFAULT '[]',
     score integer NOT NULL DEFAULT 0,
     updated_at timestamptz NOT NULL DEFAULT now()
   )`,
  `ALTER TABLE "github_stats" ADD COLUMN IF NOT EXISTS score integer NOT NULL DEFAULT 0`,
  `CREATE INDEX IF NOT EXISTS github_stats_total_stars_idx ON "github_stats" (total_stars)`,
  `CREATE INDEX IF NOT EXISTS github_stats_score_idx ON "github_stats" (score)`,
];

// The schema only needs creating once per process — the tables persist in the
// database afterwards — so the work is memoised instead of repeating on every
// request. A failure clears the memo so the next request tries again.
let schemaPromise: Promise<void> | null = null;

export async function ensureSchema(): Promise<void> {
  if (!db) return;
  // Production databases are shaped exclusively by `pnpm db:migrate`.
  if (process.env.NODE_ENV === "production") return;
  if (!schemaPromise) {
    schemaPromise = (async () => {
      for (const statement of SCHEMA_STATEMENTS) {
        await db!.execute(statement);
      }
    })();
    schemaPromise.catch(() => {
      schemaPromise = null;
    });
  }
  return schemaPromise;
}

/**
 * Reads a published profile by slug. Returns null when the database is not
 * configured, the slug is unknown, or the stored row fails validation — a
 * corrupt row must never break the public page.
 */
export async function getPublishedProfile(slug: string): Promise<Profile | null> {
  if (!db) return null;

  try {
    await ensureSchema();
    const rows = await db
      .select({ data: profiles.data })
      .from(profiles)
      .where(eq(profiles.slug, slug.toLowerCase()))
      .limit(1);

    if (rows.length === 0) return null;

    const result = profileSchema.safeParse(rows[0].data);
    if (!result.success) return null;

    return { ...result.data } as Profile;
  } catch {
    return null;
  }
}

/**
 * The newest published profiles, for the landing page's showcase strip.
 *
 * Only rows that validate are returned, sorted by publication date. The
 * bundled demo is never a row here — it is resolved client-side — so the
 * strip only ever contains real publishes. Callers must handle an empty list
 * by hiding the section; an empty grid is worse than no grid.
 */
export async function listRecentPublished(limit = 8): Promise<Profile[]> {
  if (!db) return [];

  try {
    await ensureSchema();

    const rows = await db
      .select({ data: profiles.data })
      .from(profiles)
      .orderBy(desc(profiles.publishedAt))
      .limit(limit);

    const parsed: Profile[] = [];
    for (const row of rows) {
      const result = profileSchema.safeParse(row.data);
      if (result.success) parsed.push({ ...result.data } as Profile);
    }

    return parsed;
  } catch {
    return [];
  }
}

/**
 * How many profiles are live, for the landing page's stat line. Rendered only
 * when the database is configured and the count is above zero — a "0 profiles"
 * line would be worse than nothing.
 */
export async function countPublishedProfiles(): Promise<number> {
  if (!db) return 0;

  try {
    await ensureSchema();

    const rows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(profiles);

    return rows[0]?.count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Mints a slug nobody has published yet. Collisions on the random suffix are
 * astronomically unlikely; the retry loop exists so a name collision with an
 * existing page still yields a unique URL.
 */
async function generateUnusedSlug(name: string): Promise<string> {
  if (!db) return generateProfileSlug(name);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const slug = generateProfileSlug(name);
    const rows = await db
      .select({ slug: profiles.slug })
      .from(profiles)
      .where(eq(profiles.slug, slug))
      .limit(1);
    if (rows.length === 0) return slug;
  }

  return generateProfileSlug(name);
}

export interface PublishResult {
  slug: string;
  /** True when an existing page was updated in place rather than created. */
  updated: boolean;
}

/**
 * Publishes a profile for `ownerId`, returning the slug it is reachable at.
 *
 * The URL is always decided on the server, never by the client. When the
 * incoming profile already carries the slug of a page this user owns, that page
 * is updated in place so its link stays stable across edits; a slug belonging to
 * someone else (or to nobody) is never reused — a fresh page is minted instead.
 */
export async function publishProfile(
  profile: Profile,
  ownerId: string,
): Promise<PublishResult | null> {
  if (!db) return null;

  try {
    await ensureSchema();

    const candidate = profile.slug.trim().toLowerCase();

    // A draft may carry the slug of a page this user already owns — publishing
    // then updates that page so its link stays stable. Any other slug (an
    // unpublished one, the demo's "ada", or another user's page) is ignored and
    // a fresh URL is minted instead, so the server is the only authority on
    // public URLs and can never hand one to the wrong person.
    let slug: string | null = null;
    let updated = false;

    if (candidate) {
      const rows = await db
        .select({ ownerId: profiles.ownerId })
        .from(profiles)
        .where(eq(profiles.slug, candidate))
        .limit(1);

      if (rows.length > 0 && rows[0].ownerId === ownerId) {
        slug = candidate;
        updated = true;
      }
    }

    if (slug === null) slug = await generateUnusedSlug(profile.name);

    const stored: Profile = { ...profile, slug };
    const now = new Date();

    await db
      .insert(profiles)
      .values({ slug, data: stored, ownerId, publishedAt: now, updatedAt: now })
      .onConflictDoUpdate({
        target: profiles.slug,
        set: { data: stored, ownerId, publishedAt: now, updatedAt: now },
      });

    return { slug, updated };
  } catch {
    return null;
  }
}

/**
 * Claims a local draft as a user's first published page. Does nothing once the
 * user owns a profile, so it is safe to call after every sign-in. Returns the
 * slug of the user's first page and whether this call imported the draft.
 */
export async function claimDraftForUser(
  profile: Profile,
  ownerId: string,
): Promise<{ claimed: boolean; slug: string | null }> {
  if (!db) return { claimed: false, slug: null };

  try {
    await ensureSchema();

    const owned = await db
      .select({ slug: profiles.slug })
      .from(profiles)
      .where(eq(profiles.ownerId, ownerId))
      .limit(1);

    if (owned.length > 0) {
      return { claimed: false, slug: owned[0].slug };
    }

    const slug = await generateUnusedSlug(profile.name);
    const stored: Profile = { ...profile, slug };
    const now = new Date();

    await db
      .insert(profiles)
      .values({ slug, data: stored, ownerId, publishedAt: now, updatedAt: now })
      .onConflictDoUpdate({
        target: profiles.slug,
        set: { data: stored, ownerId, publishedAt: now, updatedAt: now },
      });

    return { claimed: true, slug };
  } catch {
    return { claimed: false, slug: null };
  }
}

/**
 * Lists the slugs a user has published. Used to tell the editor whether the
 * current draft is already live, and later by a profile-management view.
 */
export async function getOwnedSlugs(ownerId: string): Promise<string[]> {
  if (!db) return [];

  try {
    const rows = await db
      .select({ slug: profiles.slug })
      .from(profiles)
      .where(eq(profiles.ownerId, ownerId));
    return rows.map((row) => row.slug);
  } catch {
    return [];
  }
}

/**
 * Deletes a published page. Only the owner may unpublish their own page; when
 * `ownerId` is given the delete is scoped to it, so a forged slug from another
 * user's session can never remove someone else's profile.
 */
export async function unpublishProfile(
  slug: string,
  ownerId?: string,
): Promise<boolean> {
  if (!db) return false;

  try {
    const clause = ownerId
      ? and(eq(profiles.slug, slug.toLowerCase()), eq(profiles.ownerId, ownerId))
      : eq(profiles.slug, slug.toLowerCase());

    await db.delete(profiles).where(clause);
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------- github */

export interface GithubStatsSnapshot {
  login: string;
  followers: number;
  publicRepos: number;
  totalStars: number;
  repoCount: number;
  topLanguages: string[];
}

/**
 * The access token GitHub issued for `userId`, or null when that user has no
 * linked GitHub account. Server-only: callers must never forward this value to
 * the browser.
 */
export async function getGithubAccessToken(userId: string): Promise<string | null> {
  if (!db) return null;

  try {
    const rows = await db
      .select({ accessToken: account.accessToken })
      .from(account)
      .where(and(eq(account.userId, userId), eq(account.providerId, "github")))
      .limit(1);
    return rows[0]?.accessToken ?? null;
  } catch {
    return null;
  }
}

/**
 * Persists a GitHub stats snapshot for a user, replacing any previous one.
 * Best-effort: an import still succeeds even when this write fails, so a
 * failing leaderboard never blocks a working autofill.
 */
export async function saveGithubStats(
  userId: string,
  stats: GithubStatsSnapshot,
): Promise<boolean> {
  if (!db) return false;

  try {
    await ensureSchema();
    const now = new Date();
    const score = computeRank({
      totalStars: stats.totalStars,
      followers: stats.followers,
      publicRepos: stats.publicRepos,
      repoCount: stats.repoCount,
      topLanguages: stats.topLanguages,
    }).score;
    const values = {
      userId,
      login: stats.login,
      followers: stats.followers,
      publicRepos: stats.publicRepos,
      totalStars: stats.totalStars,
      repoCount: stats.repoCount,
      topLanguages: stats.topLanguages,
      score,
      updatedAt: now,
    };
    await db
      .insert(githubStats)
      .values(values)
      .onConflictDoUpdate({
        target: githubStats.userId,
        set: {
          login: stats.login,
          followers: stats.followers,
          publicRepos: stats.publicRepos,
          totalStars: stats.totalStars,
          repoCount: stats.repoCount,
          topLanguages: stats.topLanguages,
          score,
          updatedAt: now,
        },
      });
    return true;
  } catch {
    return false;
  }
}

export interface LeaderboardEntry {
  userId: string;
  login: string;
  name: string;
  image: string | null;
  score: number;
  totalStars: number;
  followers: number;
  publicRepos: number;
  /** The user's newest published page, when they have one. */
  slug: string | null;
}

/**
 * The public leaderboard: every account with a stored GitHub snapshot, ranked by
 * score then stars. Only users who connected GitHub have a snapshot, so this is
 * exactly the set that has a public signal to rank on.
 *
 * Returns an empty list when the database is unavailable — callers render an
 * empty state rather than a broken grid.
 */
export async function listLeaderboard(limit = 25): Promise<LeaderboardEntry[]> {
  if (!db) return [];

  try {
    await ensureSchema();

    const rows = await db
      .select({
        userId: githubStats.userId,
        login: githubStats.login,
        score: githubStats.score,
        totalStars: githubStats.totalStars,
        followers: githubStats.followers,
        publicRepos: githubStats.publicRepos,
        name: user.name,
        image: user.image,
      })
      .from(githubStats)
      .innerJoin(user, eq(user.id, githubStats.userId))
      .orderBy(desc(githubStats.score), desc(githubStats.totalStars))
      .limit(limit);

    if (rows.length === 0) return [];

    // A user may own several pages; the leaderboard links to the newest one.
    const slugRows = await db
      .select({
        ownerId: profiles.ownerId,
        slug: profiles.slug,
        publishedAt: profiles.publishedAt,
      })
      .from(profiles)
      .where(
        inArray(
          profiles.ownerId,
          rows.map((row) => row.userId),
        ),
      );

    const newestSlug = new Map<string, { slug: string; at: number }>();
    for (const row of slugRows) {
      if (!row.ownerId) continue;
      const at = row.publishedAt ? row.publishedAt.getTime() : 0;
      const current = newestSlug.get(row.ownerId);
      if (!current || at > current.at) {
        newestSlug.set(row.ownerId, { slug: row.slug, at });
      }
    }

    return rows.map((row) => ({
      ...row,
      slug: newestSlug.get(row.userId)?.slug ?? null,
    }));
  } catch {
    return [];
  }
}

/* ------------------------------------------------------------------ ratings */

export interface Rating {
  id: string;
  authorName: string;
  rating: number;
  message: string | null;
  createdAt: Date;
}

export interface RatingStats {
  average: number;
  count: number;
}

/**
 * Saves a visitor rating. The fingerprint is unique, so a second submission
 * from the same client revises the first rather than stacking a duplicate —
 * the row keeps its original id and timestamp. Returns the stored rating, or
 * null when the database is unavailable.
 */
export async function saveRating(input: {
  authorName: string;
  rating: number;
  message: string | null;
  fingerprint: string;
}): Promise<Rating | null> {
  if (!db) return null;

  try {
    await ensureSchema();

    const id = nanoid();
    const rows = await db
      .insert(ratings)
      .values({
        id,
        authorName: input.authorName,
        rating: input.rating,
        message: input.message,
        fingerprint: input.fingerprint,
      })
      .onConflictDoUpdate({
        target: ratings.fingerprint,
        set: {
          authorName: input.authorName,
          rating: input.rating,
          message: input.message,
        },
      })
      .returning({
        id: ratings.id,
        authorName: ratings.authorName,
        rating: ratings.rating,
        message: ratings.message,
        createdAt: ratings.createdAt,
      });

    return rows[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * The most recent approved ratings, newest first — for the `/rate` page's wall
 * and the landing page's social-proof strip. An empty list is the caller's cue
 * to hide the section rather than render a sad empty grid.
 */
export async function listApprovedRatings(limit = 12): Promise<Rating[]> {
  if (!db) return [];

  try {
    await ensureSchema();

    const rows = await db
      .select({
        id: ratings.id,
        authorName: ratings.authorName,
        rating: ratings.rating,
        message: ratings.message,
        createdAt: ratings.createdAt,
      })
      .from(ratings)
      .where(eq(ratings.approved, true))
      .orderBy(desc(ratings.createdAt))
      .limit(limit);

    return rows;
  } catch {
    return [];
  }
}

/**
 * Average score and count over approved ratings, for the star summary on the
 * `/rate` page and a stat line on the landing page. Renders nothing meaningful
 * at zero, so callers gate on `count > 0`.
 */
export async function getRatingStats(): Promise<RatingStats> {
  if (!db) return { average: 0, count: 0 };

  try {
    await ensureSchema();

    const rows = await db
      .select({
        average: sql<number>`coalesce(avg(${ratings.rating}), 0)::numeric(3,2)`,
        count: sql<number>`count(*)::int`,
      })
      .from(ratings)
      .where(eq(ratings.approved, true));

    return {
      average: Number(rows[0]?.average ?? 0),
      count: rows[0]?.count ?? 0,
    };
  } catch {
    return { average: 0, count: 0 };
  }
}
