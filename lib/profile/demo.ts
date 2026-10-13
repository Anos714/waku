import { DEMO_SLUG, type Profile } from "@/types";
import { DEFAULT_THEME_SETTINGS } from "@/lib/themes";

/**
 * The bundled demo profile. This is fictional example data the editor boots
 * with so the product is explorable before anything is typed. It is clearly
 * flagged in the UI as "editable example data".
 */
export const DEMO_PROFILE: Profile = {
  name: "Ada Lovelace",
  slug: DEMO_SLUG,
  role: "Analytical Engineer & Technical Writer",
  tagline: "Writing the first program, and the notes that go with it.",
  bio: "I work on the Analytical Engine — translating mathematical ideas into instructions a machine can run. Most of my time goes to notation, debugging, and writing about computation in plain language so more people can pick it up.",
  location: "London, England",
  // Served with permissive CORS headers so the image loads in-browser and can
  // be inlined into the exported card. Providers without CORS (ui-avatars)
  // fail to rasterize and silently fall back to the monogram.
  avatarUrl:
    "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=512&q=80",
  websiteUrl: "https://example.com/ada",
  skills: ["Mathematics", "Mechanical computation", "Technical writing", "Punch cards"],
  interests: ["Poetry", "Astronomy", "Probability", "Pedagogy"],
  socials: [
    {
      id: "demo-1",
      platform: "github",
      label: "github.com/ada",
      url: "https://github.com/ada",
      visible: true,
    },
    {
      id: "demo-2",
      platform: "linkedin",
      label: "in/adalovelace",
      url: "https://www.linkedin.com/in/adalovelace",
      visible: true,
    },
    {
      id: "demo-3",
      platform: "x",
      label: "@ada",
      url: "https://x.com/ada",
      visible: true,
    },
    {
      id: "demo-4",
      platform: "youtube",
      label: "Ada's notebooks",
      url: "https://www.youtube.com/@ada",
      visible: false,
    },
    {
      id: "demo-5",
      platform: "email",
      label: "ada@example.com",
      url: "mailto:ada@example.com",
      visible: true,
    },
  ],
  projects: [
    {
      id: "demo-p1",
      title: "Notes on the Analytical Engine",
      description:
        "Annotated translation of Menabrea's sketch, with the first published algorithm.",
      url: "https://example.com/ada/notes",
      tag: "Writing",
    },
    {
      id: "demo-p2",
      title: "Bernoulli number generator",
      description: "A worked example of programming a series by instruction cards.",
      url: "https://example.com/ada/bernoulli",
      tag: "Computation",
    },
    {
      id: "demo-p3",
      title: "Notation for machinery",
      description: "A compact notation for describing repeated calculation.",
      url: "https://example.com/ada/notation",
      tag: "Method",
    },
  ],
  sections: {
    projects: true,
    skills: true,
    about: true,
    contact: true,
  },
  theme: { ...DEFAULT_THEME_SETTINGS, theme: "editorial", fontPairing: "editorial" },
  cardLayout: "classic",
  profileDesign: "editorial",
  showQr: true,
};

export function createDemoProfile(): Profile {
  return structuredClone(DEMO_PROFILE);
}
