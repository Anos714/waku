import { DEMO_SLUG, type Profile } from "@/types";
import { DEMO_PROFILE } from "./demo";
import { getPublishedProfile } from "@/lib/db";

/**
 * Profile data-access layer.
 *
 * Published profiles live in Neon Postgres and are read here on the server, so
 * any visitor with the link sees the same page. The bundled demo profile is
 * deliberately *not* served here: the editor's draft lives in localStorage,
 * which the server cannot read, so /p/<demo-slug> is resolved in the browser by
 * LocalProfileResolver — landing on the author's draft when one exists and on
 * the bundled demo for everyone else.
 */

export async function getProfileBySlug(slug: string): Promise<Profile | null> {
  const normalized = slug.toLowerCase().trim();
  // An empty slug never matches a row; skip the round-trip rather than
  // depending on the database to return nothing for a nonsense query.
  if (!normalized) return null;
  return await getPublishedProfile(normalized);
}

export async function getDemoProfile(): Promise<Profile> {
  return structuredClone(DEMO_PROFILE);
}

export function isDemoSlug(slug: string): boolean {
  return slug.toLowerCase().trim() === DEMO_SLUG;
}
