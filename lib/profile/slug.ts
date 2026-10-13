import { customAlphabet } from "nanoid";

/**
 * Server-side generation of a profile's public URL.
 *
 * Users never pick a slug: the server derives a readable prefix from the
 * profile name and appends a random suffix, so URLs are friendly (`/p/ada-lovelace-7f3k2x`)
 * and can never collide or be squatted. A name with no usable characters falls
 * back to `profile`, and the prefix is capped so the whole slug stays short.
 */

const MAX_PREFIX = 40;

// Lowercase letters and digits only, so the suffix never introduces a character
// that needs URL encoding (nanoid's default alphabet includes `_`). 36^6 ≈ 2.2
// billion possible suffixes, and publishing retries on collision anyway.
const generateSuffix = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 6);

/**
 * Kebab-cases arbitrary text: accents folded to ASCII, split on anything that
 * is not a letter or digit, joined with hyphens. Returns an empty string when
 * nothing usable survives (e.g. emoji or CJK-only names).
 */
export function kebabCase(value: string): string {
  const normalized = value
    .normalize("NFKD")
    // Strip combining marks left over from the fold, so "café" → "cafe".
    .replace(/[\u0300-\u036f]/g, "");

  return normalized
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .join("-");
}

/**
 * Builds a candidate slug for a profile name. The result is unique by
 * construction thanks to the suffix; callers that need a *guaranteed* unused
 * slug (publishing) retry on collision at the data layer.
 */
export function generateProfileSlug(name: string): string {
  // Trailing hyphens are trimmed before the suffix is appended, otherwise a
  // prefix that lands exactly on a word boundary yields "…-name--a1b2c3".
  const prefix = kebabCase(name).slice(0, MAX_PREFIX).replace(/-+$/, "") || "profile";
  return `${prefix}-${generateSuffix()}`;
}
