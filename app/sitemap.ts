import type { MetadataRoute } from "next";
import { listRecentPublished } from "@/lib/db";
import { siteUrl } from "@/lib/site";
import { DEMO_SLUG } from "@/types";

/**
 * Sitemap for crawlers.
 *
 * The static routes are the app's own pages; every published profile is a
 * public URL worth indexing too. The demo profile (`/p/ada`) is bundled rather
 * than stored, so it is listed unconditionally — without it the sitemap would
 * miss the one profile a fresh install guarantees.
 */

// Only routes crawlers may index belong here; `/create` is disallowed in
// robots.ts, so listing it would contradict that. The legal pages, contact and
// rate pages are public and worth indexing.
const STATIC_ROUTES = ["", "/contact", "/rate", "/legal/privacy-policy", "/legal/cookie-policy", "/legal/terms"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: route === "" ? 1 : 0.7,
  }));

  const profiles = await listRecentPublished(500);
  const slugs = new Set(profiles.map((profile) => profile.slug));

  const profileEntries: MetadataRoute.Sitemap = profiles.map((profile) => ({
    url: `${base}/p/${encodeURIComponent(profile.slug)}`,
    // `updated_at` is the row's own clock, so it reflects the last edit.
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // The bundled demo is resolved client-side rather than stored as a row, so
  // it never appears in `listRecentPublished` — add it explicitly or the one
  // profile every install guarantees would be missing.
  if (!slugs.has(DEMO_SLUG)) {
    profileEntries.push({
      url: `${base}/p/${DEMO_SLUG}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  return [...staticEntries, ...profileEntries];
}
