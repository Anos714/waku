import { NextResponse } from "next/server";
import { resumeTextSchema } from "@/lib/validation/profile";
import { extractResumePatch, hasAnyResumeKey } from "@/lib/ai/resume";

/**
 * Resume import Route Handler.
 *
 * Accepts resume *text* (the browser extracts it from the PDF with pdf.js)
 * and maps it to a profile patch with AI (Groq first, Gemini fallback).
 * Nothing is stored — the patch is returned for the user to review before
 * anything touches their draft. The server never touches PDF bytes, so this
 * route needs no native dependencies and behaves like every other JSON route.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return error(400, "BAD_BODY", "The request body could not be read as JSON.");
  }

  const parsed = resumeTextSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return error(
      422,
      "INVALID_INPUT",
      first?.message ?? "The request did not pass validation.",
      first?.path.join(".") || undefined,
    );
  }

  if (parsed.data.text.replace(/\s+/g, " ").trim().length < 50) {
    return error(
      422,
      "NO_TEXT",
      "No readable text was found in that resume.",
      "If it is scanned images, export a text-based PDF instead.",
    );
  }

  try {
    const result = await extractResumePatch(parsed.data.text);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN";

    if (code === "ALL_MODELS_UNAVAILABLE") {
      return error(
        503,
        "ALL_MODELS_UNAVAILABLE",
        "Every AI model is busy right now.",
        "This is usually temporary. Wait a minute or two and try again.",
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
      "NO_TEXT",
    ];

    if (known.includes(code)) {
      return error(
        502,
        code,
        "The resume could not be turned into profile data.",
        "Try again, or fill the editor by hand. It works either way.",
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
