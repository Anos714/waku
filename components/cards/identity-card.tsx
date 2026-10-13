"use client";

import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { renderCardLayout } from "./card-layouts";
import { CARD_DESIGN_SIZES } from "@/lib/cards/export";
import { useScaledSurface } from "@/lib/cards/use-scaled-surface";
import { resolveTheme } from "@/lib/themes";
import type { Profile } from "@/types";

/**
 * Identity card at fixed design dimensions, scaled to fit its container.
 *
 * The exported node is `surfaceRef.current` — it always renders at
 * CARD_DESIGN_SIZES pixels, so PNG output is sharp and consistent regardless
 * of the on-screen preview width.
 */
export function IdentityCard({
  profile,
  qrDataUrl,
  profileUrl,
  surfaceRef,
  className,
}: {
  profile: Profile;
  qrDataUrl: string | null;
  profileUrl: string;
  surfaceRef: React.RefObject<HTMLDivElement | null>;
  className?: string;
}) {
  const resolved = resolveTheme(profile.theme);
  const size = CARD_DESIGN_SIZES[profile.cardLayout] ?? CARD_DESIGN_SIZES.classic;
  const { containerRef, scale, measured, aspectRatio } = useScaledSurface(
    size.width,
    size.height,
  );

  return (
    <div
      ref={containerRef}
      className={className}
      // Relative + aspect-ratio reserves the scaled box; the surface is
      // absolutely positioned so its unscaled 1200×630 height can't inflate
      // this container (a transform scales visually, not in layout).
      style={{ position: "relative", width: "100%", aspectRatio }}
    >
      <div
        ref={surfaceRef}
        className="pt-vars"
        style={{
          ...resolved.tokens,
          position: "absolute",
          top: 0,
          left: 0,
          width: size.width,
          height: size.height,
          transform: measured ? `scale(${scale})` : "scale(0)",
          transformOrigin: "top left",
          background: "var(--pt-bg)",
          color: "var(--pt-ink)",
          fontFamily: "var(--pt-font-body)",
          borderRadius: "var(--pt-radius)",
          overflow: "hidden",
          boxShadow: "var(--shadow-lg)",
          border: "1px solid var(--pt-line)",
        }}
      >
        {renderCardLayout({ profile, theme: resolved, qrDataUrl, profileUrl })}
      </div>
    </div>
  );
}

/** Design dimensions for the current layout — needed by exporters. */
export function cardDesignSize(profile: Profile) {
  return CARD_DESIGN_SIZES[profile.cardLayout] ?? CARD_DESIGN_SIZES.classic;
}

export { ProfileAvatar };
