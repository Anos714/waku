"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * A project's screenshot as a small 64px thumbnail beside the text.
 *
 * Client-side only so a failed download can unmount itself: the card falls
 * back to the text-only layout instead of showing a broken image. The parent
 * (a server component) only renders this when the stored value resolved to a
 * real URL, so reaching here means the value was usable — this guards just
 * the network failure case.
 */
export function ProjectScreenshot({ src, title }: { src: string; title: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    <Image
      src={src}
      alt={title ? `${title} — project screenshot` : "Project screenshot"}
      width={128}
      height={128}
      loading="lazy"
      onError={() => setFailed(true)}
      style={{
        width: 64,
        height: 64,
        borderRadius: "calc(var(--pt-radius) * 0.6)",
        border: "1px solid var(--pt-line)",
        objectFit: "cover",
        display: "block",
      }}
    />
  );
}
