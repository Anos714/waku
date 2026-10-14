import { profileSchema } from "@/lib/validation/profile";
import { SOCIAL_PLATFORMS } from "@/lib/profile/platforms";
import { createId } from "@/lib/utils";
import { createDemoProfile } from "./demo";
import type {
  CardLayoutId,
  Profile,
  SocialLink,
  ThemeSettings,
} from "@/types";

/**
 * Draft persistence for the local MVP.
 *
 * Everything is stored in this browser's localStorage. Nothing here is
 * published anywhere — a future database would live behind the data-access
 * layer in `profile-data.ts`, not here.
 */

const STORAGE_KEY = "waku.draft.v1";
const LEGACY_STORAGE_KEY = "linkpersona.draft.v1";
const SCHEMA_VERSION = 1;

interface StoredDraft {
  version: number;
  savedAt: string;
  profile: Profile;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

// One-time carry-over of drafts saved under the previous app name.
function migrateLegacyKey(): void {
  if (!isBrowser()) return;
  try {
    if (window.localStorage.getItem(STORAGE_KEY)) return;
    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) window.localStorage.setItem(STORAGE_KEY, legacy);
  } catch {
    // Non-fatal: worst case the user starts from the demo profile.
  }
}

/**
 * Reads whatever draft is actually stored in this browser, or null when there
 * is nothing saved. Callers that must always hold a complete profile (the
 * editor) use `loadDraft()` instead, which falls back to the demo profile.
 */
export function readStoredDraft(): Profile | null {
  if (!isBrowser()) return null;

  try {
    migrateLegacyKey();
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredDraft;
    if (!parsed || parsed.version !== SCHEMA_VERSION || !parsed.profile) {
      return null;
    }

    const result = profileSchema.safeParse(parsed.profile);
    if (result.success) {
      // Merge over the demo profile so newly added fields always have a value.
      return { ...createDemoProfile(), ...result.data };
    }

    // Validation failed mid-edit (a URL that isn't a URL yet, an over-long
    // string…). Salvage the shape so a draft is never wiped by a transient
    // error, while guaranteeing rendering stays safe.
    return salvageProfile(parsed.profile);
  } catch {
    return null;
  }
}

export function loadDraft(): Profile {
  return readStoredDraft() ?? createDemoProfile();
}

export function saveDraft(profile: Profile): void {
  if (!isBrowser()) return;

  const payload: StoredDraft = {
    version: SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    profile,
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Storage may be full or blocked; the editor keeps working in memory.
  }
}

export function clearDraft(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function hasDraft(): boolean {
  if (!isBrowser()) return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

/* ---------------------------------------------------------------------------
   Shape salvage
   Coerces an untrusted stored payload into a render-safe Profile. It clamps
   over-long strings and fills missing structure from the demo profile, but it
   deliberately keeps user content that fails field validation (an unfinished
   URL, say) — the renderer already guards against unsafe URLs.
--------------------------------------------------------------------------- */

function asString(value: unknown, max: number, fallback = ""): string {
  return typeof value === "string" ? value.slice(0, max) : fallback;
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asStringArray(value: unknown, max: number, cap: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.slice(0, max))
    .filter((item) => item.trim().length > 0)
    .slice(0, cap);
}

function asSocials(value: unknown): SocialLink[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      id: asString(item.id, 64) || createId("social"),
      platform: validPlatform(item.platform),
      label: asString(item.label, 48),
      url: asString(item.url, 2048),
      visible: asBoolean(item.visible, true),
    }))
    .slice(0, 12);
}

function validPlatform(value: unknown): SocialLink["platform"] {
  return (SOCIAL_PLATFORMS as readonly string[]).includes(value as string)
    ? (value as SocialLink["platform"])
     : "portfolio";
}

export function salvageProfile(value: unknown): Profile {
  const demo = createDemoProfile();
  if (typeof value !== "object" || value === null) return demo;
  const raw = value as Record<string, unknown>;

  const theme: ThemeSettings = {
    theme: validTheme(raw.theme),
    accent: asString(raw.theme && (raw.theme as Record<string, unknown>).accent, 7, demo.theme.accent),
    fontPairing: validFontPairing(raw.theme),
    avatarShape: validAvatarShape(raw.theme),
    background: validBackground(raw.theme),
    socialStyle: validSocialStyle(raw.theme),
  };

  const sectionsSource =
    raw.sections && typeof raw.sections === "object"
      ? (raw.sections as Record<string, unknown>)
      : {};

  return {
    ...demo,
    name: asString(raw.name, 60, demo.name),
    slug: asString(raw.slug, 64, demo.slug),
    role: asString(raw.role, 80),
    tagline: asString(raw.tagline, 120),
    bio: asString(raw.bio, 600),
    location: asString(raw.location, 60),
    avatarUrl: asString(raw.avatarUrl, 2048),
    websiteUrl: asString(raw.websiteUrl, 2048),
    skills: asStringArray(raw.skills, 32, 24),
    interests: asStringArray(raw.interests, 32, 24),
    socials: asSocials(raw.socials),
    projects: Array.isArray(raw.projects)
      ? raw.projects
          .filter(
            (item): item is Record<string, unknown> =>
              typeof item === "object" && item !== null,
          )
          .map((item) => ({
            id: asString(item.id, 64) || createId("project"),
            title: asString(item.title, 80),
            description: asString(item.description, 220),
            url: asString(item.url, 2048),
            tag: asString(item.tag, 24),
            imageUrl: asString(item.imageUrl, 2048),
          }))
          .slice(0, 6)
      : [],
    sections: {
      projects: asBoolean(sectionsSource.projects, true),
      skills: asBoolean(sectionsSource.skills, true),
      about: asBoolean(sectionsSource.about, true),
      contact: asBoolean(sectionsSource.contact, true),
    },
    theme,
    cardLayout: validCardLayout(raw.cardLayout),
    profileDesign: validProfileDesign(raw.profileDesign),
    showQr: asBoolean(raw.showQr, true),
  };
}

type StringEnum<T extends string> = readonly T[];

function pickEnum<T extends string>(
  source: unknown,
  key: string,
  allowed: StringEnum<T>,
  fallback: T,
): T {
  const obj = source && typeof source === "object" ? (source as Record<string, unknown>) : {};
  return (allowed as readonly string[]).includes(obj[key] as string)
    ? (obj[key] as T)
    : fallback;
}

const THEMES = [
  "mono",
  "terminal",
  "editorial",
  "aurora",
  "noir",
  "sunrise",
  "forest",
  "ocean",
  "neon",
  "paper",
] as const;
const FONTS = [
  "geist",
  "editorial",
  "terminal",
  "system",
  "playfair",
  "grotesque",
  "lora",
  "jetbrains",
] as const;
const SHAPES = ["circle", "rounded", "square"] as const;
const BACKGROUNDS = [
  "plain",
  "subtle",
  "grid",
  "glow",
  "dots",
  "stripes",
  "mesh",
  "rings",
] as const;
const SOCIAL_STYLES = [
  "minimal",
  "outline",
  "solid",
  "soft",
  "elevated",
  "underline",
] as const;
const CARD_LAYOUTS = [
  "classic",
  "banner",
  "minimal",
  "split",
  "poster",
  "spotlight",
  "frame",
  "duo",
] as const;
const PROFILE_DESIGNS = ["editorial", "centered", "sidebar", "hero"] as const;

function validTheme(source: unknown) {
  return pickEnum(source, "theme", THEMES, "editorial");
}
function validFontPairing(source: unknown) {
  return pickEnum(source, "fontPairing", FONTS, "geist");
}
function validAvatarShape(source: unknown) {
  return pickEnum(source, "avatarShape", SHAPES, "circle");
}
function validBackground(source: unknown) {
  return pickEnum(source, "background", BACKGROUNDS, "subtle");
}
function validSocialStyle(source: unknown) {
  return pickEnum(source, "socialStyle", SOCIAL_STYLES, "outline");
}
function validCardLayout(source: unknown) {
  return pickEnum(source, "cardLayout", CARD_LAYOUTS, "classic");
}
function validProfileDesign(source: unknown) {
  return pickEnum(source, "profileDesign", PROFILE_DESIGNS, "editorial");
}

export type { CardLayoutId };

/** Reading a profile for a slug, in-browser only (used by the public route). */
export function readLocalDraftForSlug(slug: string): Profile | null {
  // Only this browser's own *saved* draft matches. loadDraft()'s demo fallback
  // is deliberately not used here: the demo profile carries the demo slug, so
  // falling back to it would make /p/<demo-slug> always look like a local
  // draft and greet first-time visitors with a false "Local preview" banner.
  const draft = readStoredDraft();
  return draft && draft.slug === slug ? draft : null;
}
