import type { AiGenerationInput, AiVariation, WritingStyle } from "@/types";

/**
 * Shared prompt builders for the AI copy writer, used identically by every
 * provider (Groq primary, Gemini fallback) so the facts-only rules and the
 * output shape never drift between them.
 */

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

const SYSTEM_INSTRUCTION =
  "You are a careful copywriter for personal profile pages. You return valid JSON only.";

export function copySystemInstruction(): string {
  return SYSTEM_INSTRUCTION;
}

export function buildCopyPrompt(input: AiGenerationInput): string {
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

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").replace(/^["'“”]|["'“”]$/g, "").trim();
}

/**
 * Shapes a parsed `{ variations: [...] }` payload into usable variations.
 * Throws the same codes the providers surface to the route: EMPTY_RESPONSE,
 * UNPARSEABLE_RESPONSE, NO_USABLE_VARIATIONS.
 */
export function shapeVariations(raw: unknown): AiVariation[] {
  if (raw === "") throw new Error("EMPTY_RESPONSE");
  let parsed: { variations?: unknown };
  if (typeof raw === "string") {
    if (!raw) throw new Error("EMPTY_RESPONSE");
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("UNPARSEABLE_RESPONSE");
    }
  } else if (typeof raw === "object" && raw !== null) {
    parsed = raw as { variations?: unknown };
  } else {
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
