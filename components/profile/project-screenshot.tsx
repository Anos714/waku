"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * A project's screenshot thumbnail.
 *
 * Client-side only so a failed download can unmount itself: the card falls
 * back to the text-only layout instead of showing a broken image. The parent
 * (a server component) only renders this when `safeExternalUrl` approved the
 * URL, so reaching here means the scheme was safe — this guards just the
 * network failure case.
 */
export function ProjectScreenshot({ src, title }: { src: string; title: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    <div
      className="relative aspect-video w-full"
      style={{ background: "var(--pt-bg-2)" }}
    >
      <Image
        src={src}
        alt={title ? `${title} — project screenshot` : "Project screenshot"}
        fill
        sizes="(max-width: 768px) 100vw, 600px"
        loading="lazy"
        onError={() => setFailed(true)}
        style={{ objectFit: "cover", display: "block" }}
      />
    </div>
  );
}
