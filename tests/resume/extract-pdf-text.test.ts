import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { extractPdfTextFromFile } from "@/lib/resume/extract-pdf-text";

describe("extractPdfTextFromFile", () => {
  it("extracts text from a minimal PDF", async () => {
    const bytes = readFileSync("tests/fixtures/minimal-resume.pdf");
    const file = new File([new Uint8Array(bytes)], "resume.pdf", {
      type: "application/pdf",
    });

    const text = await extractPdfTextFromFile(file);

    expect(text).toContain("Ada Lovelace");
    expect(text).toContain("Analytical Engineer");
  });

  it("rejects a non-PDF file", async () => {
    const file = new File(["not a pdf at all"], "notes.txt", {
      type: "text/plain",
    });

    await expect(extractPdfTextFromFile(file)).rejects.toThrow();
  });
});
