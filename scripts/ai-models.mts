/**
 * Lists the models the configured AI keys can actually reach.
 *
 * Run with `pnpm ai:models`. Use it to pick a good `GROQ_MODELS` / cascade —
 * the fallback models in `lib/ai/groq.ts` are only a sensible default, and a
 * key's available models change over time as providers ship and retire them.
 */

import { GoogleGenAI } from "@google/genai";

async function listGemini(apiKey: string): Promise<void> {
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

    console.log(`Gemini models available to this key (${models.length}):\n`);
    for (const name of models) {
      console.log(`  ${name.replace(/^models\//, "")}`);
    }

    console.log(
      `\nSet GEMINI_MODELS to a comma-separated subset of these to control the cascade.`,
    );
  } catch (error) {
    console.error("Could not list Gemini models:", error);
    process.exitCode = 1;
  }
}

async function listGroq(apiKey: string): Promise<void> {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!response.ok) {
      console.error(`Could not list Groq models: HTTP ${response.status}.`);
      process.exitCode = 1;
      return;
    }
    const data = (await response.json()) as { data?: { id?: string }[] };
    const ids = (data.data ?? [])
      .map((model) => model.id ?? "")
      .filter(Boolean)
      .sort();

    if (ids.length === 0) {
      console.log("No Groq models are reachable with this key.");
      return;
    }

    console.log(`Groq models available to this key (${ids.length}):\n`);
    for (const id of ids) {
      console.log(`  ${id}`);
    }

    console.log(
      `\nSet GROQ_MODELS to a comma-separated subset of these to control the cascade.`,
    );
  } catch (error) {
    console.error("Could not list Groq models:", error);
    process.exitCode = 1;
  }
}

async function main(): Promise<void> {
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const groqKey = process.env.GROQ_API_KEY?.trim();

  if (!geminiKey && !groqKey) {
    console.error(
      "Neither GROQ_API_KEY nor GEMINI_API_KEY is set. Add one to .env.local first (see .env.example).",
    );
    process.exitCode = 1;
    return;
  }

  if (groqKey) await listGroq(groqKey);
  if (geminiKey) {
    if (groqKey) console.log("");
    await listGemini(geminiKey);
  }
}

void main();
