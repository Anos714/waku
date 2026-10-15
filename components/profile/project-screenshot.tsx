"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * A project's screenshot: full-width 16:10 banner stacked above the text on
 * mobile (where a side-by-side row would squeeze the text into an unreadable
 * sliver), settling into a 144px landscape thumb beside the text on sm+.
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
    <span
      className="project-thumb relative block aspect-[16/10] w-full shrink-0 overflow-hidden sm:w-36"
      style={{
        borderRadius: "calc(var(--pt-radius) * 0.7)",
        border: "1px solid var(--pt-line)",
        background: "var(--pt-bg-2)",
      }}
    >
      <Image
        src={src}
        alt={title ? `${title} screenshot` : "Project screenshot"}
        fill
        sizes="(max-width: 640px) 100vw, 144px"
        loading="lazy"
        onError={() => setFailed(true)}
        className="transition-transform duration-300 group-hover:scale-[1.04]"
        style={{ objectFit: "cover", display: "block" }}
      />
    </span>
  );
}
