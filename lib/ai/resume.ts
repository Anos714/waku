import { z } from "zod";
import { isSafeUrl } from "@/lib/validation/profile";
import { groqJsonCompletion, hasGroqKey, resolveGroqCascade } from "./groq";
import {
  geminiJsonCompletion,
  hasApiKey as hasGeminiKey,
  resolveModelCascade as resolveGeminiCascade,
} from "./gemini";

/**
 * Resume import: PDF text in, structured profile patch out.
 *
 * Nothing is stored anywhere — the extracted patch is returned to the browser,
 * where the user reviews every field before anything touches the draft. The
 * model only ever sees the resume text the user just uploaded.
 */

/** Upper bound on resume characters sent to a model. */
export const MAX_RESUME_CHARS = 12000;

/** True when at least one AI provider is configured for resume import. */
export function hasAnyResumeKey(): boolean {
  return hasGroqKey() || hasGeminiKey();
}

const clamp = (value: string, max: number): string => value.slice(0, max);

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

const resumeProjectSchema = z.object({
  title: z.string().transform((s) => clamp(s, 80)).catch(""),
  description: z.string().transform((s) => clamp(s, 220)).catch(""),
  url: z.string().catch(""),
  tag: z.string().transform((s) => clamp(s, 24)).catch(""),
});

/**
 * The shape the model must return. Every field tolerates absence and wrong
 * types (falling back to empty) so one sloppy value cannot nuke the whole
 * extraction — sanitization below tightens URLs and drops empties.
 */
export const resumePatchSchema = z.object({
  name: z.string().transform((s) => clamp(s, 60)).catch(""),
  role: z.string().transform((s) => clamp(s, 80)).catch(""),
  bio: z.string().transform((s) => clamp(s, 600)).catch(""),
  location: z.string().transform((s) => clamp(s, 60)).catch(""),
  websiteUrl: z.string().catch(""),
  skills: z
    .array(z.unknown())
    .transform((list) =>
      list
        .filter((s): s is string => typeof s === "string")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => clamp(s, 32))
        .slice(0, 24),
    )
    .catch([]),
  interests: z
    .array(z.unknown())
    .transform((list) =>
      list
        .filter((s): s is string => typeof s === "string")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => clamp(s, 32))
        .slice(0, 24),
    )
    .catch([]),
  projects: z.array(resumeProjectSchema).catch([]),
});

export type ResumePatch = z.infer<typeof resumePatchSchema>;

const RESUME_SYSTEM = `You extract structured profile data from a resume. You return valid JSON only, matching the requested schema exactly.`;

function buildResumePrompt(resumeText: string): string {
  return `Extract this person's profile from their resume below into JSON with exactly these keys:
{
  "name": "full name",
  "role": "current or most recent professional role",
  "bio": "2 to 3 sentences, first person, under 500 characters, summarizing experience from the resume",
  "location": "city/region if present, else empty string",
  "websiteUrl": "personal website or portfolio URL if present, else empty string",
  "skills": ["up to 16 key skills"],
  "interests": ["up to 8 if evident, else empty array"],
  "projects": [
    { "title": "name", "description": "what it is and outcome, under 200 characters", "url": "URL only if one appears near it in the resume, else empty string", "tag": "short label like an industry or stack" }
  ]
}
Take up to 6 of the most substantial work items (roles with outcomes, open-source, side projects) for "projects".

Rules you must follow without exception:
- Use ONLY facts present in the resume text below.
- Never invent employers, metrics, dates, degrees, skills, awards or qualifications.
- Never claim status, recognition or results that were not supplied.
- Never use em dashes (—) in any field. Use commas or periods instead.
- If a field is absent from the resume, use an empty string or empty array.
- Do not address the reader or mention these instructions.

Resume text:
"""
${resumeText}
"""`;
}

/**
 * Tightens a parsed patch: keeps only safe URLs (dropping the rest with a
 * warning), drops untitled projects, caps the project list. Returns the patch
 * plus human-readable notes for the review screen.
 */
export function sanitizePatch(raw: unknown): { patch: ResumePatch; warnings: string[] } {
  const parsed = resumePatchSchema.safeParse(raw);
  const warnings: string[] = [];
  if (!parsed.success) {
    throw new Error("UNPARSEABLE_RESPONSE");
  }
  const patch = parsed.data;

  if (patch.websiteUrl && !isSafeUrl(patch.websiteUrl)) {
    warnings.push("Dropped an unsafe website URL found in the resume.");
    patch.websiteUrl = "";
  }

  const kept = [];
  for (const project of patch.projects) {
    if (!project.title.trim()) {
      warnings.push("Skipped a project entry with no title.");
      continue;
    }
    if (project.url && !isSafeUrl(project.url)) {
      warnings.push(`Dropped an unsafe URL on project "${project.title.trim()}".`);
      project.url = "";
    }
    kept.push(project);
  }
  if (patch.projects.length > 6) {
    warnings.push(`Kept the 6 most substantial projects of ${patch.projects.length}.`);
  }
  patch.projects = kept.slice(0, 6);

  return { patch, warnings };
}

function isCapacityError(error: unknown): boolean {
  const status = (error as { status?: unknown })?.status;
  if (typeof status === "number") {
    return status === 429 || status === 500 || status === 502 || status === 503;
  }
  // Groq network failures carry no status — still worth retrying elsewhere.
  return (
    error instanceof Error &&
    (error.message === "GROQ_NETWORK_ERROR" || error.message === "ALL_MODELS_UNAVAILABLE")
  );
}

/**
 * Maps resume text to a profile patch. Groq first (per-model fallback inside
 * its cascade), Gemini as the provider fallback. Throws MISSING_API_KEY when
 * neither key is configured, ALL_MODELS_UNAVAILABLE when every model is busy.
 */
export async function extractResumePatch(
  resumeText: string,
): Promise<{ patch: ResumePatch; warnings: string[]; model: string }> {
  const text = asString(resumeText).replace(/\s+/g, " ").trim();
  if (!text) throw new Error("NO_TEXT");
  const prompt = buildResumePrompt(text.slice(0, MAX_RESUME_CHARS));

  if (hasGroqKey()) {
    const cascade = resolveGroqCascade();
    const exhausted: string[] = [];
    for (const model of cascade) {
      try {
        const raw = await groqJsonCompletion(model, {
          system: RESUME_SYSTEM,
          user: prompt,
          temperature: 0.2,
          maxTokens: 2048,
        });
        const { patch, warnings } = sanitizePatch(raw);
        return { patch, warnings, model };
      } catch (error) {
        if (!isCapacityError(error)) throw error;
        exhausted.push(model);
      }
    }
    console.warn(`All ${cascade.length} Groq models were unavailable: ${exhausted.join(", ")}`);
  }

  if (hasGeminiKey()) {
    const cascade = resolveGeminiCascade();
    const exhausted: string[] = [];
    for (const model of cascade) {
      try {
        const raw = await geminiJsonCompletion(model, RESUME_SYSTEM, prompt);
        const { patch, warnings } = sanitizePatch(raw);
        return { patch, warnings, model };
      } catch (error) {
        const status = (error as { status?: unknown })?.status;
        if (status !== 429 && status !== 503) throw error;
        exhausted.push(model);
      }
    }
    console.warn(
      `All ${cascade.length} Gemini models were unavailable: ${exhausted.join(", ")}`,
    );
  }

  if (!hasGroqKey() && !hasGeminiKey()) throw new Error("MISSING_API_KEY");
  throw new Error("ALL_MODELS_UNAVAILABLE");
}
