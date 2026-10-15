import { NextResponse } from "next/server";
import { aiGenerationInputSchema } from "@/lib/validation/profile";
import { generateProfileCopy, hasAnyAiKey } from "@/lib/ai/provider";

/**
 * AI copy generation Route Handler.
 *
 * The provider keys live on the server; the browser only ever posts the
 * inputs here. All input is validated with Zod before anything reaches a
 * model. Groq is tried first, Gemini is the fallback.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function error(status: number, code: string, message: string, hint?: string) {
  return NextResponse.json({ ok: false, code, message, hint }, { status });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return error(400, "BAD_BODY", "The request body could not be read as JSON.");
  }

  const parsed = aiGenerationInputSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return error(
      422,
      "INVALID_INPUT",
      first?.message ?? "The request did not pass validation.",
      first?.path.join(".") || undefined,
    );
  }

  if (!hasAnyAiKey()) {
    return error(
      503,
      "MISSING_API_KEY",
      "AI generation is not configured. The server has neither GROQ_API_KEY nor GEMINI_API_KEY.",
      "Add GROQ_API_KEY (or GEMINI_API_KEY) to a local .env file (see .env.example) and restart the dev server. Everything else in Waku works without it.",
    );
  }

  try {
    const result = await generateProfileCopy(parsed.data);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN";

    if (code === "ALL_MODELS_UNAVAILABLE") {
      return error(
        503,
        "ALL_MODELS_UNAVAILABLE",
        "Every AI model is busy right now.",
        "We tried each available model and they are all under heavy load. This is usually temporary — wait a minute or two and try again.",
      );
    }

    const known = [
      "EMPTY_RESPONSE",
      "UNPARSEABLE_RESPONSE",
      "NO_USABLE_VARIATIONS",
      "MISSING_API_KEY",
    ];

    if (code === "GROQ_AUTH_FAILED") {
      return error(
        500,
        code,
        "Groq rejected the API key.",
        "Check that GROQ_API_KEY in .env.local is correct and restart the dev server.",
      );
    }

    if (known.includes(code)) {
      return error(
        502,
        code,
        "The AI service returned a response we could not use.",
        "Try again, or write the text by hand — the editor works either way.",
      );
    }

    return error(
      500,
      "GENERATION_FAILED",
      "Something went wrong while contacting the AI service.",
      process.env.NODE_ENV === "development" ? code : undefined,
    );
  }
}
