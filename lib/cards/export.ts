import { resolveTheme } from "@/lib/themes";
import type { Profile } from "@/types";

export interface CardDesignSize {
  width: number;
  height: number;
}

export const CARD_DESIGN_SIZES: Record<string, CardDesignSize> = {
  classic: { width: 1200, height: 630 },
  banner: { width: 1200, height: 720 },
  minimal: { width: 1200, height: 630 },
  split: { width: 1200, height: 630 },
  poster: { width: 1200, height: 630 },
  spotlight: { width: 1200, height: 630 },
  frame: { width: 1200, height: 630 },
  duo: { width: 1200, height: 720 },
  signal: { width: 1200, height: 630 },
  capsule: { width: 1200, height: 630 },
};

const PIXEL_RATIO = 2;

export type CardExportFormat = "png" | "jpeg" | "webp" | "avif";

export interface CardExportFormatDef {
  id: CardExportFormat;
  label: string;
  /** MIME type handed to canvas.toDataURL(). */
  mime: string;
  /** Download extension. */
  extension: string;
  /** Quality for lossy formats; PNG ignores this. */
  quality?: number;
  /** Short description shown as a tooltip. */
  hint: string;
}

/**
 * Export formats offered for the identity card. PNG stays first — it is the
 * lossless default and the only one every browser can encode.
 */
export const CARD_EXPORT_FORMATS: CardExportFormatDef[] = [
  { id: "png", label: "PNG", mime: "image/png", extension: "png", hint: "Lossless — text stays sharp" },
  { id: "webp", label: "WebP", mime: "image/webp", extension: "webp", quality: 0.92, hint: "Modern and small, good quality" },
  { id: "jpeg", label: "JPEG", mime: "image/jpeg", extension: "jpg", quality: 0.92, hint: "Smallest widely-compatible file" },
  { id: "avif", label: "AVIF", mime: "image/avif", extension: "avif", quality: 0.9, hint: "Best compression" },
];

/**
 * html-to-image is the heaviest dependency on /create and is only needed the
 * first time a card is exported. Importing it dynamically keeps it out of the
 * editor's initial bundle; the chunk loads once, on first download.
 */
async function loadRasterizer() {
  const { toCanvas } = await import("html-to-image");
  return toCanvas;
}

/* ----------------------------------------------------------- Canvas caching */

/**
 * Rasterised card surfaces, keyed by cache identity. Only entries for the
 * current card are kept, so the map holds at most a couple of canvases — one
 * per background treatment (transparent for PNG/WebP/AVIF, filled for JPEG).
 */
const canvasCache = new Map<string, HTMLCanvasElement>();
let canvasCacheProfile = "";

/**
 * Renders the card surface to a canvas at its design size. Repeated exports of
 * the same card reuse the cached raster, so grabbing four formats costs one
 * serialization rather than four. Editing the profile changes the key, which
 * invalidates the cache automatically.
 */
async function renderCardCanvas(
  node: HTMLElement,
  size: CardDesignSize,
  cacheKey: string,
  backgroundColor?: string,
): Promise<HTMLCanvasElement> {
  const [profileKey] = cacheKey.split("::", 1);
  if (profileKey !== canvasCacheProfile) {
    canvasCache.clear();
    canvasCacheProfile = profileKey;
  }

  const cached = canvasCache.get(cacheKey);
  if (cached) return cached;

  const toCanvas = await loadRasterizer();
  const canvas = await toCanvas(node, {
    width: size.width,
    height: size.height,
    pixelRatio: PIXEL_RATIO,
    cacheBust: true,
    backgroundColor,
    // html-to-image inlines the <img> src but never the <picture><source>
    // srcSets, so a <source> would keep pointing at a remote URL the
    // serialized SVG cannot load — dropping them makes the browser fall back
    // to the already-inlined <img>, so uploaded avatars survive the export.
    filter: (node) => node.tagName !== "SOURCE",
    style: {
      transform: "scale(1)",
      transformOrigin: "top left",
      width: `${size.width}px`,
      height: `${size.height}px`,
      margin: "0",
    },
  });

  canvasCache.set(cacheKey, canvas);
  return canvas;
}

function cardCacheKey(profile: Profile): string {
  // The card renders purely from the profile, so the serialized profile is a
  // complete cache identity. Computed only when an export is requested.
  return JSON.stringify(profile);
}

/* ------------------------------------------------------------- Encode support */

const encodeSupport = new Map<string, boolean>();

/**
 * Probes whether this browser can actually encode a MIME type. Browsers
 * silently fall back to PNG for types they cannot produce, so an unsupported
 * format would otherwise download a PNG under a .webp/.avif name.
 */
export function supportsExportFormat(format: CardExportFormatDef): boolean {
  if (typeof document === "undefined") return true;
  const cached = encodeSupport.get(format.mime);
  if (cached !== undefined) return cached;

  try {
    const canvas = document.createElement("canvas");
    canvas.width = 8;
    canvas.height = 8;
    const context = canvas.getContext("2d");
    if (context) {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, 8, 8);
    }
    const ok = canvas.toDataURL(format.mime).startsWith(`data:${format.mime}`);
    encodeSupport.set(format.mime, ok);
    return ok;
  } catch {
    encodeSupport.set(format.mime, false);
    return false;
  }
}

/* ------------------------------------------------------------------ Exports */

/**
 * Rasterises a themed surface (identity card or profile preview) and encodes
 * it as a data URL in the chosen format. The node is captured at design size
 * so the result is crisp and never includes editor chrome.
 */
async function exportSurface(
  node: HTMLElement,
  size: CardDesignSize,
  cacheKey: string,
  backgroundColor: string | undefined,
  format: CardExportFormatDef,
): Promise<string> {
  const canvas = await renderCardCanvas(node, size, cacheKey, backgroundColor);

  const dataUrl = canvas.toDataURL(format.mime, format.quality);
  if (!dataUrl.startsWith(`data:${format.mime}`)) {
    // The browser could not encode this format (see supportsExportFormat).
    throw new Error(`${format.label} encoding is unavailable in this browser.`);
  }
  return dataUrl;
}

/**
 * Exports the identity card surface as a data URL in the chosen format.
 */
export async function exportCard(
  node: HTMLElement,
  profile: Profile,
  format: CardExportFormatDef,
): Promise<string> {
  const size = CARD_DESIGN_SIZES[profile.cardLayout] ?? CARD_DESIGN_SIZES.classic;

  // JPEG has no alpha channel; without a fill the rounded corners export as
  // black. Formats that support transparency keep it.
  const backgroundColor =
    format.id === "jpeg"
      ? resolveTheme(profile.theme).tokens["--pt-bg"]
      : undefined;

  // The fill is part of the raster, so it belongs in the cache identity —
  // otherwise a cached transparent PNG render would be reused for JPEG.
  const cacheKey = `${cardCacheKey(profile)}::card::${backgroundColor ?? "transparent"}`;

  return exportSurface(node, size, cacheKey, backgroundColor, format);
}

/**
 * Exports the live profile preview — the responsive profile page as rendered
 * in the editor — at its current on-screen width. Unlike the identity card
 * this surface has no fixed design size, so it is measured at capture time.
 */
export async function exportProfilePreview(
  node: HTMLElement,
  profile: Profile,
  format: CardExportFormatDef,
): Promise<string> {
  const size = {
    width: Math.max(node.offsetWidth, 1),
    height: Math.max(node.offsetHeight, 1),
  };

  const backgroundColor =
    format.id === "jpeg"
      ? resolveTheme(profile.theme).tokens["--pt-bg"]
      : undefined;

  const cacheKey = `${cardCacheKey(profile)}::preview::${size.width}x${size.height}::${
    backgroundColor ?? "transparent"
  }`;

  return exportSurface(node, size, cacheKey, backgroundColor, format);
}

export function cardFilename(
  slug: string,
  layout: string,
  extension = "png",
): string {
  const safe = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 40) || "profile";
  return `waku-${safe}-${layout}.${extension}`;
}

export function qrFilename(slug: string): string {
  const safe = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 40) || "profile";
  return `waku-${safe}-qr.png`;
}

export function previewFilename(slug: string, extension = "png"): string {
  const safe = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 40) || "profile";
  return `waku-${safe}-profile.${extension}`;
}
