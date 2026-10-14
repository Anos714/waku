// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The upload route picks a server-side allowlisted Cloudinary transform from
 * `kind`: `project` screenshots are downscaled without cropping, everything
 * else keeps the avatar face-crop. A forged kind must never reach Cloudinary.
 */

const REAL_FETCH = globalThis.fetch;
let seenPayloads: FormData[] = [];

function pngFile(name = "shot.png"): File {
  return new File(["fake-image-bytes"], name, { type: "image/png" });
}

async function postUpload(kind: string | null) {
  const { POST } = await import("@/app/api/upload/route");
  const form = new FormData();
  form.append("file", pngFile());
  if (kind !== null) form.append("kind", kind);
  const request = new Request("http://localhost/api/upload", {
    method: "POST",
    body: form,
  });
  return POST(request);
}

beforeEach(() => {
  process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
  process.env.CLOUDINARY_API_KEY = "test-key";
  process.env.CLOUDINARY_API_SECRET = "test-secret";
  seenPayloads = [];
  globalThis.fetch = (async (_url: unknown, init?: { body?: unknown }) => {
    seenPayloads.push(init?.body as FormData);
    return {
      ok: true,
      json: async () => ({
        public_id: "waku/test-shot",
        secure_url: "https://res.cloudinary.com/test-cloud/image/upload/test",
      }),
    };
  }) as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = REAL_FETCH;
  vi.resetModules();
});

describe("POST /api/upload kind", () => {
  it("uses the avatar transform when no kind is sent", async () => {
    const response = await postUpload(null);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(seenPayloads[0].get("transformation")).toBe(
      "w_512,c_thumb,g_face,q_auto",
    );
  });

  it("uses the uncropped project transform for kind=project", async () => {
    const response = await postUpload("project");
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.publicId).toBe("waku/test-shot");
    expect(seenPayloads[0].get("transformation")).toBe("w_800,c_limit,q_auto");
  });

  it("falls back to the avatar transform for a forged kind", async () => {
    const response = await postUpload("w_9999,c_fill");
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(seenPayloads[0].get("transformation")).toBe(
      "w_512,c_thumb,g_face,q_auto",
    );
  });
});
