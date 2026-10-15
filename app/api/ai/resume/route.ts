import { NextResponse } from "next/server";
import {
  extractPdfText,
  extractResumePatch,
  hasAnyResumeKey,
} from "@/lib/ai/resume";

/**
 * Resume import Route Handler.
 *
 * Accepts a PDF resume, extracts its text, and maps it to a profile patch
 * with AI (Groq first, Gemini fallback). Nothing is stored — the patch is
 * returned for the user to review before anything touches their draft, and
 * the uploaded bytes never leave this request.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["application/pdf"];

function error(status: number, code: string, message: string, hint?: string) {
  return NextResponse.json({ ok: false, code, message, hint }, { status });
}

export async function POST(request: Request) {
  if (!hasAnyResumeKey()) {
    return error(
      503,
      "MISSING_API_KEY",
      "Resume import is not configured. The server has neither GROQ_API_KEY nor GEMINI_API_KEY.",
      "Add GROQ_API_KEY (or GEMINI_API_KEY) to a local .env file (see .env.example) and restart the dev server. The manual editor works either way.",
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return error(400, "BAD_BODY", "The request was not a valid multipart form upload.");
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return error(400, "NO_FILE", "No file was attached to the upload.");
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return error(
      415,
      "UNSUPPORTED_TYPE",
      `${file.type || "That file type"} is not supported for resume import.`,
      "Upload a PDF resume.",
    );
  }

  if (file.size > MAX_BYTES) {
    return error(
      413,
      "FILE_TOO_LARGE",
      "That resume is larger than 5 MB.",
      "Export a smaller PDF and try again.",
    );
  }

  let text: string;
  try {
    text = await extractPdfText(Buffer.from(await file.arrayBuffer()));
  } catch {
    return error(
      422,
      "PDF_PARSE_FAILED",
      "That PDF could not be read.",
      "If it is scanned images, export a text-based PDF instead.",
    );
  }

  if (text.replace(/\s+/g, " ").trim().length < 50) {
    return error(
      422,
      "NO_TEXT",
      "No readable text was found in that PDF.",
      "If it is scanned images, export a text-based PDF instead.",
    );
  }

  try {
    const result = await extractResumePatch(text);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN";

    if (code === "ALL_MODELS_UNAVAILABLE") {
      return error(
        503,
        "ALL_MODELS_UNAVAILABLE",
        "Every AI model is busy right now.",
        "This is usually temporary — wait a minute or two and try again.",
      );
    }

    if (code === "GROQ_AUTH_FAILED") {
      return error(
        500,
        code,
        "Groq rejected the API key.",
        "Check that GROQ_API_KEY in .env.local is correct and restart the dev server.",
      );
    }

    const known = [
      "EMPTY_RESPONSE",
      "UNPARSEABLE_RESPONSE",
      "MISSING_API_KEY",
      "PDF_PARSE_FAILED",
      "NO_TEXT",
    ];

    if (known.includes(code)) {
      return error(
        502,
        code,
        "The resume could not be turned into profile data.",
        "Try again, or fill the editor by hand — it works either way.",
      );
    }

    return error(
      500,
      "EXTRACTION_FAILED",
      "Something went wrong while reading the resume.",
      process.env.NODE_ENV === "development" ? code : undefined,
    );
  }
}
