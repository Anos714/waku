import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  generateGroqCopy,
  hasGroqKey,
  resolveGroqCascade,
} from "@/lib/ai/groq";
import type { AiGenerationInput } from "@/types";

const INPUT: AiGenerationInput = {
  type: "bio",
  role: "Analytical Engineer",
  skills: ["Mathematics"],
  interests: ["Poetry"],
  style: "professional",
  name: "Ada Lovelace",
};

function okResponse(variations: string[]) {
  return {
    ok: true,
    json: async () => ({
      choices: [{ message: { content: JSON.stringify({ variations }) } }],
    }),
  };
}

function httpError(status: number) {
  return { ok: false, status, json: async () => ({}) };
}

const VARIATIONS = ["First variation.", "Second variation.", "Third variation."];

describe("resolveGroqCascade", () => {
  const env = process.env as Record<string, string | undefined>;
  const originalModel = env.GROQ_MODEL;
  const originalModels = env.GROQ_MODELS;

  afterEach(() => {
    if (originalModel === undefined) delete env.GROQ_MODEL;
    else env.GROQ_MODEL = originalModel;
    if (originalModels === undefined) delete env.GROQ_MODELS;
    else env.GROQ_MODELS = originalModels;
  });

  it("leads with gpt-oss-120b and falls back to gpt-oss-20b", () => {
    delete env.GROQ_MODEL;
    delete env.GROQ_MODELS;
    expect(resolveGroqCascade()).toEqual([
      "openai/gpt-oss-120b",
      "openai/gpt-oss-20b",
    ]);
  });

  it("promotes GROQ_MODEL to the front without losing the fallbacks", () => {
    env.GROQ_MODEL = "openai/gpt-oss-20b";
    delete env.GROQ_MODELS;
    expect(resolveGroqCascade()).toEqual([
      "openai/gpt-oss-20b",
      "openai/gpt-oss-120b",
    ]);
  });

  it("replaces the whole cascade with GROQ_MODELS", () => {
    env.GROQ_MODELS = " model-a, model-b ";
    expect(resolveGroqCascade()).toEqual(["model-a", "model-b"]);
  });

  it("ignores a blank GROQ_MODELS value", () => {
    env.GROQ_MODELS = "   ,  ";
    expect(resolveGroqCascade()).toContain("openai/gpt-oss-120b");
  });
});

describe("generateGroqCopy", () => {
  const env = process.env as Record<string, string | undefined>;
  const realFetch = globalThis.fetch;

  beforeEach(() => {
    env.GROQ_API_KEY = "test-key";
    delete env.GROQ_MODEL;
    delete env.GROQ_MODELS;
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
    delete env.GROQ_API_KEY;
  });

  const mockFetch = () => globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
  const usedModels = () =>
    mockFetch().mock.calls.map((call) => JSON.parse(call[1].body as string).model as string);

  it("refuses to run without an API key", async () => {
    delete env.GROQ_API_KEY;
    expect(hasGroqKey()).toBe(false);
    await expect(generateGroqCopy(INPUT)).rejects.toThrow("MISSING_GROQ_KEY");
    expect(mockFetch()).not.toHaveBeenCalled();
  });

  it("posts JSON-mode chat completions and reports the winning model", async () => {
    mockFetch().mockResolvedValueOnce(okResponse(VARIATIONS));

    const result = await generateGroqCopy(INPUT);

    expect(result.model).toBe("openai/gpt-oss-120b");
    expect(result.variations).toHaveLength(3);
    const [url, init] = mockFetch().mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect(init.headers).toMatchObject({ Authorization: "Bearer test-key" });
    const body = JSON.parse(init.body as string);
    expect(body.response_format).toEqual({ type: "json_object" });
    expect(body.model).toBe("openai/gpt-oss-120b");
  });

  it("falls through to the next model on a 429", async () => {
    mockFetch()
      .mockResolvedValueOnce(httpError(429))
      .mockResolvedValueOnce(okResponse(VARIATIONS));

    const result = await generateGroqCopy(INPUT);

    expect(usedModels()).toEqual(["openai/gpt-oss-120b", "openai/gpt-oss-20b"]);
    expect(result.model).toBe("openai/gpt-oss-20b");
  });

  it("treats a dead network like a busy model and tries the next one", async () => {
    mockFetch()
      .mockRejectedValueOnce(new Error("fetch failed"))
      .mockResolvedValueOnce(okResponse(VARIATIONS));

    const result = await generateGroqCopy(INPUT);

    expect(usedModels()).toEqual(["openai/gpt-oss-120b", "openai/gpt-oss-20b"]);
    expect(result.variations).toHaveLength(3);
  });

  it("tries every model, then reports ALL_MODELS_UNAVAILABLE", async () => {
    mockFetch().mockResolvedValue(httpError(503));

    await expect(generateGroqCopy(INPUT)).rejects.toThrow("ALL_MODELS_UNAVAILABLE");
    expect(usedModels()).toHaveLength(2);
  });

  it("surfaces an auth failure instead of burning the fallbacks", async () => {
    mockFetch().mockResolvedValueOnce(httpError(401));

    // A bad key must never fail silently into a fallback.
    await expect(generateGroqCopy(INPUT)).rejects.toThrow("GROQ_AUTH_FAILED");
    expect(usedModels()).toEqual(["openai/gpt-oss-120b"]);
  });

  it("surfaces an unusable response instead of retrying", async () => {
    mockFetch().mockResolvedValueOnce(okResponse([]));

    await expect(generateGroqCopy(INPUT)).rejects.toThrow("NO_USABLE_VARIATIONS");
    expect(usedModels()).toHaveLength(1);
  });
});
