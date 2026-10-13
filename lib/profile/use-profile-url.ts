"use client";

import { useSyncExternalStore } from "react";
import { profilePath } from "./format";

/**
 * Absolute profile URL. During SSR and the first client render this resolves
 * to the relative path (no `window` yet), then upgrades to the full origin
 * after mount via `useSyncExternalStore`, so hydration always matches and
 * there is never a `window` branch in the render path.
 *
 * Keep this hook in this client-only module: `format.ts` is imported by server
 * components and must stay free of React APIs.
 */
export function useProfileUrl(slug: string): string {
  return useSyncExternalStore(
    subscribeNoop,
    () => `${window.location.origin}${profilePath(slug)}`,
    () => profilePath(slug),
  );
}

function subscribeNoop() {
  return () => {};
}
