export const GITHUB_REPO_URL = "https://github.com/Anos714/waku";

/**
 * The address legal pages, the contact page and support prompts all point at.
 * One constant so a change of inbox does not become a multi-file find-and-replace.
 */
export const CONTACT_EMAIL = "sainrahul374@gmail.com";

/**
 * Builds a `mailto:` link. Values are passed through `encodeURIComponent`
 * (spaces as `%20`, not `+`) so subject and body survive every mail client.
 */
export function mailto(email: string, subject?: string, body?: string): string {
  const parts: string[] = [];
  if (subject) parts.push(`subject=${encodeURIComponent(subject)}`);
  if (body) parts.push(`body=${encodeURIComponent(body)}`);
  return `mailto:${email}${parts.length > 0 ? `?${parts.join("&")}` : ""}`;
}

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

/**
 * The host shown wherever the UI illustrates a public link — the hero's
 * "publish at a link you own" copy, the showcase cards, the marquee chips and
 * the editor's share panel.
 *
 * Derived from the deploy itself (`NEXT_PUBLIC_SITE_URL`, then Vercel's
 * automatic `NEXT_PUBLIC_VERCEL_URL`) so the link a visitor reads can never
 * disagree with the one in the sitemap or the OG tags. Both Vercel values are
 * protocol-less, so a scheme is added before parsing; anything unparsable
 * falls back to the live deploy rather than a localhost string a visitor could
 * never open.
 */
const DEFAULT_PUBLIC_HOST = "wakucards.vercel.app";

export function publicHost(): string {
  const raw = (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    ""
  ).trim();
  if (!raw) return DEFAULT_PUBLIC_HOST;
  try {
    return new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).host;
  } catch {
    return DEFAULT_PUBLIC_HOST;
  }
}
