"use client";

import { useState } from "react";
import Image from "next/image";
import { isValidAvatarUrl, isCloudinaryPublicId } from "@/lib/profile/format";
import { avatarPictureSources, avatarRawUrl } from "@/lib/profile/avatar-delivery";
import { MonogramAvatar } from "./monogram-avatar";

/**
 * Profile photo with graceful fallback.
 *
 * Renders an optimized next/image in the app UI. Cloudinary uploads are stored
 * as public IDs and delivered as AVIF with a WebP fallback via `<picture>`, so
 * every browser gets the smallest format it can decode. Set `plain` to render a
 * raw <img> instead — required inside the PNG export node, where html-to-image
 * inlines the bytes and next/image's loader would not be captured.
 */
export function ProfileAvatar({
  name,
  src,
  size,
  radius,
  className,
  style,
  plain = false,
  priority = false,
}: {
  name: string;
  src: string;
  size: number;
  radius?: number;
  className?: string;
  style?: React.CSSProperties;
  plain?: boolean;
  priority?: boolean;
}) {
  // Tracks the failure against the URL that caused it, so changing `src`
  // automatically clears the fallback without an effect.
  const [failure, setFailure] = useState<{ src: string } | null>(null);
  const errored = failure?.src === src;
  const usable = (isValidAvatarUrl(src) || isCloudinaryPublicId(src)) && !errored;

  if (!usable) {
    return (
      <MonogramAvatar
        name={name}
        size={size}
        radius={radius}
        className={className}
        style={style}
      />
    );
  }

  if (plain) {
    // Export surfaces: html-to-image inlines this <img>'s bytes, so it must be
    // a single concrete URL with no <picture>/<source> wrapper. A <source>
    // would keep pointing at a remote URL the serialized SVG cannot load.
    // The raw URL serves the stored asset (already 512px face-cropped at
    // upload) in its original format — deterministic for both the browser
    // and the rasterizer, unlike the derived WebP/AVIF delivery URLs.
    // Deliberately a literal scheme check, not isValidAvatarUrl(): that helper
    // accepts bare Cloudinary public IDs (it treats scheme-less values as
    // domains), which would emit a relative <img src> that 404s and trips the
    // monogram fallback.
    const resolved = /^https?:\/\//i.test(src.trim()) ? src : avatarRawUrl(src);
    return (
      <img
        src={resolved}
        alt={name}
        width={size}
        height={size}
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
        onError={() => setFailure({ src })}
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          objectFit: "cover",
          display: "block",
        }}
      />
    );
  }

  const sources = avatarPictureSources(src);
  return (
    <picture>
      {sources.map((source) => (
        <source key={source.type} srcSet={source.srcSet} type={source.type} />
      ))}
      <Image
        src={sources[sources.length - 1].srcSet}
        alt={name}
        width={size}
        height={size}
        priority={priority}
        onError={() => setFailure({ src })}
        unoptimized
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          objectFit: "cover",
          display: "block",
        }}
      />
    </picture>
  );
}
