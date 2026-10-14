import { isCloudinaryPublicId } from "./format";
import { safeExternalUrl } from "@/lib/validation/profile";

/**
 * Resolves a project's stored `imageUrl` to a renderable image URL.
 *
 * The editor stores either a pasted https URL or a bare Cloudinary public ID
 * (same dual shape as the avatar flow). Plain URLs pass through unchanged;
 * public IDs become a small Cloudinary delivery URL. Returns null when there
 * is nothing usable — the card then renders text-only.
 */
export function resolveProjectImageUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    return safeExternalUrl(trimmed);
  }

  if (isCloudinaryPublicId(trimmed)) {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
    if (!cloudName) return null;
    // Small square crop: the card only ever shows a 64px thumbnail.
    const publicId = trimmed.split("/").map(encodeURIComponent).join("/");
    return `https://res.cloudinary.com/${cloudName}/image/upload/w_256,c_fill,q_auto/${publicId}`;
  }

  return null;
}

/** True when the stored value resolves to something renderable. */
export function hasProjectImage(value: unknown): boolean {
  return resolveProjectImageUrl(value) !== null;
}
