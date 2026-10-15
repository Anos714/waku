import { GoogleGenAI, Type } from "@google/genai";
import type { AiGenerationInput, AiVariation } from "@/types";
import {
  buildCopyPrompt,
  copySystemInstruction,
  shapeVariations,
} from "./copy";

/**
 * Server-only Gemini integration. The API key never leaves this module — the
 * client talks to the Route Handler, which calls this code.
 */

/**
 * The models tried in order when generating copy. A single model is often
 * temporarily overloaded (HTTP 429/503), so the request falls through to the
 * next one rather than failing the whole generation.
 *
 * The primary is `GEMINI_MODEL` when set, followed by the rest of the current
 * 3.x Flash family. The whole list can be overridden with `GEMINI_MODELS`
 * (comma separated) for a key whose models differ — run `pnpm ai:models` to see
 * what a key can actually reach.
 */
const FALLBACK_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.5-flash",
  "gemini-3.7-flash",
];

export function resolveModelCascade(): string[] {
  const configured = process.env.GEMINI_MODELS?.trim();
  if (configured) {
    const models = configured
      .split(",")
      .map((model) => model.trim())
      .filter(Boolean);
    if (models.length > 0) return models;
  }

  const primary = process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";
  // De-duplicate in case GEMINI_MODEL already names one of the fallbacks.
  return Array.from(new Set([primary, ...FALLBACK_MODELS]));
}

export function hasApiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

const VARIATION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    variations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: ["variations"],
} as const;

/**
 * The HTTP statuses that mean a model is temporarily unavailable — overloaded
 * (503) or rate-limited (429). Both are reasons to try the next model rather
 * than report a hard failure. Any other error is a real problem worth surfacing.
 */
function capacityStatus(error: unknown): number | null {
  const status = (error as { status?: unknown })?.status;
  // ApiError carries the code on `status`; duck-type so an unexpected error
  // shape is still handled.
  return typeof status === "number" ? status : null;
}

function isTemporarilyUnavailable(error: unknown): boolean {
  const status = capacityStatus(error);
  return status === 429 || status === 503;
}

/** Calls one model and shapes its response into usable variations. */
async function callModel(
  ai: GoogleGenAI,
  model: string,
  input: AiGenerationInput,
): Promise<AiVariation[]> {
  const response = await ai.models.generateContent({
    model,
    contents: buildCopyPrompt(input),
    config: {
      systemInstruction: copySystemInstruction(),
      responseMimeType: "application/json",
      responseSchema: VARIATION_SCHEMA,
      temperature: 0.9,
    },
  });

  const raw = response.text;
  if (!raw) throw new Error("EMPTY_RESPONSE");
  return shapeVariations(raw);
}

/**
 * Free-form JSON completion on one model, for structured tasks (like resume
 * extraction) that don't fit the bio writer's fixed schema. Returns the parsed
 * payload; throws EMPTY_RESPONSE / UNPARSEABLE_RESPONSE on unusable output.
 */
export async function geminiJsonCompletion(
  model: string,
  system: string,
  user: string,
): Promise<unknown> {
  if (!hasApiKey()) {
    throw new Error("MISSING_API_KEY");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
  const response = await ai.models.generateContent({
    model,
    contents: user,
    config: {
      systemInstruction: system,
      responseMimeType: "application/json",
      temperature: 0.3,
    },
  });
  const raw = response.text;
  if (!raw) throw new Error("EMPTY_RESPONSE");
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("UNPARSEABLE_RESPONSE");
  }
}

export async function generateProfileCopy(
  input: AiGenerationInput,
): Promise<{ variations: AiVariation[]; model: string }> {
  if (!hasApiKey()) {
    throw new Error("MISSING_API_KEY");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
  const cascade = resolveModelCascade();
  const exhausted: string[] = [];

  for (const model of cascade) {
    try {
      const variations = await callModel(ai, model, input);
      return { variations, model };
    } catch (error) {
      // A model under heavy load is not a failure — try the next one. Anything
      // else (a bad request, an unusable response) is reported as-is, since a
      // different model would not change the outcome.
      if (!isTemporarilyUnavailable(error)) throw error;
      exhausted.push(model);
    }
  }

  // Every model in the cascade was busy.
  console.warn(
    `All ${cascade.length} generation models were unavailable: ${exhausted.join(", ")}`,
  );
  throw new Error("ALL_MODELS_UNAVAILABLE");
}
