import type { AiGenerationInput, AiVariation } from "@/types";
import { generateGroqCopy, hasGroqKey } from "./groq";
import {
  generateProfileCopy as generateGeminiCopy,
  hasApiKey as hasGeminiKey,
} from "./gemini";

/**
 * Provider order for all AI features: Groq first, Gemini as fallback.
 *
 * Groq is tried whenever its key is configured. Only a capacity problem
 * (every Groq model busy — ALL_MODELS_UNAVAILABLE) falls through to Gemini;
 * any other Groq error (bad key, malformed output) surfaces immediately so a
 * misconfiguration never hides behind the fallback. With no Groq key the
 * Gemini path runs exactly as before.
 */

export function hasAnyAiKey(): boolean {
  return hasGroqKey() || hasGeminiKey();
}

export async function generateProfileCopy(
  input: AiGenerationInput,
): Promise<{ variations: AiVariation[]; model: string }> {
  if (hasGroqKey()) {
    try {
      return await generateGroqCopy(input);
    } catch (error) {
      if (!(error instanceof Error) || error.message !== "ALL_MODELS_UNAVAILABLE") {
        throw error;
      }
      // Every Groq model busy — fall through to Gemini below.
    }
  }
  return generateGeminiCopy(input);
}
