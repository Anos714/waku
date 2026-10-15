import type { AiGenerationInput, AiVariation } from "@/types";
import {
  buildCopyPrompt,
  copySystemInstruction,
  shapeVariations,
} from "./copy";

/**
 * Server-only Groq integration — the primary AI provider. Groq speaks the
 * OpenAI chat-completions shape, so this is plain `fetch`, no SDK needed.
 * The API key never leaves this module.
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Models tried in order. gpt-oss-120b leads: reasoning-capable, 128K context
 * and reliable JSON output — the right shape for copy writing and resume
 * extraction alike. gpt-oss-20b follows as the fast fallback. The Llama
 * family is deliberately absent: Groq moved it to the Enterprise tier, which
 * a regular console key cannot reach.
 *
 * Override with `GROQ_MODELS` (comma separated); promote one with
 * `GROQ_MODEL`. Same convention as the Gemini cascade.
 */
const FALLBACK_MODELS = ["openai/gpt-oss-120b", "openai/gpt-oss-20b"];

export function resolveGroqCascade(): string[] {
  const configured = process.env.GROQ_MODELS?.trim();
  if (configured) {
    const models = configured
      .split(",")
      .map((model) => model.trim())
      .filter(Boolean);
    if (models.length > 0) return models;
  }

  const primary = process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-120b";
  return Array.from(new Set([primary, ...FALLBACK_MODELS]));
}

export function hasGroqKey(): boolean {
  return Boolean(process.env.GROQ_API_KEY?.trim());
}

export class GroqError extends Error {
  status: number | null;
  constructor(message: string, status: number | null) {
    super(message);
    this.name = "GroqError";
    this.status = status;
  }
}

/**
 * Capacity statuses: rate-limited or a transient upstream failure — reasons
 * to try the next model (or the next provider) rather than fail the request.
 * Auth and bad-request statuses are real problems worth surfacing so a bad
 * key never fails silently into a fallback.
 */
export function isCapacityStatus(status: number | null): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503;
}

interface JsonRequest {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
}

/** One JSON-mode chat completion on one model. Throws GroqError on HTTP failure. */
export async function groqJsonCompletion(
  model: string,
  request: JsonRequest,
): Promise<unknown> {
  if (!hasGroqKey()) {
    throw new Error("MISSING_GROQ_KEY");
  }

  let response: Response;
  try {
    response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY as string}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: request.system },
          { role: "user", content: request.user },
        ],
        temperature: request.temperature ?? 0.7,
        ...(request.maxTokens ? { max_tokens: request.maxTokens } : {}),
        response_format: { type: "json_object" },
      }),
    });
  } catch {
    // No HTTP status to read — treat a dead network like a busy model so the
    // cascade (and then Gemini) still gets its chance.
    throw new GroqError("GROQ_NETWORK_ERROR", null);
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new GroqError("GROQ_AUTH_FAILED", response.status);
    }
    throw new GroqError(`GROQ_REQUEST_FAILED`, response.status);
  }

  let data: {
    choices?: { message?: { content?: unknown } }[];
  };
  try {
    data = (await response.json()) as typeof data;
  } catch {
    throw new Error("UNPARSEABLE_RESPONSE");
  }

  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content) throw new Error("EMPTY_RESPONSE");
  try {
    return JSON.parse(content);
  } catch {
    throw new Error("UNPARSEABLE_RESPONSE");
  }
}

async function callModel(
  model: string,
  input: AiGenerationInput,
): Promise<AiVariation[]> {
  const parsed = await groqJsonCompletion(model, {
    system: copySystemInstruction(),
    user: buildCopyPrompt(input),
    temperature: 0.9,
  });
  return shapeVariations(parsed);
}

function isCapacityError(error: unknown): boolean {
  if (error instanceof GroqError) {
    // A dead network reads as no status — still worth retrying elsewhere.
    return error.status === null || isCapacityStatus(error.status);
  }
  return false;
}

/** Bio/tagline writer on Groq, with in-provider model fallback. */
export async function generateGroqCopy(
  input: AiGenerationInput,
): Promise<{ variations: AiVariation[]; model: string }> {
  if (!hasGroqKey()) {
    throw new Error("MISSING_GROQ_KEY");
  }

  const cascade = resolveGroqCascade();
  const exhausted: string[] = [];

  for (const model of cascade) {
    try {
      const variations = await callModel(model, input);
      return { variations, model };
    } catch (error) {
      // Busy model, not a failure — try the next one. Anything else (bad key,
      // malformed output) surfaces now; another model would not fix it, and a
      // bad key must never fail silently.
      if (!isCapacityError(error)) throw error;
      exhausted.push(model);
    }
  }

  console.warn(
    `All ${cascade.length} Groq models were unavailable: ${exhausted.join(", ")}`,
  );
  throw new Error("ALL_MODELS_UNAVAILABLE");
}
