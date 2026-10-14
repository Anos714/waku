import { describe, expect, it } from "vitest";
import {
  featuredProjectSchema,
  isSafeUrl,
  profileSchema,
  safeExternalUrl,
  sanitizeText,
} from "@/lib/validation/profile";
import { createDemoProfile } from "@/lib/profile/demo";

describe("isSafeUrl", () => {
  it.each([
    ["https://example.com", true],
    ["http://example.com", true],
    ["mailto:ada@example.com", true],
    ["tel:+441234567890", true],
  ])("allows the navigable scheme %s", (value, expected) => {
    expect(isSafeUrl(value)).toBe(expected);
  });

  it.each([
    ["javascript:alert(1)"],
    ["JavaScript:alert(1)"],
    ["data:text/html,<script>alert(1)</script>"],
    ["file:///etc/passwd"],
    ["vbscript:msgbox('x')"],
  ])("rejects the unsafe scheme %s", (value) => {
    expect(isSafeUrl(value)).toBe(false);
  });

  it("treats a scheme-less domain as https", () => {
    expect(isSafeUrl("example.com/ada")).toBe(true);
  });

  it("rejects empty and whitespace-only input", () => {
    expect(isSafeUrl("")).toBe(false);
    expect(isSafeUrl("   ")).toBe(false);
  });

  it("rejects unparseable text", () => {
    expect(isSafeUrl("not a url at all")).toBe(false);
  });
});

describe("safeExternalUrl", () => {
  it("returns null for empty input", () => {
    expect(safeExternalUrl("")).toBeNull();
  });

  it("returns null for unsafe schemes", () => {
    expect(safeExternalUrl("javascript:alert(1)")).toBeNull();
    expect(safeExternalUrl("data:text/html,x")).toBeNull();
  });

  it("upgrades a scheme-less domain to https and returns the absolute url", () => {
    expect(safeExternalUrl("example.com/ada")).toBe("https://example.com/ada");
  });

  it("preserves the mailto scheme without forcing https", () => {
    expect(safeExternalUrl("mailto:ada@example.com")).toBe(
      "mailto:ada@example.com",
    );
  });

  it("trims surrounding whitespace", () => {
    // WHATWG URL normalises a bare origin to its trailing slash.
    expect(safeExternalUrl("  https://example.com  ")).toBe(
      "https://example.com/",
    );
  });
});

describe("sanitizeText", () => {
  it("collapses whitespace runs and trims", () => {
    expect(sanitizeText("  hello   world  ")).toBe("hello world");
  });
});

describe("featuredProjectSchema imageUrl", () => {
  const base = { id: "p1", title: "T", description: "", url: "", tag: "" };

  it("defaults a missing imageUrl to empty (legacy drafts keep working)", () => {
    expect(featuredProjectSchema.parse(base).imageUrl).toBe("");
  });

  it("accepts an empty or a safe https image URL", () => {
    expect(
      featuredProjectSchema.parse({ ...base, imageUrl: "" }).imageUrl,
    ).toBe("");
    expect(
      featuredProjectSchema.parse({ ...base, imageUrl: "https://example.com/shot.png" })
        .imageUrl,
    ).toBe("https://example.com/shot.png");
  });

  it("rejects unsafe schemes like javascript:", () => {
    expect(() =>
      featuredProjectSchema.parse({ ...base, imageUrl: "javascript:alert(1)" }),
    ).toThrow();
  });

  it("backfills imageUrl when a full legacy profile is validated", () => {
    const legacy = createDemoProfile();
    for (const project of legacy.projects) {
      delete (project as unknown as Record<string, unknown>).imageUrl;
    }
    const parsed = profileSchema.parse(legacy);
    expect(parsed.projects.length).toBeGreaterThan(0);
    for (const project of parsed.projects) {
      expect(project.imageUrl).toBe("");
    }
  });
});
