import { DEMO_SLUG, type Profile } from "@/types";
import { DEFAULT_THEME_SETTINGS } from "@/lib/themes";

/**
 * The bundled demo profile — the author's own page, served at `/p/ada` and
 * used as the editor's seed so the product is explorable before anything is
 * typed. It is flagged in the editor UI as editable example data: visitors
 * should read it as "here's what a finished profile looks like", and replace
 * any field with their own.
 *
 * The avatar is Cloudinary-hosted with permissive CORS headers, so the image
 * loads in-browser and can be inlined into the exported card. Providers
 * without CORS (ui-avatars) fail to rasterize and silently fall back to the
 * monogram.
 */
export const DEMO_PROFILE: Profile = {
  name: "Rahul Sain",
  slug: DEMO_SLUG,
  role: "Software Developer — Full Stack Developer",
  tagline:
    "Building AI-powered SaaS and full-stack web apps with microservices and edge runtimes.",
  bio: "Computer Science undergraduate with hands-on experience building AI-powered SaaS and full-stack web applications. Skilled in Java, JavaScript, TypeScript, SQL, REST APIs, Docker, CI/CD, and scalable backend development using modern microservices, distributed queues, and edge runtimes.",
  location: "Alwar, Rajasthan, India",
  avatarUrl:
    "https://res.cloudinary.com/ipxbr5nj/image/upload/v1791876787/cetnnfubnsswedavp3rf.jpg",
  websiteUrl: "https://rahulxcode.vercel.app",
  skills: [
    "Java",
    "JavaScript",
    "TypeScript",
    "React.js",
    "Next.js",
    "Node.js",
    "Express.js",
    "PostgreSQL",
    "MongoDB",
    "Redis",
    "Docker",
    "REST APIs",
  ],
  interests: [
    "AI Workflows",
    "Microservices",
    "Distributed Queues",
    "Edge Deployment",
  ],
  socials: [
    {
      id: "demo-1",
      platform: "github",
      label: "github.com/Anos714",
      url: "https://github.com/Anos714",
      visible: true,
    },
    {
      id: "demo-2",
      platform: "linkedin",
      label: "in/rahulxcode",
      url: "https://www.linkedin.com/in/rahulxcode",
      visible: true,
    },
    {
      id: "demo-3",
      platform: "portfolio",
      label: "rahulxcode.vercel.app",
      url: "https://rahulxcode.vercel.app",
      visible: true,
    },
    {
      id: "demo-5",
      platform: "email",
      label: "sainrahul374@gmail.com",
      url: "mailto:sainrahul374@gmail.com",
      visible: true,
    },
  ],
  projects: [
    {
      id: "demo-p1",
      title: "Xcel – Autonomous Twitter Growth SaaS",
      description:
        "Ingests real-time web trends via Tavily API and synthesizes high-engagement tweet threads with Gemini AI. BullMQ + Redis queue executed 495 tweets via Buffer API with exponential backoff.",
      url: "https://github.com/Anos714/Xcel",
      tag: "AI SaaS",
      imageUrl: "https://picsum.photos/seed/waku-xcel/800/450",
    },
    {
      id: "demo-p2",
      title: "Inkwell – Personal Blogging Platform",
      description:
        "Ultra-fast distraction-free blogging with Hono backend achieving sub-30ms latency. Google OAuth 2.0 + RBAC, split-pane Markdown editor, TanStack Query + Upstash Redis caching.",
      url: "https://github.com/Anos714/Inkwell",
      tag: "Full Stack",
      imageUrl: "https://picsum.photos/seed/waku-inkwell/800/450",
    },
    {
      id: "demo-p3",
      title: "Konnect – Realtime Social App",
      description:
        "Realtime social networking with instant messaging, group channels, presence indicators and HD video calling using Stream SDKs. JWT auth, Express.js + MongoDB with compound indexing.",
      url: "https://github.com/Anos714/Konnect",
      tag: "Realtime",
      imageUrl: "",
    },
    {
      id: "demo-p4",
      title: "Waku – Personal Identity Builder",
      description:
        "Turns a name, role and links into a designed profile page + matching identity card with QR + PNG export. Built with Next.js 16, TypeScript, Tailwind v4, Better Auth + Drizzle/Neon.",
      url: "https://github.com/Anos714/waku",
      tag: "Identity",
      imageUrl: "",
    },
  ],
  sections: {
    projects: true,
    skills: true,
    about: true,
    contact: true,
  },
  theme: {
    ...DEFAULT_THEME_SETTINGS,
    theme: "editorial",
    fontPairing: "editorial",
  },
  cardLayout: "classic",
  profileDesign: "editorial",
  showQr: true,
};

export function createDemoProfile(): Profile {
  return structuredClone(DEMO_PROFILE);
}
