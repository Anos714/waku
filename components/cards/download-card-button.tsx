"use client";

import { useCallback, useSyncExternalStore, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Download,
  Loader2,
} from "@/components/icons/ui-icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CARD_EXPORT_FORMATS,
  cardFilename,
  exportCard,
  exportProfilePreview,
  previewFilename,
  supportsExportFormat,
  type CardExportFormatDef,
} from "@/lib/cards/export";
import { downloadDataUrl } from "@/lib/profile/share";
import type { Profile } from "@/types";

const noopSubscribe = () => () => {};

/**
 * Reads encoder support as external browser state: the probe touches the DOM
 * and its answer can differ from the server render, so it goes through
 * useSyncExternalStore — hydration renders the server answer (supported),
 * then the client re-renders with the probed result. No mismatches, and the
 * probe itself is memoised per MIME type.
 */
function useFormatSupported(format: CardExportFormatDef): boolean {
  const getSnapshot = useCallback(() => supportsExportFormat(format), [format]);
  return useSyncExternalStore(noopSubscribe, getSnapshot, () => true);
}

function pulseSurface(node: HTMLElement): void {
  node.animate(
    [
      { transform: `${node.style.transform} scale(1)` },
      { transform: `${node.style.transform} scale(1.02)` },
      { transform: `${node.style.transform} scale(1)` },
    ],
    { duration: 320, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
  );
}

type IdleFormat = { id: CardExportFormatDef["id"]; state: "loading" | "done" | "error" } | null;

/**
 * A single format row inside the download menu. Browsers that cannot encode a
 * MIME type show the row disabled rather than silently vanishing, so the list
 * of formats stays predictable.
 */
function FormatMenuItem({
  format,
  state,
  onSelect,
}: {
  format: CardExportFormatDef;
  state: IdleFormat;
  onSelect: (format: CardExportFormatDef) => void;
}) {
  const supported = useFormatSupported(format);
  const busy = state?.id === format.id && state.state === "loading";
  const done = state?.id === format.id && state.state === "done";
  const failed = state?.id === format.id && state.state === "error";

  return (
    <DropdownMenuItem
      disabled={!supported || busy}
      onSelect={(event) => {
        event.preventDefault();
        onSelect(format);
      }}
      className={failed ? "text-red-600" : undefined}
      aria-label={`Download ${format.label}`}
    >
      <span
        className="flex h-6 w-12 shrink-0 items-center justify-center rounded-md border border-line bg-surface-2 font-mono text-[0.625rem] font-semibold uppercase text-ink-2"
        aria-hidden="true"
      >
        {format.extension}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-ink">{format.label}</span>
        <span className="block text-[0.6875rem] leading-tight text-ink-3">
          {!supported
            ? "Unsupported in this browser"
            : failed
              ? "Export failed. Try again"
              : format.hint}
        </span>
      </span>
      {busy ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-ink-3" />
      ) : done ? (
        <Check key="done" className="h-4 w-4 shrink-0 animate-pop text-accent-2" />
      ) : failed ? (
        <AlertTriangle className="h-4 w-4 shrink-0" />
      ) : null}
    </DropdownMenuItem>
  );
}

/**
 * The download dropdown: one button that opens a menu of image formats. Each
 * entry captures the same surface — the shared raster is cached, so a second
 * download in another format is instant until the profile changes.
 */
function DownloadMenu({
  surfaceRef,
  buildFilename,
  exportDataUrl,
  label,
  align = "end",
}: {
  surfaceRef: React.RefObject<HTMLDivElement | null>;
  buildFilename: (extension: string) => string;
  exportDataUrl: (node: HTMLElement, format: CardExportFormatDef) => Promise<string>;
  label: string;
  align?: "start" | "end";
}) {
  const [state, setState] = useState<IdleFormat>(null);

  async function handleSelect(format: CardExportFormatDef) {
    const node = surfaceRef.current;
    if (!node) return;
    setState({ id: format.id, state: "loading" });
    try {
      const dataUrl = await exportDataUrl(node, format);
      downloadDataUrl(dataUrl, buildFilename(format.extension));
      pulseSurface(node);
      setState({ id: format.id, state: "done" });
      window.setTimeout(() => {
        setState((current) =>
          current?.id === format.id && current.state === "done" ? null : current,
        );
      }, 1600);
    } catch {
      setState({ id: format.id, state: "error" });
      window.setTimeout(() => {
        setState((current) =>
          current?.id === format.id && current.state === "error" ? null : current,
        );
      }, 5000);
    }
  }

  const busy = state?.state === "loading";
  const done = state?.state === "done";
  const failed = state?.state === "error";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={failed ? "danger" : "default"}
          disabled={busy}
          aria-label={label}
          aria-haspopup="menu"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : done ? (
            <Check key="done" className="h-4 w-4 animate-pop text-accent-2" />
          ) : failed ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span className="truncate">
            {busy ? "Rendering…" : done ? "Saved" : failed ? "Export failed" : label}
          </span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-64">
        <DropdownMenuLabel>Image format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {CARD_EXPORT_FORMATS.map((format) => (
          <FormatMenuItem
            key={format.id}
            format={format}
            state={state}
            onSelect={handleSelect}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * The identity-card download menu. Captures the fixed-size card surface.
 */
export function CardDownloadMenu({
  profile,
  surfaceRef,
  align = "start",
}: {
  profile: Profile;
  surfaceRef: React.RefObject<HTMLDivElement | null>;
  align?: "start" | "end";
}) {
  return (
    <DownloadMenu
      surfaceRef={surfaceRef}
      label="Download card"
      align={align}
      buildFilename={(extension) =>
        cardFilename(profile.slug, profile.cardLayout, extension)
      }
      exportDataUrl={(node, format) => exportCard(node, profile, format)}
    />
  );
}

/**
 * The profile-preview download menu. Captures the responsive profile surface
 * at its current on-screen width.
 */
export function PreviewDownloadMenu({
  profile,
  surfaceRef,
  align = "start",
}: {
  profile: Profile;
  surfaceRef: React.RefObject<HTMLDivElement | null>;
  align?: "start" | "end";
}) {
  return (
    <DownloadMenu
      surfaceRef={surfaceRef}
      label="Download profile"
      align={align}
      buildFilename={(extension) => previewFilename(profile.slug, extension)}
      exportDataUrl={(node, format) => exportProfilePreview(node, profile, format)}
    />
  );
}
