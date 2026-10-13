"use client";

import { useCallback, useRef, useState } from "react";
import { ProfileView } from "@/components/profile/profile-view";
import { IdentityCard } from "@/components/cards/identity-card";
import { useQrCode } from "@/lib/profile/qr";
import { DEMO_PROFILE } from "@/lib/profile/demo";
import { useProfileUrl } from "@/lib/profile/use-profile-url";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import type { ThemeSettings } from "@/types";

const TILT_STRENGTH = 6; // degrees at the edges
const SPOT_SIZE = 260; // px

/**
 * The hero composition: the live profile renderer and the identity card,
 * rendered from the same bundled demo data so this is the real product
 * surface, not a picture of one.
 *
 * `theme` is driven by the theme switcher — the same `resolveTheme()` path as
 * the editor, so the hero visibly becomes different products. The window
 * follows the cursor (a small parallax tilt plus a soft radial spotlight) and
 * both are dropped entirely under `prefers-reduced-motion`.
 */
export function HeroPreview({ theme }: { theme: ThemeSettings }) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [spot, setSpot] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  });
  const reduced = usePrefersReducedMotion();

  const profileUrl = useProfileUrl(DEMO_PROFILE.slug);
  const qrDataUrl = useQrCode(profileUrl, 480);

  const profile = { ...DEMO_PROFILE, theme, showQr: true };

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (reduced || !frameRef.current) return;

      const rect = frameRef.current.getBoundingClientRect();
      const dx = (event.clientX - rect.left) / rect.width - 0.5;
      const dy = (event.clientY - rect.top) / rect.height - 0.5;

      const nextTilt = { x: -dy * TILT_STRENGTH, y: dx * TILT_STRENGTH };
      const nextSpot = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        visible: true,
      };

      // Pointermove fires far more often than the tilt actually changes
      // (sub-pixel motion, a resting cursor). Returning the same reference
      // lets React skip re-rendering the whole profile + card subtree, which
      // would otherwise happen on every event.
      setTilt((current) =>
        current.x === nextTilt.x && current.y === nextTilt.y ? current : nextTilt,
      );
      setSpot((current) =>
        current.x === nextSpot.x &&
        current.y === nextSpot.y &&
        current.visible === nextSpot.visible
          ? current
          : nextSpot,
      );
    },
    [reduced],
  );

  const onPointerLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    setSpot((current) => ({ ...current, visible: false }));
  }, []);

  return (
    <div className="relative pb-14">
      <div
        className="pointer-events-none absolute -inset-6 -z-10 rounded-3xl bg-grid opacity-50 [mask-image:radial-gradient(closest-side,black,transparent)]"
        aria-hidden="true"
      />

      <div
        ref={frameRef}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        className="relative overflow-hidden rounded-2xl border border-line-2 bg-surface shadow-card-lg transition-transform duration-200 ease-out [transform-style:preserve-3d] will-change-transform"
        style={{ transform: reduced ? undefined : `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
      >
        <div className="flex items-center gap-1.5 border-b border-line bg-surface-2/70 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-line-2" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-2" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-2" />
          <span className="ml-3 truncate font-mono text-[0.6875rem] text-ink-3">
            waku.app/p/{DEMO_PROFILE.slug}
          </span>
        </div>
        <div className="relative max-h-[31rem] overflow-hidden">
          {/* Cursor spotlight — an overlay rather than a background so it never
              washes out the themed content beneath it. */}
          <div
            className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-200"
            style={{
              opacity: spot.visible ? 1 : 0,
              background: `radial-gradient(${SPOT_SIZE}px ${SPOT_SIZE}px at ${spot.x}px ${spot.y}px, color-mix(in oklab, var(--pt-accent, var(--accent)) 14%, transparent), transparent 70%)`,
            }}
            aria-hidden="true"
          />
          <div key={theme.theme} className="animate-swap">
            <ProfileView profile={profile} compact avatarSize={64} />
          </div>
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 hidden w-[19rem] transition-transform duration-200 ease-out sm:block"
        style={{
          transform: reduced
            ? "rotate(-3deg)"
            : `rotate(-3deg) translate3d(${tilt.y * 0.6}px, ${-tilt.x * 0.6}px, 0)`,
        }}
      >
        <div className="absolute inset-0 -z-10 translate-y-2 scale-[1.02] rounded-xl bg-accent/20 blur-md" aria-hidden="true" />
        <div className="overflow-hidden rounded-xl border border-line-2 bg-bg shadow-card-lg">
          <IdentityCard
            profile={{ ...profile, cardLayout: "minimal" }}
            qrDataUrl={qrDataUrl}
            profileUrl={profileUrl}
            surfaceRef={surfaceRef}
          />
        </div>
      </div>
    </div>
  );
}
