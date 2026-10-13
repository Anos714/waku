import { describe, expect, it } from "vitest";
import { generateProfileSlug, kebabCase } from "@/lib/profile/slug";

describe("kebabCase", () => {
  it("lowercases and hyphen-joins words", () => {
    expect(kebabCase("Ada Lovelace")).toBe("ada-lovelace");
  });

  it("folds accents to ASCII", () => {
    expect(kebabCase("Hélène Cürling")).toBe("helene-curling");
  });

  it("collapses runs of non-alphanumerics into one hyphen", () => {
    expect(kebabCase("Some   ---weird!   spacing")).toBe("some-weird-spacing");
  });

  it("drops leading and trailing separators", () => {
    expect(kebabCase("---  Waku  ---")).toBe("waku");
  });

  it("returns an empty string when nothing usable survives", () => {
    expect(kebabCase("😀🌟")).toBe("");
    expect(kebabCase("日本語")).toBe("");
  });

  it("keeps digits", () => {
    expect(kebabCase("Node 20 LTS")).toBe("node-20-lts");
  });
});

describe("generateProfileSlug", () => {
  it("appends a random lowercase-alphanumeric suffix", () => {
    const slug = generateProfileSlug("Ada Lovelace");
    expect(slug).toMatch(/^ada-lovelace-[a-z0-9]{6}$/);
  });

  it("falls back to the `profile` prefix for unusable names", () => {
    expect(generateProfileSlug("😀")).toMatch(/^profile-[a-z0-9]{6}$/);
  });

  it("caps the prefix at 40 characters plus the suffix", () => {
    const long = "a".repeat(120);
    const slug = generateProfileSlug(long);
    // 40-char prefix + hyphen + 6-char suffix.
    expect(slug.length).toBe(47);
    expect(slug.slice(0, 40)).toBe("a".repeat(40));
  });

  it("never leaves a trailing hyphen before the suffix", () => {
    // A name that ends exactly on a word boundary would otherwise yield
    // "name--suffix".
    const slug = generateProfileSlug("Ada Lovelace ");
    expect(slug).not.toMatch(/--/);
  });

  it("produces different suffixes across calls", () => {
    const a = generateProfileSlug("Ada Lovelace");
    const b = generateProfileSlug("Ada Lovelace");
    expect(a).not.toBe(b);
  });
});
