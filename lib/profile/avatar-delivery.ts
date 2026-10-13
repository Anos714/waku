"use client";

import { getCldImageUrl } from "next-cloudinary";

/**
 * Cloudinary delivery URLs for an uploaded profile photo.
 *
 * The upload route stores a bare public ID; next-cloudinary turns it into a
 * signed transformation URL at render time. AVIF is requested first and WebP
 * as a fallback, so every browser gets the smallest format it can decode.
 */

const TRANSFORM = {
  width: 512,
  height: 512,
  crop: "thumb" as const,
  gravity: "face" as const,
  quality: "auto",
};

const config = {
  cloud: { cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "" },
};

/** AVIF — the modern default; browsers that can't decode it fall back below. */
export function avatarAvifUrl(publicId: string): string {
  return getCldImageUrl({ src: publicId, format: "avif", ...TRANSFORM }, config);
}

/** WebP — the universal fallback when AVIF is unavailable. */
export function avatarWebpUrl(publicId: string): string {
  return getCldImageUrl({ src: publicId, format: "webp", ...TRANSFORM }, config);
}

/**
 * The stored asset verbatim, with no delivery-time transformation.
 *
 * The upload route already applies `w_512,c_thumb,g_face,q_auto` on the way in,
 * so this serves that same optimized image in its original format (JPEG). It is
 * the most compatible shape — one deterministic URL any browser `<img>` can
 * decode and html-to-image can fetch and inline — which is why the export
 * surfaces (`plain` mode) use it in preference to the derived WebP/AVIF URLs.
 */
export function avatarRawUrl(publicId: string): string {
  return `https://res.cloudinary.com/${config.cloud.cloudName}/image/upload/${publicId}`;
}

/**
 * A `<picture>` source list for an avatar: AVIF first, then WebP. Pass a plain
 * URL straight through as a single source — nothing to convert there.
 */
export function avatarPictureSources(src: string): { srcSet: string; type: string }[] {
  if (isPlainUrl(src)) {
    return [{ srcSet: src, type: "image/*" }];
  }
  return [
    { srcSet: avatarAvifUrl(src), type: "image/avif" },
    { srcSet: avatarWebpUrl(src), type: "image/webp" },
  ];
}

function isPlainUrl(src: string): boolean {
  return /^https?:\/\//i.test(src.trim());
}
