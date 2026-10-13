export const GITHUB_REPO_URL = "https://github.com/Anos714/waku";

/**
 * The public origin of this instance, used as the metadata base so relative
 * OG/Twitter/manifest URLs resolve to absolute ones for crawlers.
 *
 * Driven by `NEXT_PUBLIC_SITE_URL` in production. A raw env value is never
 * passed to `new URL()` unscreened — an invalid string would throw in
 * `app/layout.tsx` and break the whole app — so anything unparsable falls back
 * to the dev origin instead.
 */
const DEFAULT_SITE_URL = "http://localhost:3000";

export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return DEFAULT_SITE_URL;
  try {
    return new URL(raw).toString().replace(/\/$/, "");
  } catch {
    return DEFAULT_SITE_URL;
  }
}
