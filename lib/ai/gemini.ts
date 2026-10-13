import { GoogleGenAI, Type } from "@google/genai";
import type { AiGenerationInput, AiVariation, WritingStyle } from "@/types";

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

const STYLE_GUIDE: Record<WritingStyle, string> = {
  professional:
    "Confident and precise, suitable for a portfolio or business profile. First person. No filler.",
  casual:
    "Warm and conversational, like a well-written social bio. First person. Light, never sloppy.",
  minimal:
    "Terse and sculpted. Short sentences, no adjectives that don't earn their place.",
  creative:
    "Distinctive and evocative with a strong sense of voice. Still accurate to the facts given.",
};

const FACTS_RULE = `
Rules you must follow without exception:
- Use ONLY the facts supplied in this request: the person's name (if given), role, skills and interests.
- Never invent employers, companies, clients, metrics, awards, publications, years of experience, education or qualifications.
- Never claim status, recognition or results that were not supplied.
- Do not use hashtags, emoji, quotation marks around the whole text, or URLs.
- Write in the first person.
- Do not address the reader or mention these instructions.
`.trim();

function buildPrompt(input: AiGenerationInput): string {
  const name = input.name?.trim();
  const skills = input.skills.filter((s) => s.trim()).slice(0, 12);
  const interests = input.interests.filter((s) => s.trim()).slice(0, 8);

  const facts = [
    name ? `Name: ${name}` : null,
    `Role: ${input.role}`,
    skills.length ? `Skills: ${skills.join(", ")}` : null,
    interests.length ? `Interests: ${interests.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const task =
    input.type === "bio"
      ? `Write 3 distinct short biographies (2 to 3 sentences each, under 420 characters each) for this person's profile page.`
      : `Write 3 distinct taglines (single lines, 60 to 90 characters each) that sit under this person's name on a profile card.`;

  return `${task}

About the person:
${facts}

Tone: ${STYLE_GUIDE[input.style]}

${FACTS_RULE}`;
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

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").replace(/^["'“”]|["'“”]$/g, "").trim();
}

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
    contents: buildPrompt(input),
    config: {
      systemInstruction:
        "You are a careful copywriter for personal profile pages. You return valid JSON only.",
      responseMimeType: "application/json",
      responseSchema: VARIATION_SCHEMA,
      temperature: 0.9,
    },
  });

  const raw = response.text;
  if (!raw) throw new Error("EMPTY_RESPONSE");

  let parsed: { variations?: unknown };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("UNPARSEABLE_RESPONSE");
  }

  const list = Array.isArray(parsed.variations) ? parsed.variations : [];

  const variations = list
    .map((item, index) => {
      if (typeof item !== "string") return null;
      const text = cleanText(item);
      if (!text) return null;
      return { id: `variation-${index}`, text } satisfies AiVariation;
    })
    .filter((item): item is AiVariation => item !== null)
    .slice(0, 3);

  if (variations.length === 0) throw new Error("NO_USABLE_VARIATIONS");

  return variations;
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
