import { afterEach, describe, expect, it } from "vitest";
import { mailto, siteUrl } from "@/lib/site";

describe("siteUrl", () => {
  const original = process.env.NEXT_PUBLIC_SITE_URL;

  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = original;
  });

  it("defaults to the dev origin when the variable is unset", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(siteUrl()).toBe("http://localhost:3000");
  });

  it("returns the configured origin in production", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://waku.example.com";
    expect(siteUrl()).toBe("https://waku.example.com");
  });

  it("trims and strips a single trailing slash", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "  https://waku.example.com/  ";
    expect(siteUrl()).toBe("https://waku.example.com");
  });

  it("falls back to the dev origin for an unparsable value", () => {
    // An invalid string would otherwise throw inside app/layout.tsx and break
    // the whole app.
    process.env.NEXT_PUBLIC_SITE_URL = "not a url";
    expect(siteUrl()).toBe("http://localhost:3000");
  });

  it("falls back for a blank value", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "   ";
    expect(siteUrl()).toBe("http://localhost:3000");
  });
});

describe("mailto", () => {
  it("builds a bare address when nothing else is given", () => {
    expect(mailto("hi@example.com")).toBe("mailto:hi@example.com");
  });

  it("appends an encoded subject", () => {
    expect(mailto("hi@example.com", "Hello there")).toBe(
      "mailto:hi@example.com?subject=Hello%20there",
    );
  });

  it("encodes newlines in the body as %0A", () => {
    // A literal newline in a mailto body truncates the message in some clients,
    // so it must be percent-encoded rather than passed through raw.
    const link = mailto("hi@example.com", undefined, "First line\nSecond line");
    expect(link).toBe("mailto:hi@example.com?body=First%20line%0ASecond%20line");
  });

  it("combines subject and body", () => {
    expect(mailto("hi@example.com", "Hi", "Body text")).toBe(
      "mailto:hi@example.com?subject=Hi&body=Body%20text",
    );
  });

  it("encodes reserved characters so the link stays a link", () => {
    expect(mailto("hi@example.com", "A & B?", "C=D")).toBe(
      "mailto:hi@example.com?subject=A%20%26%20B%3F&body=C%3DD",
    );
  });
});
