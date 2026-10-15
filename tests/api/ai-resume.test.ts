import { beforeEach, describe, expect, it, vi } from "vitest";
import { extractResumePatch, hasAnyResumeKey } from "@/lib/ai/resume";

vi.mock("@/lib/ai/resume", () => ({
  extractResumePatch: vi.fn(),
  hasAnyResumeKey: vi.fn(),
  MAX_RESUME_CHARS: 12000,
}));

const mockExtractPatch = extractResumePatch as unknown as ReturnType<typeof vi.fn>;
const mockHasKey = hasAnyResumeKey as unknown as ReturnType<typeof vi.fn>;

async function postText(text: unknown) {
  const { POST } = await import("@/app/api/ai/resume/route");
  return POST(
    new Request("http://localhost/api/ai/resume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    }),
  );
}

const PATCH = {
  name: "Ada Lovelace",
  role: "Analytical Engineer",
  bio: "First programmer.",
  location: "",
  websiteUrl: "",
  skills: ["Mathematics"],
  interests: [],
  projects: [],
};

describe("POST /api/ai/resume", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.resetModules();
    mockHasKey.mockReturnValue(true);
    mockExtractPatch.mockResolvedValue({ patch: PATCH, warnings: [], model: "m" });
  });

  it("reports MISSING_API_KEY when no provider is configured", async () => {
    mockHasKey.mockReturnValue(false);
    const response = await postText("Ada Lovelace ".repeat(20));
    const body = await response.json();
    expect(response.status).toBe(503);
    expect(body.code).toBe("MISSING_API_KEY");
    expect(mockExtractPatch).not.toHaveBeenCalled();
  });

  it("rejects a missing body", async () => {
    const { POST } = await import("@/app/api/ai/resume/route");
    const response = await POST(
      new Request("http://localhost/api/ai/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not-json{{{",
      }),
    );
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.code).toBe("BAD_BODY");
  });

  it("rejects text too short to be a resume", async () => {
    const response = await postText("hi");
    const body = await response.json();
    expect(response.status).toBe(422);
    expect(body.code).toBe("NO_TEXT");
    expect(mockExtractPatch).not.toHaveBeenCalled();
  });

  it("returns the patch for review without storing anything", async () => {
    const response = await postText("Ada Lovelace ".repeat(20));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.patch.name).toBe("Ada Lovelace");
    expect(body.model).toBe("m");
    expect(body.warnings).toEqual([]);
  });

  it("maps a busy-models failure to 503", async () => {
    mockExtractPatch.mockRejectedValueOnce(new Error("ALL_MODELS_UNAVAILABLE"));
    const response = await postText("Ada Lovelace ".repeat(20));
    const body = await response.json();
    expect(response.status).toBe(503);
    expect(body.code).toBe("ALL_MODELS_UNAVAILABLE");
  });

  it("maps an auth failure to a key hint", async () => {
    mockExtractPatch.mockRejectedValueOnce(new Error("GROQ_AUTH_FAILED"));
    const response = await postText("Ada Lovelace ".repeat(20));
    const body = await response.json();
    expect(response.status).toBe(500);
    expect(body.code).toBe("GROQ_AUTH_FAILED");
  });
});
