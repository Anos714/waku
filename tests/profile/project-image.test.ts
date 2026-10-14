import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { hasProjectImage, resolveProjectImageUrl } from "@/lib/profile/project-image";

const CLOUD_ENV = "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME";
let savedCloud: string | undefined;

beforeEach(() => {
  savedCloud = process.env[CLOUD_ENV];
});

afterEach(() => {
  if (savedCloud === undefined) delete process.env[CLOUD_ENV];
  else process.env[CLOUD_ENV] = savedCloud;
});

describe("resolveProjectImageUrl", () => {
  it("returns null for empty, non-string, or missing values", () => {
    expect(resolveProjectImageUrl("")).toBeNull();
    expect(resolveProjectImageUrl("   ")).toBeNull();
    expect(resolveProjectImageUrl(null)).toBeNull();
    expect(resolveProjectImageUrl(undefined)).toBeNull();
    expect(resolveProjectImageUrl(42)).toBeNull();
  });

  it("passes a safe https URL through unchanged", () => {
    expect(resolveProjectImageUrl("https://example.com/shot.png")).toBe(
      "https://example.com/shot.png",
    );
  });

  it("rejects unsafe schemes", () => {
    expect(resolveProjectImageUrl("javascript:alert(1)")).toBeNull();
    expect(resolveProjectImageUrl("data:text/html,x")).toBeNull();
  });

  it("turns an uploader public ID into a small Cloudinary thumbnail URL", () => {
    process.env[CLOUD_ENV] = "demo-cloud";
    expect(resolveProjectImageUrl("waku/demo-shot")).toBe(
      "https://res.cloudinary.com/demo-cloud/image/upload/w_256,c_fill,q_auto/waku/demo-shot",
    );
  });

  it("returns null for a public ID when Cloudinary is unconfigured", () => {
    delete process.env[CLOUD_ENV];
    expect(resolveProjectImageUrl("waku/demo-shot")).toBeNull();
  });
});

describe("hasProjectImage", () => {
  it("is true only for renderable values", () => {
    expect(hasProjectImage("https://example.com/shot.png")).toBe(true);
    expect(hasProjectImage("")).toBe(false);
    expect(hasProjectImage("javascript:alert(1)")).toBe(false);
  });
});
