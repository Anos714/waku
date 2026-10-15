import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { extractResumePatch, sanitizePatch } from "@/lib/ai/resume";
import { geminiJsonCompletion } from "@/lib/ai/gemini";

vi.mock("@/lib/ai/gemini", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai/gemini")>();
  return { ...actual, geminiJsonCompletion: vi.fn() };
});

const mockGeminiJson = geminiJsonCompletion as unknown as ReturnType<typeof vi.fn>;

function groqPatchResponse(patch: unknown) {
  return {
    ok: true,
    json: async () => ({
      choices: [{ message: { content: JSON.stringify(patch) } }],
    }),
  };
}

const PATCH = {
  name: "Ada Lovelace",
  role: "Analytical Engineer",
  bio: "First programmer.",
  location: "London",
  websiteUrl: "https://ada.example.com",
  skills: ["Mathematics", "Poetry"],
  interests: [],
  projects: [
    {
      title: "Analytical Engine",
      description: "Computing notes.",
      url: "",
      tag: "Computing",
    },
  ],
};

describe("sanitizePatch", () => {
  it("clamps over-long strings and keeps valid data", () => {
    const { patch, warnings } = sanitizePatch({
      ...PATCH,
      name: "A".repeat(200),
      skills: ["ok", 42, "  ", "B".repeat(100)],
    });
    expect(patch.name).toHaveLength(60);
    // Non-string skills are dropped by the schema, blanks removed, long clamped.
    expect(patch.skills).toEqual(["ok", "B".repeat(32)]);
    expect(warnings).toEqual([]);
  });

  it("drops unsafe URLs with a warning, keeps safe ones", () => {
    const { patch, warnings } = sanitizePatch({
      ...PATCH,
      websiteUrl: "javascript:alert(1)",
      projects: [
        { title: "Good", description: "", url: "https://example.com/x", tag: "" },
        { title: "Bad", description: "", url: "javascript:alert(2)", tag: "" },
      ],
    });
    expect(patch.websiteUrl).toBe("");
    expect(patch.projects).toHaveLength(2);
    expect(patch.projects[0].url).toBe("https://example.com/x");
    expect(patch.projects[1].url).toBe("");
    expect(warnings).toHaveLength(2);
  });

  it("drops untitled projects and caps at six", () => {
    const { patch, warnings } = sanitizePatch({
      projects: [
        { title: "", description: "no title" },
        ...Array.from({ length: 7 }, (_, i) => ({ title: `P${i}` })),
      ],
    });
    expect(patch.projects).toHaveLength(6);
    expect(patch.projects[0].title).toBe("P0");
    expect(warnings.length).toBeGreaterThanOrEqual(2);
  });

  it("fills absent fields with empties", () => {
    const { patch } = sanitizePatch({});
    expect(patch).toMatchObject({
      name: "",
      role: "",
      bio: "",
      location: "",
      websiteUrl: "",
      skills: [],
      interests: [],
      projects: [],
    });
  });

  it("rejects a non-object payload", () => {
    expect(() => sanitizePatch("just a string")).toThrow("UNPARSEABLE_RESPONSE");
    expect(() => sanitizePatch(null)).toThrow("UNPARSEABLE_RESPONSE");
  });
});

describe("extractResumePatch", () => {
  const env = process.env as Record<string, string | undefined>;
  const realFetch = globalThis.fetch;
  const originalGroqKey = env.GROQ_API_KEY;
  const originalGeminiKey = env.GEMINI_API_KEY;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
    mockGeminiJson.mockReset();
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
    if (originalGroqKey === undefined) delete env.GROQ_API_KEY;
    else env.GROQ_API_KEY = originalGroqKey;
    if (originalGeminiKey === undefined) delete env.GEMINI_API_KEY;
    else env.GEMINI_API_KEY = originalGeminiKey;
    delete env.GROQ_MODEL;
    delete env.GROQ_MODELS;
  });

  const mockFetch = () => globalThis.fetch as unknown as ReturnType<typeof vi.fn>;

  it("throws MISSING_API_KEY when neither provider is configured", async () => {
    delete env.GROQ_API_KEY;
    delete env.GEMINI_API_KEY;
    await expect(extractResumePatch("Ada Lovelace, Engineer")).rejects.toThrow(
      "MISSING_API_KEY",
    );
  });

  it("throws NO_TEXT for empty resume text", async () => {
    env.GROQ_API_KEY = "test-key";
    await expect(extractResumePatch("   ")).rejects.toThrow("NO_TEXT");
    expect(mockFetch()).not.toHaveBeenCalled();
  });

  it("extracts via Groq with a facts-only prompt", async () => {
    env.GROQ_API_KEY = "test-key";
    delete env.GEMINI_API_KEY;
    mockFetch().mockResolvedValueOnce(groqPatchResponse(PATCH));

    const result = await extractResumePatch("Ada Lovelace resume text here");

    expect(result.patch.name).toBe("Ada Lovelace");
    expect(result.model).toBe("openai/gpt-oss-120b");
    const body = JSON.parse(
      (mockFetch().mock.calls[0][1] as RequestInit).body as string,
    );
    const prompt: string = body.messages
      .map((m: { content: string }) => m.content)
      .join("\n");
    expect(prompt).toContain("ONLY facts present in the resume");
    expect(prompt).toContain("Never invent");
    expect(prompt).toContain("Never use em dashes");
    const withoutRule = prompt
      .split("\n")
      .filter((line) => !line.includes("em dashes"))
      .join("\n");
    expect(withoutRule).not.toContain("—");
  });

  it("falls back to Gemini when every Groq model is busy", async () => {
    env.GROQ_API_KEY = "test-key";
    env.GEMINI_API_KEY = "test-key";
    mockFetch().mockResolvedValue({ ok: false, status: 503, json: async () => ({}) });
    mockGeminiJson.mockResolvedValueOnce(PATCH);

    const result = await extractResumePatch("Ada Lovelace resume text here");

    expect(result.patch.name).toBe("Ada Lovelace");
    expect(result.model).toBe("gemini-3.8-flash");
    expect(mockGeminiJson).toHaveBeenCalledOnce();
  });
});
