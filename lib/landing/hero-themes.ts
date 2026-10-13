import { THEME_PRESETS } from "@/lib/themes";
import type { FontPairingId, ThemeId, ThemeSettings } from "@/types";

/**
 * The themes the landing hero cycles through. Each one is a real preset run
 * through the same `resolveTheme()` path as the editor, so the hero is a live
 * demo of the product rather than a picture of it.
 *
 * `word` is the final phrase of the headline while that theme is showing — the
 * headline and the preview move together, one idea per theme.
 */

export interface HeroTheme {
  id: ThemeId;
  label: string;
  /** Final phrase of the headline while this theme is showing. */
  word: string;
  fontPairing: FontPairingId;
}

export const HERO_THEMES: HeroTheme[] = [
  { id: "editorial", label: "Editorial", word: "put together.", fontPairing: "editorial" },
  { id: "terminal", label: "Terminal", word: "shipped.", fontPairing: "terminal" },
  { id: "aurora", label: "Aurora", word: "shared.", fontPairing: "grotesque" },
  { id: "mono", label: "Mono", word: "printed.", fontPairing: "geist" },
  { id: "sunrise", label: "Sunrise", word: "remembered.", fontPairing: "lora" },
];

/**
 * Demo-profile theme settings for a hero theme. The preset's own accent is used
 * (not the demo's lime) with a matching font pairing, so switching themes
 * visibly switches product rather than repainting one surface.
 */
export function heroThemeSettings(theme: HeroTheme): ThemeSettings {
  const preset = THEME_PRESETS[theme.id];
  return {
    theme: theme.id,
    accent: preset.tokens["--pt-accent"],
    fontPairing: theme.fontPairing,
    avatarShape: "circle",
    background: "subtle",
    socialStyle: "outline",
  };
}

/**
 * The custom event theme chips elsewhere on the page (the Features grid) use to
 * re-theme the hero preview, without wiring a provider across sections.
 */
export const HERO_THEME_EVENT = "waku:hero-theme";

export function dispatchHeroTheme(theme: ThemeId): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ThemeId>(HERO_THEME_EVENT, { detail: theme }));
}
