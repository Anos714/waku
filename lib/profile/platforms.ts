import type { SocialPlatform } from "@/types";

/**
 * The canonical list of supported platforms and their metadata. Both the
 * validation layer and the UI import from here so they can never drift.
 */
export const SOCIAL_PLATFORMS = [
  "github",
  "linkedin",
  "x",
  "instagram",
  "youtube",
  "bluesky",
  "mastodon",
  "portfolio",
  "email",
] as const satisfies readonly SocialPlatform[];

export const PLATFORM_META: Record<
  SocialPlatform,
  { label: string; placeholder: string; baseUrl: string }
> = {
  github: {
    label: "GitHub",
    placeholder: "https://github.com/username",
    baseUrl: "https://github.com/",
  },
  linkedin: {
    label: "LinkedIn",
    placeholder: "https://linkedin.com/in/username",
    baseUrl: "https://www.linkedin.com/in/",
  },
  x: {
    label: "X",
    placeholder: "https://x.com/username",
    baseUrl: "https://x.com/",
  },
  instagram: {
    label: "Instagram",
    placeholder: "https://instagram.com/username",
    baseUrl: "https://instagram.com/",
  },
  youtube: {
    label: "YouTube",
    placeholder: "https://youtube.com/@channel",
    baseUrl: "https://www.youtube.com/@",
  },
  bluesky: {
    label: "Bluesky",
    placeholder: "https://bsky.app/profile/handle.bsky.social",
    baseUrl: "https://bsky.app/profile/",
  },
  mastodon: {
    label: "Mastodon",
    placeholder: "https://mastodon.social/@handle",
    baseUrl: "https://mastodon.social/@",
  },
  portfolio: {
    label: "Portfolio",
    placeholder: "https://yourwebsite.com",
    baseUrl: "https://",
  },
  email: {
    label: "Email",
    placeholder: "mailto:you@example.com",
    baseUrl: "mailto:",
  },
};
