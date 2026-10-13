import type { Profile, SocialLink } from "@/types";
import { safeExternalUrl } from "@/lib/validation/profile";

/**
 * Relative path for a profile slug. Pure and SSR-safe — use this for links.
 */
export function profilePath(slug: string): string {
  return `/p/${encodeURIComponent(slug)}`;
}

/**
 * @deprecated Use {@link profilePath} or `useProfileUrl` from
 * `lib/profile/use-profile-url` instead. Kept only for callers that must build
 * an absolute URL synchronously in a browser-only code path.
 */
export function buildProfileUrl(slug: string): string {
  if (typeof window === "undefined") {
    return profilePath(slug);
  }
  return `${window.location.origin}${profilePath(slug)}`;
}

export function initials(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) return "—";
  const parts = cleaned.split(/\s+/).filter(Boolean).slice(0, 2);
  return parts
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

export function parseListInput(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 24);
}

export function visibleSocials(profile: Profile): SocialLink[] {
  return profile.socials.filter((link) => link.visible && link.url.trim().length > 0);
}

export function usableSocials(profile: Profile): SocialLink[] {
  return profile.socials
    .filter((link) => link.visible && safeExternalUrl(link.url) !== null)
    .map((link) => ({ ...link, url: safeExternalUrl(link.url) as string }));
}

export function displayHandle(link: SocialLink): string {
  if (link.label.trim()) return link.label.trim();
  const url = safeExternalUrl(link.url);
  if (!url) return link.url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "mailto:") return parsed.pathname;
    return parsed.hostname.replace(/^www\./, "") + parsed.pathname;
  } catch {
    return url;
  }
}

export function clampText(text: string, max: number): string {
  if (text.length <= max) return text;
  const slice = text.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(" ");
  return `${slice.slice(0, lastSpace > 0 ? lastSpace : max - 1)}…`;
}

export function isValidAvatarUrl(url: string): boolean {
  if (!url) return false;
  const safe = safeExternalUrl(url);
  if (!safe) return false;
  return /^https?:/i.test(safe);
}

const CLOUDINARY_PUBLIC_ID = /^[a-zA-Z0-9_\-]+(?:\/[a-zA-Z0-9_\-]+)*$/;

/**
 * True for the bare Cloudinary identifiers returned by the upload route.
 * Public IDs never carry a scheme, which is how they're told apart from URLs.
 */
export function isCloudinaryPublicId(value: string): boolean {
  return CLOUDINARY_PUBLIC_ID.test(value.trim());
}

/**
 * Recognises both delivery shapes the editor stores: Cloudinary public IDs and
 * ordinary image URLs (including pasted ones).
 */
export function hasAvatar(value: string): boolean {
  return isValidAvatarUrl(value) || isCloudinaryPublicId(value);
}
