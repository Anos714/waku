import { afterEach, describe, expect, it } from "vitest";
import { mailto, publicHost, siteUrl } from "@/lib/site";

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

describe("publicHost", () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const originalVercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL;

  afterEach(() => {
    if (originalSiteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
    if (originalVercelUrl === undefined) delete process.env.NEXT_PUBLIC_VERCEL_URL;
    else process.env.NEXT_PUBLIC_VERCEL_URL = originalVercelUrl;
  });

  it("falls back to the live deploy when nothing is configured", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_VERCEL_URL;
    expect(publicHost()).toBe("wakucards.vercel.app");
  });

  it("reads the host out of a full NEXT_PUBLIC_SITE_URL", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://wakucards.vercel.app";
    delete process.env.NEXT_PUBLIC_VERCEL_URL;
    expect(publicHost()).toBe("wakucards.vercel.app");
  });

  it("parses Vercel's protocol-less VERCEL_URL", () => {
    // Vercel sets this without a scheme, so a bare host must still parse
    // instead of throwing and falling back.
    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_VERCEL_URL = "waku-git-main.vercel.app";
    expect(publicHost()).toBe("waku-git-main.vercel.app");
  });

  it("prefers the explicit site URL over Vercel's", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://custom.example.com";
    process.env.NEXT_PUBLIC_VERCEL_URL = "wakucards.vercel.app";
    expect(publicHost()).toBe("custom.example.com");
  });

  it("keeps a dev port so localhost previews stay honest", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    delete process.env.NEXT_PUBLIC_VERCEL_URL;
    expect(publicHost()).toBe("localhost:3000");
  });

  it("falls back for an unparsable value", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "not a url at all";
    delete process.env.NEXT_PUBLIC_VERCEL_URL;
    expect(publicHost()).toBe("wakucards.vercel.app");
  });
});
