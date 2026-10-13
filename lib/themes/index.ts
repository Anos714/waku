import type {
  AvatarShape,
  BackgroundStyle,
  FontPairingId,
  ResolvedTheme,
  SocialButtonStyle,
  ThemeId,
  ThemeSettings,
} from "@/types";

/**
 * Theme presets. Each preset owns its palette, typographic feel and surface
 * treatment. Accent color, fonts and shape are user-overridable and merged on
 * top of the preset so content is never disturbed when switching themes.
 */
interface ThemePreset {
  id: ThemeId;
  name: string;
  description: string;
  isDark: boolean;
  tokens: Record<string, string>;
}

const FONT_VARS = {
  geist: {
    heading: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
    body: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
    mono: "var(--font-geist-mono), ui-monospace, monospace",
  },
  editorial: {
    heading: "var(--font-instrument-serif), Georgia, 'Times New Roman', serif",
    body: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
    mono: "var(--font-geist-mono), ui-monospace, monospace",
  },
  terminal: {
    heading: "var(--font-geist-mono), ui-monospace, monospace",
    body: "var(--font-geist-mono), ui-monospace, monospace",
    mono: "var(--font-geist-mono), ui-monospace, monospace",
  },
  system: {
    heading: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
    body: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
    mono: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
  },
  playfair: {
    heading: "var(--font-playfair-display), Georgia, 'Times New Roman', serif",
    body: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
    mono: "var(--font-geist-mono), ui-monospace, monospace",
  },
  grotesque: {
    heading: "var(--font-space-grotesk), ui-sans-serif, system-ui, sans-serif",
    body: "var(--font-space-grotesk), ui-sans-serif, system-ui, sans-serif",
    mono: "var(--font-geist-mono), ui-monospace, monospace",
  },
  lora: {
    heading: "var(--font-lora), Georgia, 'Times New Roman', serif",
    body: "var(--font-lora), Georgia, 'Times New Roman', serif",
    mono: "var(--font-geist-mono), ui-monospace, monospace",
  },
  jetbrains: {
    heading: "var(--font-jetbrains-mono), ui-monospace, monospace",
    body: "var(--font-jetbrains-mono), ui-monospace, monospace",
    mono: "var(--font-jetbrains-mono), ui-monospace, monospace",
  },
} satisfies Record<FontPairingId, ResolvedTheme["fonts"]>;

const PRESETS: Record<ThemeId, ThemePreset> = {
  mono: {
    id: "mono",
    name: "Mono",
    description: "Minimal black on white. No color, only type.",
    isDark: false,
    tokens: {
      "--pt-bg": "#ffffff",
      "--pt-bg-2": "#f2f2f0",
      "--pt-surface": "#ffffff",
      "--pt-ink": "#0a0a0a",
      "--pt-ink-2": "#454545",
      "--pt-ink-3": "#757575",
      "--pt-line": "#e4e4e0",
      "--pt-accent": "#0a0a0a",
      "--pt-accent-ink": "#ffffff",
      "--pt-radius": "10px",
    },
  },
  terminal: {
    id: "terminal",
    name: "Terminal",
    description: "Dark developer surface with a restrained green prompt.",
    isDark: true,
    tokens: {
      "--pt-bg": "#0d0f0d",
      "--pt-bg-2": "#121512",
      "--pt-surface": "#161a16",
      "--pt-ink": "#e6efe3",
      "--pt-ink-2": "#a7b8a4",
      "--pt-ink-3": "#6f826c",
      "--pt-line": "#263025",
      "--pt-accent": "#8fdc6f",
      "--pt-accent-ink": "#0d0f0d",
      "--pt-radius": "8px",
    },
  },
  editorial: {
    id: "editorial",
    name: "Editorial",
    description: "Warm paper, elegant serif headings, generous space.",
    isDark: false,
    tokens: {
      "--pt-bg": "#f4f0e8",
      "--pt-bg-2": "#e9e3d7",
      "--pt-surface": "#fffdf8",
      "--pt-ink": "#23201a",
      "--pt-ink-2": "#57524a",
      "--pt-ink-3": "#8b8478",
      "--pt-line": "#ddd5c6",
      "--pt-accent": "#b8460e",
      "--pt-accent-ink": "#fffdf8",
      "--pt-radius": "14px",
    },
  },
  aurora: {
    id: "aurora",
    name: "Aurora",
    description: "Deep charcoal with quiet iridescent accents.",
    isDark: true,
    tokens: {
      "--pt-bg": "#0e1014",
      "--pt-bg-2": "#141820",
      "--pt-surface": "#171c26",
      "--pt-ink": "#eef1f7",
      "--pt-ink-2": "#a9b2c4",
      "--pt-ink-3": "#6f7a90",
      "--pt-line": "#252c3a",
      "--pt-accent": "#7dd3c0",
      "--pt-accent-ink": "#0e1014",
      "--pt-radius": "12px",
    },
  },
  noir: {
    id: "noir",
    name: "Noir",
    description: "Pure black on white. High contrast, zero colour.",
    isDark: true,
    tokens: {
      "--pt-bg": "#000000",
      "--pt-bg-2": "#0d0d0d",
      "--pt-surface": "#121212",
      "--pt-ink": "#ffffff",
      "--pt-ink-2": "#b4b4b4",
      "--pt-ink-3": "#7a7a7a",
      "--pt-line": "#2a2a2a",
      "--pt-accent": "#ffffff",
      "--pt-accent-ink": "#000000",
      "--pt-radius": "6px",
    },
  },
  sunrise: {
    id: "sunrise",
    name: "Sunrise",
    description: "Warm morning cream with a coral sun.",
    isDark: false,
    tokens: {
      "--pt-bg": "#fff8f2",
      "--pt-bg-2": "#ffefe2",
      "--pt-surface": "#fffdf9",
      "--pt-ink": "#2b1c12",
      "--pt-ink-2": "#6b5344",
      "--pt-ink-3": "#9c8574",
      "--pt-line": "#f2ddd0",
      "--pt-accent": "#f2622e",
      "--pt-accent-ink": "#fff8f2",
      "--pt-radius": "16px",
    },
  },
  forest: {
    id: "forest",
    name: "Forest",
    description: "Deep pine with the green of new leaves.",
    isDark: true,
    tokens: {
      "--pt-bg": "#0d1612",
      "--pt-bg-2": "#121f18",
      "--pt-surface": "#16241c",
      "--pt-ink": "#e6f2e8",
      "--pt-ink-2": "#a8c4ac",
      "--pt-ink-3": "#6f8a74",
      "--pt-line": "#24382b",
      "--pt-accent": "#86efac",
      "--pt-accent-ink": "#0d1612",
      "--pt-radius": "12px",
    },
  },
  ocean: {
    id: "ocean",
    name: "Ocean",
    description: "Midnight water with a cold blue current.",
    isDark: true,
    tokens: {
      "--pt-bg": "#0a1424",
      "--pt-bg-2": "#0f1c30",
      "--pt-surface": "#12223a",
      "--pt-ink": "#eaf2fb",
      "--pt-ink-2": "#a6bdd4",
      "--pt-ink-3": "#6c839c",
      "--pt-line": "#1f3350",
      "--pt-accent": "#60a5fa",
      "--pt-accent-ink": "#0a1424",
      "--pt-radius": "12px",
    },
  },
  neon: {
    id: "neon",
    name: "Neon",
    description: "Inky violet night lit by electric pink.",
    isDark: true,
    tokens: {
      "--pt-bg": "#130b1f",
      "--pt-bg-2": "#1a1029",
      "--pt-surface": "#1f1430",
      "--pt-ink": "#f6e9ff",
      "--pt-ink-2": "#c3a9e0",
      "--pt-ink-3": "#8c719f",
      "--pt-line": "#322447",
      "--pt-accent": "#e879f9",
      "--pt-accent-ink": "#130b1f",
      "--pt-radius": "14px",
    },
  },
  paper: {
    id: "paper",
    name: "Paper",
    description: "Cool paper sheet and an indigo pen.",
    isDark: false,
    tokens: {
      "--pt-bg": "#f6f6f3",
      "--pt-bg-2": "#ececea",
      "--pt-surface": "#fffdf9",
      "--pt-ink": "#1f2128",
      "--pt-ink-2": "#545862",
      "--pt-ink-3": "#858892",
      "--pt-line": "#e0e0dc",
      "--pt-accent": "#4f46e5",
      "--pt-accent-ink": "#ffffff",
      "--pt-radius": "10px",
    },
  },
};

export const THEME_PRESETS = PRESETS;

export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  theme: "editorial",
  accent: PRESETS.editorial.tokens["--pt-accent"],
  fontPairing: "editorial",
  avatarShape: "circle",
  background: "subtle",
  socialStyle: "outline",
};

export function resolveTheme(settings: ThemeSettings): ResolvedTheme {
  // Resolution is pure, but it rebuilds the token object on every call — and
  // the editor preview asks for it on every keystroke, while the landing
  // showcase asks once per card. Caching by the six settings keeps the common
  // themes (and the accent presets) free after the first hit. The cache is
  // bounded because the accent is a free-form hex string.
  const key = `${settings.theme}|${settings.accent}|${settings.fontPairing}|${settings.avatarShape}|${settings.background}|${settings.socialStyle}`;
  const cached = themeCache.get(key);
  if (cached) return cached;

  const resolved = computeTheme(settings);
  if (themeCache.size >= THEME_CACHE_MAX) {
    themeCache.delete(themeCache.keys().next().value as string);
  }
  themeCache.set(key, resolved);
  return resolved;
}

const THEME_CACHE_MAX = 64;
const themeCache = new Map<string, ResolvedTheme>();

function computeTheme(settings: ThemeSettings): ResolvedTheme {
  const preset = PRESETS[settings.theme] ?? PRESETS.editorial;
  const fonts = FONT_VARS[settings.fontPairing] ?? FONT_VARS.geist;

  return {
    theme: preset.id,
    accent: settings.accent,
    fontPairing: settings.fontPairing,
    fonts,
    // The font stacks are emitted as tokens so they reach the DOM as custom
    // properties — otherwise the .pt-vars defaults (always Geist) would win
    // and switching pairings would change nothing on screen.
    tokens: {
      ...preset.tokens,
      "--pt-accent": settings.accent,
      "--pt-font-heading": fonts.heading,
      "--pt-font-body": fonts.body,
      "--pt-font-mono": fonts.mono,
    },
    avatarShape: settings.avatarShape,
    background: settings.background,
    socialStyle: settings.socialStyle,
    isDark: preset.isDark,
  };
}

export function themeStyle(resolved: ResolvedTheme): React.CSSProperties {
  return { ...resolved.tokens } as React.CSSProperties;
}

const AVATAR_SHAPE_CLASSES: Record<AvatarShape, string> = {
  square: "rounded-none",
  rounded: "rounded-xl",
  circle: "rounded-full",
};

export function avatarShapeClass(shape: AvatarShape): string {
  return AVATAR_SHAPE_CLASSES[shape];
}

const BACKGROUND_CLASSES: Record<Exclude<BackgroundStyle, "subtle">, string> = {
  plain: "",
  grid: "pt-grid",
  glow: "pt-glow",
  dots: "pt-dots",
  stripes: "pt-stripes",
  mesh: "pt-mesh",
  rings: "pt-rings",
};

export function backgroundClass(
  background: BackgroundStyle,
  isDark: boolean,
): string {
  if (background === "subtle") return isDark ? "pt-subtle-dark" : "pt-subtle-light";
  return BACKGROUND_CLASSES[background] ?? "";
}

const SOCIAL_BUTTON_CLASSES: Record<SocialButtonStyle, string> = {
  minimal: "pt-social-minimal",
  outline: "pt-social-outline",
  solid: "pt-social-solid",
  soft: "pt-social-soft",
  elevated: "pt-social-elevated",
  underline: "pt-social-underline",
};

export function socialButtonClasses(style: SocialButtonStyle): string {
  return SOCIAL_BUTTON_CLASSES[style];
}

export const ACCENT_PRESETS: { label: string; value: string }[] = [
  { label: "Lime", value: "#c6f24e" },
  { label: "Ink", value: "#1a1a16" },
  { label: "Sienna", value: "#b8460e" },
  { label: "Mint", value: "#7dd3c0" },
  { label: "Violet", value: "#8b7cf6" },
  { label: "Cyan", value: "#38bdf8" },
  { label: "Rose", value: "#fb7185" },
  { label: "Amber", value: "#fbbf24" },
  { label: "Coral", value: "#f2622e" },
  { label: "Indigo", value: "#4f46e5" },
  { label: "Magenta", value: "#e879f9" },
  { label: "Emerald", value: "#34d399" },
  { label: "Crimson", value: "#ef4444" },
  { label: "Sky", value: "#60a5fa" },
  { label: "Gold", value: "#eab308" },
  { label: "Slate", value: "#64748b" },
];

export const FONT_PAIRINGS: {
  id: FontPairingId;
  name: string;
  hint: string;
}[] = [
  { id: "geist", name: "Geist", hint: "Clean grotesque sans" },
  { id: "editorial", name: "Editorial", hint: "Serif display + sans body" },
  { id: "terminal", name: "Terminal", hint: "Monospace throughout" },
  { id: "system", name: "System", hint: "Native OS stack" },
  { id: "playfair", name: "Playfair", hint: "High-contrast serif display" },
  { id: "grotesque", name: "Grotesque", hint: "Geometric, technical" },
  { id: "lora", name: "Lora", hint: "Warm serif throughout" },
  { id: "jetbrains", name: "JetBrains", hint: "Code-editor monospace" },
];
