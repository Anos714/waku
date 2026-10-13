/**
 * Lists the models the configured Gemini key can actually reach.
 *
 * Run with `pnpm ai:models`. Use it to pick a good `GEMINI_MODELS` cascade —
 * the fallback models in `lib/ai/gemini.ts` are only a sensible default, and a
 * key's available models change over time as Google ships and retires them.
 */

import { GoogleGenAI } from "@google/genai";

async function main(): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    console.error(
      "GEMINI_API_KEY is not set. Add one to .env.local first (see .env.example).",
    );
    process.exitCode = 1;
    return;
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const pager = await ai.models.list();
    const models = pager.page
      .map((model) => model.name ?? "")
      .filter((name) => name.startsWith("models/gemini-"));

    if (models.length === 0) {
      console.log("No gemini-* models are reachable with this key.");
      return;
    }

    console.log(`Models available to this key (${models.length}):\n`);
    for (const name of models) {
      const id = name.replace(/^models\//, "");
      console.log(`  ${id}`);
    }

    console.log(
      `\nSet GEMINI_MODELS to a comma-separated subset of these to control the cascade.`,
    );
  } catch (error) {
    console.error("Could not list models:", error);
    process.exitCode = 1;
  }
}

void main();
