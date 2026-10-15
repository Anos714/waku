/**
 * Client-only resume PDF text extraction.
 *
 * Runs in the browser (statically imported so the bundler always includes it)
 * so the server never touches PDF bytes — the resume endpoint only ever
 * receives plain text, which is why resume import needs no native
 * dependencies and no special server bundling. Uses the legacy pdf.js build:
 * identical API in browsers and Node, so the same code path is unit-testable.
 */
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

// pdf.js parses on a worker in real browsers (Node/jsdom fall back to the
// bundled fake worker, where this URL is ignored). `new URL` lets the bundler
// emit the worker file and rewrite the path for dev and production alike.
if (!GlobalWorkerOptions.workerSrc) {
  GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
}

export async function extractPdfTextFromFile(file: File): Promise<string> {
  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await getDocument({ data }).promise;
  try {
    let out = "";
    // Resumes are short; ten pages bound the work on pathological inputs.
    const pages = Math.min(doc.numPages, 10);
    for (let pageNumber = 1; pageNumber <= pages; pageNumber += 1) {
      const page = await doc.getPage(pageNumber);
      const content = await page.getTextContent();
      out += `${content.items
        .map((item) =>
          typeof (item as { str?: unknown }).str === "string"
            ? ((item as { str: string }).str ?? "")
            : "",
        )
        .join(" ")}\n`;
      page.cleanup();
    }
    return out.replace(/\s+/g, " ").trim();
  } finally {
    await doc.destroy();
  }
}
