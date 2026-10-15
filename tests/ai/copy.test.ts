import { describe, expect, it } from "vitest";
import { buildCopyPrompt } from "@/lib/ai/copy";
import { DEMO_PROFILE } from "@/lib/profile/demo";
import type { AiGenerationInput } from "@/types";

const INPUT: AiGenerationInput = {
  type: "bio",
  role: "Analytical Engineer",
  skills: ["Mathematics"],
  interests: ["Poetry"],
  style: "professional",
  name: "Ada Lovelace",
};

describe("copy prompt voice rules", () => {
  it("bans em dashes in generated copy", () => {
    const prompt = buildCopyPrompt(INPUT);
    expect(prompt).toContain("Never use em dashes");
    // The rule names the character once as its own example; nothing else
    // may contain it.
    const withoutRule = prompt
      .split("\n")
      .filter((line) => !line.includes("em dashes"))
      .join("\n");
    expect(withoutRule).not.toContain("—");
  });

  it("keeps the bundled demo profile em-dash free", () => {
    const strings: string[] = [
      DEMO_PROFILE.name,
      DEMO_PROFILE.role,
      DEMO_PROFILE.tagline,
      DEMO_PROFILE.bio,
      DEMO_PROFILE.location,
      ...DEMO_PROFILE.skills,
      ...DEMO_PROFILE.interests,
      ...DEMO_PROFILE.projects.flatMap((p) => [
        p.title,
        p.description,
        p.tag,
      ]),
    ];
    for (const text of strings) {
      expect(text).not.toContain("—");
    }
  });
});
