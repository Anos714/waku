"use client";

import { useCallback, useEffect, useState } from "react";
import { HERO_THEMES, HERO_THEME_EVENT, heroThemeSettings } from "@/lib/landing/hero-themes";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";
import type { ThemeId, ThemeSettings } from "@/types";

const AUTOPLAY_MS = 4200;

/**
 * Cycles the hero's demo profile through the real themes.
 *
 * Auto-plays slowly on load and pauses on hover, focus, or interaction — the
 * visitor should never have to fight it. Theme selection is lifted up so the
 * headline phrase and the preview move together, and other sections (the
 * Features grid) can drive it through the `waku:hero-theme` window event.
 */
export function useHeroTheme() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = usePrefersReducedMotion();

  const theme = HERO_THEMES[index];
  const settings = heroThemeSettings(theme);

  const select = useCallback((id: ThemeId) => {
    setIndex(HERO_THEMES.findIndex((candidate) => candidate.id === id));
  }, []);

  const next = useCallback(() => {
    setIndex((current) => (current + 1) % HERO_THEMES.length);
  }, []);

  // Slow autoplay. Pausing holds the current theme; reduced motion never starts.
  useEffect(() => {
    if (paused || reduced) return;
    const timer = window.setInterval(next, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [paused, reduced, next]);

  // Other sections can re-theme the hero (the Features chips) without a provider.
  useEffect(() => {
    function onTheme(event: Event) {
      const detail = (event as CustomEvent<ThemeId>).detail;
      if (detail) select(detail);
    }
    window.addEventListener(HERO_THEME_EVENT, onTheme);
    return () => window.removeEventListener(HERO_THEME_EVENT, onTheme);
  }, [select]);

  return { theme, settings, index, select, next, paused, setPaused };
}

/**
 * The chip row under the hero preview. Clicking picks a theme; hovering or
 * focusing the row pauses the autoplay so the current theme can be read.
 */
export function ThemeSwitcher({
  index,
  onSelect,
  onPause,
}: {
  index: number;
  onSelect: (id: ThemeId) => void;
  paused: boolean;
  onPause: (paused: boolean) => void;
}) {
  return (
    <div
      className="mt-6 flex flex-wrap items-center gap-2"
      onMouseEnter={() => onPause(true)}
      onMouseLeave={() => onPause(false)}
      onFocus={() => onPause(true)}
      onBlur={() => onPause(false)}
      role="group"
      aria-label="Preview themes"
    >
      <span className="mr-1 font-mono text-[0.6875rem] text-ink-3">Theme</span>
      {HERO_THEMES.map((theme, position) => {
        const active = position === index;
        return (
          <button
            key={theme.id}
            type="button"
            onClick={() => onSelect(theme.id)}
            aria-pressed={active}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              active
                ? "border-ink bg-ink text-bg"
                : "border-line bg-surface text-ink-2 hover:border-line-2 hover:text-ink",
            )}
          >
            {theme.label}
          </button>
        );
      })}
      <span className="ml-1.5 font-mono text-[0.6875rem] text-ink-3 tabular-nums" aria-hidden="true">
        {String(index + 1).padStart(2, "0")}/{String(HERO_THEMES.length).padStart(2, "0")}
      </span>
    </div>
  );
}

export type { ThemeSettings };
