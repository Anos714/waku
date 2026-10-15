// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { extractPdfText, extractResumePatch, hasAnyResumeKey } from "@/lib/ai/resume";

vi.mock("@/lib/ai/resume", () => ({
  extractPdfText: vi.fn(),
  extractResumePatch: vi.fn(),
  hasAnyResumeKey: vi.fn(),
  MAX_RESUME_CHARS: 12000,
}));

const mockExtractText = extractPdfText as unknown as ReturnType<typeof vi.fn>;
const mockExtractPatch = extractResumePatch as unknown as ReturnType<typeof vi.fn>;
const mockHasKey = hasAnyResumeKey as unknown as ReturnType<typeof vi.fn>;

function pdfFile(size = 1024): File {
  return new File([new Uint8Array(size)], "resume.pdf", {
    type: "application/pdf",
  });
}

async function postFile(file: File | null) {
  const { POST } = await import("@/app/api/ai/resume/route");
  const form = new FormData();
  if (file) form.append("file", file);
  return POST(
    new Request("http://localhost/api/ai/resume", { method: "POST", body: form }),
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
    mockExtractText.mockResolvedValue("Ada Lovelace ".repeat(20));
    mockExtractPatch.mockResolvedValue({ patch: PATCH, warnings: [], model: "m" });
  });

  it("reports MISSING_API_KEY when no provider is configured", async () => {
    mockHasKey.mockReturnValue(false);
    const response = await postFile(pdfFile());
    const body = await response.json();
    expect(response.status).toBe(503);
    expect(body.code).toBe("MISSING_API_KEY");
    expect(mockExtractText).not.toHaveBeenCalled();
  });

  it("rejects a missing file", async () => {
    const response = await postFile(null);
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.code).toBe("NO_FILE");
  });

  it("rejects a non-PDF upload", async () => {
    const png = new File([new Uint8Array(100)], "shot.png", { type: "image/png" });
    const response = await postFile(png);
    const body = await response.json();
    expect(response.status).toBe(415);
    expect(body.code).toBe("UNSUPPORTED_TYPE");
  });

  it("rejects an oversized resume", async () => {
    const response = await postFile(pdfFile(6 * 1024 * 1024));
    const body = await response.json();
    expect(response.status).toBe(413);
    expect(body.code).toBe("FILE_TOO_LARGE");
  });

  it("returns the patch for review without storing anything", async () => {
    const response = await postFile(pdfFile());
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.patch.name).toBe("Ada Lovelace");
    expect(body.model).toBe("m");
    expect(body.warnings).toEqual([]);
  });

  it("maps a busy-models failure to 503", async () => {
    mockExtractPatch.mockRejectedValueOnce(new Error("ALL_MODELS_UNAVAILABLE"));
    const response = await postFile(pdfFile());
    const body = await response.json();
    expect(response.status).toBe(503);
    expect(body.code).toBe("ALL_MODELS_UNAVAILABLE");
  });

  it("maps an unreadable PDF to 422", async () => {
    mockExtractText.mockRejectedValueOnce(new Error("PDF_PARSE_FAILED"));
    const response = await postFile(pdfFile());
    const body = await response.json();
    expect(response.status).toBe(422);
    expect(body.code).toBe("PDF_PARSE_FAILED");
  });
});
