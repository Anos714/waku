"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Live `prefers-reduced-motion` state for JS-driven motion (parallax tilt,
 * autoplay, cursor spotlights). CSS-only motion is already collapsed by the
 * global override in `globals.css`; this covers anything driven by event
 * handlers.
 *
 * Subscribed via `useSyncExternalStore`: the server snapshot is always false,
 * so a reduced-motion visitor never sees a frame of motion before the real
 * value resolves.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function subscribe(callback: () => void): () => void {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}
