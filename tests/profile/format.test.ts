import { describe, expect, it } from "vitest";
import {
  clampText,
  displayHandle,
  hasAvatar,
  initials,
  isCloudinaryPublicId,
  isValidAvatarUrl,
  parseListInput,
  prettyUrl,
  profilePath,
  usableSocials,
  visibleSocials,
} from "@/lib/profile/format";
import { createDemoProfile } from "@/lib/profile/demo";
import type { Profile, SocialLink } from "@/types";

describe("profilePath", () => {
  it("builds the relative public path", () => {
    expect(profilePath("ada")).toBe("/p/ada");
  });

  it("URL-encodes characters that are not slug-safe", () => {
    expect(profilePath("a b")).toBe("/p/a%20b");
  });
});

describe("initials", () => {
  it("takes the first letter of the first two words", () => {
    expect(initials("Ada Lovelace")).toBe("AL");
  });

  it("uses a single letter for one word", () => {
    expect(initials("Waku")).toBe("W");
  });

  it("crops to two initials for long names", () => {
    expect(initials("Ada Augusta Byron Lovelace")).toBe("AA");
  });

  it("falls back to an em dash for blank input", () => {
    expect(initials("   ")).toBe("—");
  });
});

describe("parseListInput", () => {
  it("splits, trims and drops empties", () => {
    expect(parseListInput(" TypeScript , Design , ")).toEqual([
      "TypeScript",
      "Design",
    ]);
  });

  it("returns an empty array for blank input", () => {
    expect(parseListInput(" , , ")).toEqual([]);
  });

  it("caps the list at 24 entries", () => {
    const input = Array.from({ length: 30 }, (_, i) => `s${i}`).join(",");
    expect(parseListInput(input)).toHaveLength(24);
  });
});

describe("visibleSocials / usableSocials", () => {
  const make = (socials: SocialLink[]): Profile => ({
    ...createDemoProfile(),
    socials,
  });

  it("visibleSocials keeps visible links with a non-empty url", () => {
    const profile = make([
      { id: "1", platform: "github", label: "", url: "https://github.com/a", visible: true },
      { id: "2", platform: "github", label: "", url: "", visible: true },
      { id: "3", platform: "github", label: "", url: "https://github.com/b", visible: false },
    ]);
    expect(visibleSocials(profile).map((l) => l.id)).toEqual(["1"]);
  });

  it("usableSocials drops unsafe-scheme links and rewrites urls to safe absolute form", () => {
    const profile = make([
      { id: "1", platform: "github", label: "", url: "github.com/ada", visible: true },
      { id: "2", platform: "github", label: "", url: "javascript:alert(1)", visible: true },
      { id: "3", platform: "email", label: "", url: "mailto:ada@example.com", visible: true },
    ]);
    const usable = usableSocials(profile);
    expect(usable.map((l) => l.id)).toEqual(["1", "3"]);
    expect(usable[0].url).toBe("https://github.com/ada");
  });
});

describe("displayHandle", () => {
  it("prefers an explicit label", () => {
    expect(displayHandle({ id: "1", platform: "github", label: "My GitHub", url: "https://github.com/ada", visible: true })).toBe("My GitHub");
  });

  it("falls back to a prettified url", () => {
    expect(displayHandle({ id: "1", platform: "github", label: "  ", url: "https://www.github.com/ada/", visible: true })).toBe("github.com/ada");
  });
});

describe("prettyUrl", () => {
  it("drops the scheme, leading www. and trailing slash", () => {
    expect(prettyUrl("https://www.example.com/ada/")).toBe("example.com/ada");
  });

  it("reduces mailto: to the bare address", () => {
    expect(prettyUrl("mailto:ada@example.com")).toBe("ada@example.com");
  });

  it("keeps scheme-less input readable", () => {
    expect(prettyUrl("example.com/ada")).toBe("example.com/ada");
  });

  it("returns unusable input untouched rather than mangling it", () => {
    expect(prettyUrl("not a url")).toBe("not a url");
  });
});

describe("clampText", () => {
  it("returns short text unchanged", () => {
    expect(clampText("short", 20)).toBe("short");
  });

  it("truncates at a word boundary and adds an ellipsis", () => {
    expect(clampText("one two three", 10)).toBe("one two…");
  });

  it("truncates mid-word when there is no earlier space", () => {
    expect(clampText("abcdefghij", 6)).toBe("abcde…");
  });
});

describe("avatar helpers", () => {
  it("isValidAvatarUrl accepts http(s) urls and rejects other shapes", () => {
    expect(isValidAvatarUrl("https://example.com/a.png")).toBe(true);
    expect(isValidAvatarUrl("javascript:alert(1)")).toBe(false);
    expect(isValidAvatarUrl("")).toBe(false);
    expect(isValidAvatarUrl("   ")).toBe(false);
  });

  it("isCloudinaryPublicId recognises a bare public id, not a url", () => {
    expect(isCloudinaryPublicId("waku/avatars/abc123")).toBe(true);
    expect(isCloudinaryPublicId("https://res.cloudinary.com/x")).toBe(false);
  });

  it("hasAvatar accepts both delivery shapes", () => {
    expect(hasAvatar("waku/avatars/abc123")).toBe(true);
    expect(hasAvatar("https://example.com/a.png")).toBe(true);
    expect(hasAvatar("")).toBe(false);
  });
});
