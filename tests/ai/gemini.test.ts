import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateProfileCopy, resolveModelCascade } from "@/lib/ai/gemini";
import type { AiGenerationInput } from "@/types";

const mockGenerateContent = vi.fn();

vi.mock("@google/genai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@google/genai")>();
  // Only the client is faked; `Type` and the rest stay real so the response
  // schema is built exactly as in production.
  return {
    ...actual,
    GoogleGenAI: class MockGoogleGenAI {
      models = { generateContent: mockGenerateContent };
    },
  };
});

const INPUT: AiGenerationInput = {
  type: "bio",
  role: "Analytical Engineer",
  skills: ["Mathematics"],
  interests: ["Poetry"],
  style: "professional",
  name: "Ada Lovelace",
};

const SUCCESS_PAYLOAD = {
  text: JSON.stringify({
    variations: ["First variation.", "Second variation.", "Third variation."],
  }),
};

const busy = (status: number) =>
  Object.assign(new Error("The model is overloaded"), { status });

describe("resolveModelCascade", () => {
  const env = process.env as Record<string, string | undefined>;
  const originalModel = env.GEMINI_MODEL;
  const originalModels = env.GEMINI_MODELS;

  afterEach(() => {
    if (originalModel === undefined) delete env.GEMINI_MODEL;
    else env.GEMINI_MODEL = originalModel;
    if (originalModels === undefined) delete env.GEMINI_MODELS;
    else env.GEMINI_MODELS = originalModels;
  });

  it("starts at gemini-3.8-flash and falls back through the 3.x family", () => {
    delete env.GEMINI_MODEL;
    delete env.GEMINI_MODELS;
    expect(resolveModelCascade()).toEqual([
      "gemini-3.8-flash",
      "gemini-3.5-flash",
      "gemini-3.7-flash",
    ]);
  });

  it("promotes GEMINI_MODEL to the front without losing the fallbacks", () => {
    env.GEMINI_MODEL = "gemini-3.5-flash";
    delete env.GEMINI_MODELS;
    // The user's pick leads, and the duplicate is dropped.
    expect(resolveModelCascade()).toEqual([
      "gemini-3.5-flash",
      "gemini-3.8-flash",
      "gemini-3.7-flash",
    ]);
  });

  it("replaces the whole cascade with GEMINI_MODELS", () => {
    env.GEMINI_MODELS = " gemini-pro, gemini-flash-latest ";
    expect(resolveModelCascade()).toEqual(["gemini-pro", "gemini-flash-latest"]);
  });

  it("ignores a blank GEMINI_MODELS value", () => {
    env.GEMINI_MODELS = "   ,  ";
    expect(resolveModelCascade()).toContain("gemini-3.8-flash");
  });
});

describe("generateProfileCopy cascade", () => {
  const env = process.env as Record<string, string | undefined>;

  beforeEach(() => {
    env.GEMINI_API_KEY = "test-key";
    delete env.GEMINI_MODEL;
    delete env.GEMINI_MODELS;
    mockGenerateContent.mockReset();
  });

  const usedModels = () =>
    mockGenerateContent.mock.calls.map((call) => (call[0] as { model: string }).model);

  it("succeeds on the first model and reports which one won", async () => {
    mockGenerateContent.mockResolvedValueOnce(SUCCESS_PAYLOAD);

    const result = await generateProfileCopy(INPUT);

    expect(result.model).toBe("gemini-3.8-flash");
    expect(result.variations).toHaveLength(3);
    expect(usedModels()).toEqual(["gemini-3.8-flash"]);
  });

  it("falls through to the next model on a 503", async () => {
    mockGenerateContent
      .mockRejectedValueOnce(busy(503))
      .mockResolvedValueOnce(SUCCESS_PAYLOAD);

    const result = await generateProfileCopy(INPUT);

    expect(usedModels()).toEqual(["gemini-3.8-flash", "gemini-3.5-flash"]);
    expect(result.model).toBe("gemini-3.5-flash");
  });

  it("falls through on a 429 rate limit too", async () => {
    mockGenerateContent
      .mockRejectedValueOnce(busy(429))
      .mockResolvedValueOnce(SUCCESS_PAYLOAD);

    const result = await generateProfileCopy(INPUT);

    expect(result.model).toBe("gemini-3.5-flash");
  });

  it("tries every model, then reports ALL_MODELS_UNAVAILABLE", async () => {
    mockGenerateContent.mockRejectedValue(busy(503));

    await expect(generateProfileCopy(INPUT)).rejects.toThrow("ALL_MODELS_UNAVAILABLE");
    expect(usedModels()).toHaveLength(3);
  });

  it("does not retry a non-capacity error", async () => {
    const badRequest = Object.assign(new Error("Bad request"), { status: 400 });
    mockGenerateContent.mockRejectedValueOnce(badRequest);

    // A different model would not fix a malformed request, so it surfaces now.
    await expect(generateProfileCopy(INPUT)).rejects.toThrow("Bad request");
    expect(usedModels()).toEqual(["gemini-3.8-flash"]);
  });

  it("surfaces an unusable response instead of burning the fallbacks", async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: "" });

    await expect(generateProfileCopy(INPUT)).rejects.toThrow("EMPTY_RESPONSE");
    expect(usedModels()).toHaveLength(1);
  });

  it("refuses to run without an API key", async () => {
    delete env.GEMINI_API_KEY;
    await expect(generateProfileCopy(INPUT)).rejects.toThrow("MISSING_API_KEY");
    expect(mockGenerateContent).not.toHaveBeenCalled();
  });
});
