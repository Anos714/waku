import { describe, expect, it } from "vitest";
import { salvageProfile } from "@/lib/profile/storage";
import { createDemoProfile } from "@/lib/profile/demo";
import { usableSocials } from "@/lib/profile/format";
import { THEME_PRESETS } from "@/lib/themes";
import type { Profile } from "@/types";

describe("salvageProfile", () => {
  it("returns the demo profile for non-object input", () => {
    expect(salvageProfile(null)).toEqual(createDemoProfile());
    expect(salvageProfile("oops")).toEqual(createDemoProfile());
    expect(salvageProfile(42)).toEqual(createDemoProfile());
  });

  it("always yields a structurally complete Profile", () => {
    // The point of the salvage path: whatever garbage comes out of
    // localStorage must have every field present with the right type and every
    // enum within its allowed set, so rendering can never crash.
    const salvaged = salvageProfile({
      name: 123,
      socials: [{ url: "javascript:alert(1)" }],
      theme: { theme: "not-a-theme" },
      sections: "yes",
    });

    expect(typeof salvaged.name).toBe("string");
    expect(Array.isArray(salvaged.skills)).toBe(true);
    expect(Array.isArray(salvaged.socials)).toBe(true);
    expect(Array.isArray(salvaged.projects)).toBe(true);
    expect(typeof salvaged.sections).toBe("object");
    expect(Object.keys(THEME_PRESETS)).toContain(salvaged.theme.theme);
    expect(salvaged.sections).toMatchObject({
      projects: expect.any(Boolean),
      skills: expect.any(Boolean),
      about: expect.any(Boolean),
      contact: expect.any(Boolean),
    });
  });

  it("clamps over-long strings to their field maximums", () => {
    const salvaged = salvageProfile({
      name: "a".repeat(200),
      role: "b".repeat(200),
      tagline: "c".repeat(200),
      bio: "d".repeat(2000),
      location: "e".repeat(200),
    });
    expect(salvaged.name).toHaveLength(60);
    expect(salvaged.role).toHaveLength(80);
    expect(salvaged.tagline).toHaveLength(120);
    expect(salvaged.bio).toHaveLength(600);
    expect(salvaged.location).toHaveLength(60);
  });

  it("fills missing top-level fields from the demo profile", () => {
    const salvaged = salvageProfile({ name: "Grace Hopper" });
    expect(salvaged.name).toBe("Grace Hopper");
    expect(salvaged.slug).toBe(createDemoProfile().slug);
    expect(salvaged.theme.theme).toBe("editorial");
  });

  it("keeps a half-typed url that fails validation, so a draft is never wiped", () => {
    // The renderer guards against unsafe URLs; salvage deliberately preserves
    // in-progress user content rather than silently deleting it.
    const salvaged = salvageProfile({ websiteUrl: "not a url yet" });
    expect(salvaged.websiteUrl).toBe("not a url yet");
  });

  it("still yields links that the render-safe filter rejects", () => {
    // ...and the guard actually works: an unsafe scheme survives salvage but is
    // dropped before it can reach an <a href>.
    const salvaged = salvageProfile({
      socials: [
        { id: "bad", platform: "github", url: "javascript:alert(1)", visible: true },
      ],
    }) as Profile;
    expect(salvaged.socials[0].url).toBe("javascript:alert(1)");
    expect(usableSocials(salvaged)).toHaveLength(0);
  });

  it("coerces and caps string arrays, dropping blanks and non-strings", () => {
    const salvaged = salvageProfile({
      skills: ["A", 42, "  ", "B".repeat(100), "C"],
      interests: "not-an-array",
    });
    expect(salvaged.skills).toEqual(["A", "B".repeat(32), "C"]);
    expect(salvaged.interests).toEqual([]);
  });

  it("caps skills at 24 entries", () => {
    const salvaged = salvageProfile({
      skills: Array.from({ length: 40 }, (_, i) => `s${i}`),
    });
    expect(salvaged.skills).toHaveLength(24);
  });

  it("coerces socials, substituting a safe platform and minting missing ids", () => {
    const salvaged = salvageProfile({
      socials: [
        { id: "keep", platform: "github", url: "https://github.com/ada", visible: false },
        { platform: "nonsense", url: "https://example.com" },
        { id: "no-url", platform: "email" },
        "garbage",
      ],
    });
    expect(salvaged.socials).toHaveLength(3);
    expect(salvaged.socials[0]).toMatchObject({ id: "keep", platform: "github" });
    // Unknown platform falls back to `portfolio`.
    expect(salvaged.socials[1].platform).toBe("portfolio");
    // A missing id is generated, not left undefined.
    expect(salvaged.socials[1].id.startsWith("social-")).toBe(true);
    expect(salvaged.socials[2].url).toBe("");
  });

  it("caps socials at 12 and projects at 6", () => {
    const salvaged = salvageProfile({
      socials: Array.from({ length: 20 }, () => ({ platform: "github" })),
      projects: Array.from({ length: 20 }, () => ({ title: "x" })),
    });
    expect(salvaged.socials).toHaveLength(12);
    expect(salvaged.projects).toHaveLength(6);
  });

  it("coerces projects, clamping strings and minting missing ids", () => {
    const salvaged = salvageProfile({
      projects: [{ title: "T".repeat(200), description: 9, url: null }],
    });
    const project = salvaged.projects[0];
    expect(project.title).toHaveLength(80);
    expect(project.description).toBe("");
    expect(project.url).toBe("");
    expect(project.id.startsWith("project-")).toBe(true);
  });

  it("coerces section flags, defaulting to shown", () => {
    expect(salvageProfile({ sections: { about: false, contact: "no" } }).sections).toEqual({
      projects: true,
      skills: true,
      about: false,
      contact: true,
    });
    expect(salvageProfile({}).sections).toEqual({
      projects: true,
      skills: true,
      about: true,
      contact: true,
    });
  });

  it("falls back every theme enum and keeps a valid accent", () => {
    const ok = salvageProfile({
      theme: { theme: "noir", accent: "#abcdef", fontPairing: "lora" },
    });
    expect(ok.theme).toEqual({
      theme: "noir",
      accent: "#abcdef",
      fontPairing: "lora",
      avatarShape: "circle",
      background: "subtle",
      socialStyle: "outline",
    });

    const bad = salvageProfile({
      theme: {
        theme: "?",
        fontPairing: "?",
        avatarShape: "?",
        background: "?",
        socialStyle: "?",
      },
    });
    expect(bad.theme).toEqual({
      theme: "editorial",
      accent: createDemoProfile().theme.accent,
      fontPairing: "geist",
      avatarShape: "circle",
      background: "subtle",
      socialStyle: "outline",
    });
  });

  it("falls back the layout enums and showQr flag", () => {
    expect(
      salvageProfile({ cardLayout: "nope", profileDesign: "nope", showQr: 0 }),
    ).toMatchObject({
      cardLayout: "classic",
      profileDesign: "editorial",
      showQr: true,
    });
  });
});
