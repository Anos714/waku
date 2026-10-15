import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateProfileCopy, hasAnyAiKey } from "@/lib/ai/provider";
import { generateGroqCopy, hasGroqKey } from "@/lib/ai/groq";
import { generateProfileCopy as generateGeminiCopy } from "@/lib/ai/gemini";
import type { AiGenerationInput } from "@/types";

vi.mock("@/lib/ai/groq", () => ({
  generateGroqCopy: vi.fn(),
  hasGroqKey: vi.fn(),
}));

vi.mock("@/lib/ai/gemini", () => ({
  generateProfileCopy: vi.fn(),
  hasApiKey: vi.fn(),
}));

const INPUT: AiGenerationInput = {
  type: "tagline",
  role: "Analytical Engineer",
  skills: [],
  interests: [],
  style: "minimal",
};

const mockGroqCopy = generateGroqCopy as unknown as ReturnType<typeof vi.fn>;
const mockGroqKey = hasGroqKey as unknown as ReturnType<typeof vi.fn>;
const mockGeminiCopy = generateGeminiCopy as unknown as ReturnType<typeof vi.fn>;

describe("provider order", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("uses Groq when configured and never touches Gemini", async () => {
    mockGroqKey.mockReturnValue(true);
    mockGroqCopy.mockResolvedValueOnce({
      variations: [{ id: "v-0", text: "Groq line." }],
      model: "openai/gpt-oss-120b",
    });

    const result = await generateProfileCopy(INPUT);

    expect(result.model).toBe("openai/gpt-oss-120b");
    expect(mockGroqCopy).toHaveBeenCalledWith(INPUT);
    expect(mockGeminiCopy).not.toHaveBeenCalled();
  });

  it("falls back to Gemini only when every Groq model is busy", async () => {
    mockGroqKey.mockReturnValue(true);
    mockGroqCopy.mockRejectedValueOnce(new Error("ALL_MODELS_UNAVAILABLE"));
    mockGeminiCopy.mockResolvedValueOnce({
      variations: [{ id: "v-0", text: "Gemini line." }],
      model: "gemini-3.8-flash",
    });

    const result = await generateProfileCopy(INPUT);

    expect(result.model).toBe("gemini-3.8-flash");
    expect(mockGeminiCopy).toHaveBeenCalledWith(INPUT);
  });

  it("does not hide a Groq auth failure behind the Gemini fallback", async () => {
    mockGroqKey.mockReturnValue(true);
    mockGroqCopy.mockRejectedValueOnce(new Error("GROQ_AUTH_FAILED"));

    await expect(generateProfileCopy(INPUT)).rejects.toThrow("GROQ_AUTH_FAILED");
    expect(mockGeminiCopy).not.toHaveBeenCalled();
  });

  it("goes straight to Gemini when Groq is unconfigured", async () => {
    mockGroqKey.mockReturnValue(false);
    mockGeminiCopy.mockResolvedValueOnce({
      variations: [{ id: "v-0", text: "Gemini line." }],
      model: "gemini-3.8-flash",
    });

    await generateProfileCopy(INPUT);

    expect(mockGroqCopy).not.toHaveBeenCalled();
    expect(mockGeminiCopy).toHaveBeenCalledWith(INPUT);
  });

  it("hasAnyAiKey is true when either provider is configured", async () => {
    const { hasApiKey } = await import("@/lib/ai/gemini");
    const mockGeminiKey = hasApiKey as unknown as ReturnType<typeof vi.fn>;

    mockGroqKey.mockReturnValue(false);
    mockGeminiKey.mockReturnValue(false);
    expect(hasAnyAiKey()).toBe(false);

    mockGeminiKey.mockReturnValue(true);
    expect(hasAnyAiKey()).toBe(true);

    mockGroqKey.mockReturnValue(true);
    mockGeminiKey.mockReturnValue(false);
    expect(hasAnyAiKey()).toBe(true);
  });
});
