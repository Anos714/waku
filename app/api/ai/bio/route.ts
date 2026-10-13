import { NextResponse } from "next/server";
import { aiGenerationInputSchema } from "@/lib/validation/profile";
import { generateProfileCopy, hasApiKey } from "@/lib/ai/gemini";

/**
 * AI copy generation Route Handler.
 *
 * The Gemini key lives on the server; the browser only ever posts the inputs
 * here. All input is validated with Zod before anything reaches the model.
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

  if (!hasApiKey()) {
    return error(
      503,
      "MISSING_API_KEY",
      "AI generation is not configured. The server has no GEMINI_API_KEY.",
      "Add GEMINI_API_KEY to a local .env file (see .env.example) and restart the dev server. Everything else in Waku works without it.",
    );
  }

  try {
    const result = await generateProfileCopy(parsed.data);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const code = err instanceof Error ? err.message : "UNKNOWN";
    const known = [
      "EMPTY_RESPONSE",
      "UNPARSEABLE_RESPONSE",
      "NO_USABLE_VARIATIONS",
      "MISSING_API_KEY",
    ];

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
