/**
 * Waku — domain models.
 * These describe the shape of a profile, its social links, theme settings and
 * card layouts. Validation lives in `lib/validation`, persistence in
 * `lib/profile/storage`, and the data-access layer in `lib/profile/profile-data`.
 */

export type SocialPlatform =
  | "github"
  | "linkedin"
  | "x"
  | "instagram"
  | "youtube"
  | "bluesky"
  | "mastodon"
  | "portfolio"
  | "email";

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  label: string;
  url: string;
  visible: boolean;
}

export interface FeaturedProject {
  id: string;
  title: string;
  description: string;
  url: string;
  tag: string;
  /**
   * Screenshot shown on top of the project card. Empty means no image —
   * the card renders exactly as before (text only).
   */
  imageUrl: string;
}

export interface ProfileSections {
  projects: boolean;
  skills: boolean;
  about: boolean;
  contact: boolean;
}

export type ThemeId =
  | "mono"
  | "terminal"
  | "editorial"
  | "aurora"
  | "noir"
  | "sunrise"
  | "forest"
  | "ocean"
  | "neon"
  | "paper";

export type FontPairingId =
  | "geist"
  | "editorial"
  | "terminal"
  | "system"
  | "playfair"
  | "grotesque"
  | "lora"
  | "jetbrains";

export type AvatarShape = "circle" | "rounded" | "square";

export type BackgroundStyle =
  | "plain"
  | "subtle"
  | "grid"
  | "glow"
  | "dots"
  | "stripes"
  | "mesh"
  | "rings";

export type SocialButtonStyle =
  | "minimal"
  | "outline"
  | "solid"
  | "soft"
  | "elevated"
  | "underline";

export interface ThemeSettings {
  theme: ThemeId;
  /** Accent color as a hex string, applied on top of the selected theme. */
  accent: string;
  fontPairing: FontPairingId;
  avatarShape: AvatarShape;
  background: BackgroundStyle;
  socialStyle: SocialButtonStyle;
}

/**
 * A theme fully resolved into concrete values. Produced by
 * `lib/themes` from `ThemeSettings` and consumed by profile/card components
 * so that styling decisions stay in one place.
 */
export interface ResolvedTheme {
  theme: ThemeId;
  accent: string;
  fontPairing: FontPairingId;
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };
  /** Flat token map, applied as inline CSS custom properties on the container. */
  tokens: Record<string, string>;
  avatarShape: AvatarShape;
  background: BackgroundStyle;
  socialStyle: SocialButtonStyle;
  isDark: boolean;
}

export type CardLayoutId =
  | "classic"
  | "banner"
  | "minimal"
  | "split"
  | "poster"
  | "spotlight"
  | "frame"
  | "duo";

/**
 * Layout templates for the profile page itself. Each is a full rendering of
 * the header and section arrangement — content and theme stay identical
 * across templates, only the composition changes.
 */
export type ProfileDesignId = "editorial" | "centered" | "sidebar" | "hero";

export interface Profile {
  name: string;
  slug: string;
  role: string;
  tagline: string;
  bio: string;
  location: string;
  avatarUrl: string;
  websiteUrl: string;
  skills: string[];
  interests: string[];
  socials: SocialLink[];
  projects: FeaturedProject[];
  sections: ProfileSections;
  theme: ThemeSettings;
  cardLayout: CardLayoutId;
  profileDesign: ProfileDesignId;
  showQr: boolean;
}

/** Fields the AI generator accepts. */
export type WritingStyle = "professional" | "casual" | "minimal" | "creative";

export interface AiGenerationInput {
  type: "bio" | "tagline";
  role: string;
  skills: string[];
  interests: string[];
  style: WritingStyle;
  name?: string;
}

export interface AiVariation {
  id: string;
  text: string;
}

export interface AiGenerationResult {
  variations: AiVariation[];
  model: string;
}

export const DEMO_SLUG = "ada";
