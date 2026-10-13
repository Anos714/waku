import { afterEach, describe, expect, it } from "vitest";
import { siteUrl } from "@/lib/site";

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
