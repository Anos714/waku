"use client";

import { useRef } from "react";
import { IdentityCard } from "./identity-card";
import { CardDownloadMenu } from "./download-card-button";
import { CARD_LAYOUTS } from "./card-layouts";
import { Switch } from "@/components/ui/switch";
import { useEditor } from "@/components/editor/editor-provider";
import { useProfileUrl } from "@/lib/profile/use-profile-url";
import { useQrCode } from "@/lib/profile/qr";
import { cn } from "@/lib/utils";

/**
 * The identity card studio: pick a layout, toggle the QR code, export a PNG.
 * Switching layouts never touches profile data.
 */
export function CardStudio() {
  const { profile, form } = useEditor();
  const surfaceRef = useRef<HTMLDivElement>(null);
  const profileUrl = useProfileUrl(profile.slug.trim() || "profile");
  const qrDataUrl = useQrCode(profileUrl, 640);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow text-ink-3">Identity card</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-2">
            A shareable card built from the same profile and theme. Exported at{" "}
            <span className="font-mono text-xs">2×</span> so text stays sharp.
          </p>
        </div>
        <CardDownloadMenu profile={profile} surfaceRef={surfaceRef} align="end" />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {CARD_LAYOUTS.map((layout) => {
          const selected = profile.cardLayout === layout.id;
          return (
            <button
              key={layout.id}
              type="button"
              aria-pressed={selected}
              onClick={() =>
                form.setValue("cardLayout", layout.id, { shouldDirty: true })
              }
              className={cn(
                "rounded-lg border bg-surface px-3 py-2.5 text-left transition-[colors,transform] duration-150 active:scale-[0.97]",
                selected
                  ? "border-ink ring-1 ring-ink/15"
                  : "border-line-2 hover:border-line-2/70 hover:bg-surface-2",
              )}
            >
              <span className="block text-sm font-medium text-ink">{layout.name}</span>
              <span className="mt-0.5 block text-[0.6875rem] leading-tight text-ink-3">
                {layout.description}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3.5 py-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">Show QR code</p>
          <p className="text-[0.6875rem] text-ink-3">
            Encodes {profileUrl.replace(/^https?:\/\//, "")}
          </p>
        </div>
        <Switch
          checked={profile.showQr}
          onCheckedChange={(checked) => form.setValue("showQr", checked, { shouldDirty: true })}
          aria-label="Show QR code on the identity card"
        />
      </div>

      <div
        key={profile.cardLayout}
        className="animate-fade-up rounded-xl border border-line-2 bg-bg-subtle/60 p-4"
      >
        <IdentityCard
          profile={profile}
          qrDataUrl={profile.showQr ? qrDataUrl : null}
          profileUrl={profileUrl}
          surfaceRef={surfaceRef}
        />
      </div>
    </div>
  );
}
