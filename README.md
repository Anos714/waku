# Waku

**Your identity, beautifully put together.**

Waku turns a name, a role and a handful of links into two things: a designed,
themeable public profile page and a matching downloadable identity card —
with an AI bio writer, live theming, QR codes and multi-format export.

No account needed to build. Nothing leaves your browser until you publish.

![Waku landing page](docs/images/hero-landing.jpg)

<p align="center">
  <a href="public/media/waku-promo.mp4">Watch the 30s demo</a>
  ·
  <a href="https://github.com/Anos714/waku">GitHub</a>
</p>

---

## Table of contents

- [Highlights](#highlights)
- [Screenshots](#screenshots)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Commands](#commands)
- [Project structure](#project-structure)
- [Routes](#routes)
- [Architecture](#architecture)
- [Documentation](#documentation)
- [Deployment](#deployment)
- [Design system](#design-system)
- [Future improvements](#future-improvements)
- [License](#license)
- [Contact](#contact)

---

## Highlights

- **Local-first editor** — every keystroke is saved to `localStorage`
  (debounced, 350 ms) and restored on refresh. Anonymous drafts are claimed as
  your first published page when you sign in for the first time.
- **Live preview** — the editor preview and the public page are the _same_
  React component (`ProfileView`), so what you edit is exactly what ships.
- **Publishing with ownership** — sign in with GitHub or Google, hit publish,
  and the profile goes live at `/p/<slug>`. The slug is assigned by the server,
  never chosen by the client.
- **10 themes × 8 font pairings × 16 accents × 8 backgrounds × 6 social button
  styles** — applied as CSS custom properties; switching never touches content.
- **4 page designs** — Editorial, Centered, Sidebar, Hero.
- **8 identity-card layouts** — Classic, Banner, Minimal, Split, Poster,
  Spotlight, Frame, Duo — exported as PNG, JPEG, WebP or AVIF at 2× pixel
  density.
- **AI bio & tagline writer** — Groq first with a Google Gemini fallback,
  called server-side only. The
  prompt is constrained to facts already in your profile; it may not invent
  employers, metrics or credentials. Returns three variations you approve
  individually.
- **Resume import** — upload a PDF resume and the AI drafts your name, role,
  bio, skills, interests, website and projects into a review screen. Nothing
  touches your draft until you approve a field, and the file is never stored.
- **QR codes & sharing** — profile QR colored from the profile's own theme
  palette, clipboard copy, Web Share, and a plain text export of the whole
  profile.
- **Photo uploads** — Cloudinary with server-side signing; AVIF/WebP delivery
  with face-focused cropping.
- **Graceful degradation** — no database, no OAuth secrets, no Gemini key? The
  app runs, drafts work, and the UI reports exactly what is missing instead of
  failing mid-flow.
- **Visitor ratings** — an anonymous `/rate` page: stars and an optional note,
  one per person (deduped by a hashed IP + user-agent fingerprint, revisable),
  with an average that surfaces as a social-proof section on the landing page
  once the first rating lands.
- **Legal, contact and the rest** — privacy policy, cookie policy, terms,
  contact and rate pages all match the app's theme, share one layout, and are
  linked from the footer alongside a credit to the products that inspired it.

## Screenshots

| Editor with live preview                                                                                                 | AI bio writer                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| ![Editor: split view with form on the left and a live profile preview on the right](docs/images/editor-live-preview.jpg) | ![AI writer panel generating three bio variations beside the live preview](docs/images/ai-bio-writer.jpg) |

| Themes & card layouts                                                                                                                | Identity card with QR                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| ![Theme picker with profile design, theme, accent and font controls next to a dark themed preview](docs/images/themes-and-cards.jpg) | ![Identity card studio showing a card layout picker, the rendered card and a QR code](docs/images/identity-card-qr.jpg) |

| Published profile page                                                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------------- |
| ![Published public profile page at /p/slug with about, skills, featured work and contact sections](docs/images/public-profile.jpg) |

## Tech stack

| Layer           | Choice                                                                   |
| --------------- | ------------------------------------------------------------------------ |
| Framework       | Next.js 16 (App Router, Turbopack, React Compiler)                       |
| UI              | React 19, TypeScript (strict)                                            |
| Styling         | Tailwind CSS v4 (CSS-first config in `app/globals.css`)                  |
| Primitives      | Radix UI + shadcn-style wrappers in `components/ui/`                     |
| Forms           | react-hook-form + Zod v4 (`zodResolver`)                                 |
| Database        | Neon Postgres (`@neondatabase/serverless`, HTTP driver)                  |
| ORM             | Drizzle ORM — migrations own the schema; `ensureSchema()` self-heals dev |
| Auth            | Better Auth (social-only: GitHub, Google)                                |
| AI              | Groq (OpenAI-compatible fetch, server-only) primary, Google Gemini fallback |
| Uploads         | Cloudinary (signed server-side), `next-cloudinary` delivery              |
| Export / QR     | `html-to-image`, `qrcode`                                                |
| Package manager | pnpm                                                                     |

## Quick start

Requirements: **Node 20.9+**, **pnpm 12+**. Every environment variable is
optional — the app boots with an empty `.env.local`.

```bash
pnpm install
cp .env.example .env.local   # fill in what you need; GROQ_API_KEY is a good first one
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The editor is at
[`/create`](http://localhost:3000/create), and a bundled demo profile renders at
[`/p/ada`](http://localhost:3000/p/ada) without any database.

To exercise the full loop (publish → public URL), add `DATABASE_URL`,
`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` and one OAuth provider — see
[docs/deployment.md](docs/deployment.md).

## Environment variables

All values live in `.env.local` (gitignored). Full annotated copy in
[`.env.example`](.env.example).

| Variable                                                                 | Required for                   | Notes                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------ | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                                                   | Social previews                | Public origin, e.g. `https://waku.example.com`. Used as the metadata base so `/opengraph-image`, `/twitter-image` and `/site.webmanifest` resolve to absolute URLs. Defaults to `http://localhost:3000`; invalid values fall back to that rather than breaking the app. |
| `DATABASE_URL`                                                           | Publishing, accounts, showcase | Neon Postgres connection string. Without it the editor runs on local drafts and publishing returns `503 MISSING_DATABASE`.                                                                                                                                              |
| `BETTER_AUTH_SECRET`                                                     | Sign-in                        | Session signing secret. `openssl rand -base64 32`.                                                                                                                                                                                                                      |
| `BETTER_AUTH_URL`                                                        | Sign-in                        | Public origin of the instance, e.g. `http://localhost:3000`. Checked against the sign-in request's origin.                                                                                                                                                              |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`                              | GitHub sign-in                 | [Create an OAuth app](https://github.com/settings/developers). Left blank → the button is hidden.                                                                                                                                                                       |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`                              | Google sign-in                 | [OAuth client credentials](https://console.cloud.google.com/apis/credentials). Left blank → the button is hidden.                                                                                                                                                       |
| `GEMINI_API_KEY`                                                         | AI writer (fallback), resume import (fallback) | Server-side only. Get one at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey). Used when Groq is unconfigured or all its models are busy.                                                                                                           |
| `GROQ_API_KEY`                                                           | AI writer, resume import                       | Server-side only, primary provider. Get one at [console.groq.com/keys](https://console.groq.com/keys). Either this or `GEMINI_API_KEY` enables the AI features.                                                                                                                  |
| `GROQ_MODEL`                                                             | Optional                                       | The first Groq model tried. Defaults to `openai/gpt-oss-120b`.                                                                                                                                                                                                                  |
| `GROQ_MODELS`                                                            | Optional                                       | Comma-separated cascade tried when the primary is busy, before falling back to Gemini. Defaults to `openai/gpt-oss-120b,openai/gpt-oss-20b`. Run `pnpm ai:models` to see what a key can reach.                                                                                    |
| `GEMINI_MODEL`                                                           | Optional                       | The primary model. Defaults to `gemini-3.8-flash`.                                                                                                                                                                                                                      |
| `GEMINI_MODELS`                                                          | Optional                       | Comma-separated cascade tried when the primary is overloaded (HTTP 429/503). Defaults to `gemini-3.8-flash,gemini-3.5-flash,gemini-3.7-flash`; generation only reports "all models busy" once every model is tried. Run `pnpm ai:models` to see what a key can reach.   |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Photo uploads                  | Server-side signing in `app/api/upload/route.ts`. The secret never reaches the browser.                                                                                                                                                                                 |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`                                      | Photo delivery                 | Browser-exposed cloud name used to build AVIF/WebP URLs from a stored public ID.                                                                                                                                                                                        |

## Commands

```bash
pnpm dev        # dev server (Turbopack)
pnpm build      # production build
pnpm start      # serve the production build
pnpm lint       # eslint (flat config, next/core-web-vitals + next/typescript)
pnpm typecheck  # tsc --noEmit (strict)
pnpm test       # vitest (watch)
pnpm test:run   # vitest (single run, for CI)
pnpm db:generate  # diff lib/db/schema.ts into a new SQL migration under drizzle/
pnpm db:migrate   # apply pending migrations to the DATABASE_URL database
pnpm ai:models    # list the models the configured Gemini key can reach
```

### Database migrations

Drizzle migrations (`drizzle/*.sql`) are the source of truth for the database
shape. After changing `lib/db/schema.ts`, generate and review a migration, then
apply it:

```bash
pnpm db:generate   # review the generated SQL before it touches anything
pnpm db:migrate    # applies pending migrations to DATABASE_URL
```

`ensureSchema()` still self-heals a dev or preview database on first request, so
`pnpm dev` needs no migration step — but it is deliberately a no-op in
production, where only `db:migrate` may change the schema. Review the generated
SQL before migrating a live database: the generator can emit destructive
statements (drops, retypes) that the additive `ensureSchema()` path never would.

For a database that predates the migration tooling (created by `ensureSchema()`
alone), mark the `init` migration as already applied instead of replaying it
against tables that already exist.

## Project structure

```
app/
  page.tsx                    Landing (server component, revalidate 300)
  create/page.tsx             Editor route
  p/[slug]/page.tsx           Public profile (SSR + client fallback)
  contact/page.tsx            Contact page (channels + mailto form)
  rate/page.tsx               Ratings page (stars form + wall + average)
  legal/                      Privacy policy, cookie policy, terms
  opengraph-image.tsx         Generated 1200×630 OG/Twitter card
  api/
    auth/[...all]/route.ts    Better Auth handler (ensures schema first)
    profiles/route.ts         POST — publish (session required)
    profiles/claim-draft/     POST — claim an anonymous draft on first sign-in
    ratings/route.ts          GET/POST — read and leave a rating (anonymous)
    ai/bio/route.ts           POST — Groq-first bio/tagline generation (Gemini fallback)
    ai/resume/route.ts        POST — resume PDF → reviewable profile patch (Groq first, Gemini fallback)
    upload/route.ts           POST — signed Cloudinary upload
    config/route.ts           GET  — auth/provider availability (non-sensitive)
components/
  landing/                    Nav, hero, promo video, steps, features, showcase, ratings, CTA
  legal/                      Shared legal layout + section/point typographic blocks
  contact/                    Contact form (composes a mailto draft)
  rating/                     Star rating form + ratings wall
  editor/                     Editor shell, form sections, AI writer, theming, share panel
  profile/                    ProfileView (shared renderer), designs, avatars, sections
  cards/                      Identity card, 8 layouts, export menus
  ui/                         Radix-based primitives
  icons/                      Brand + platform glyphs
lib/
  db.ts                       Drizzle client, ensureSchema(), publish/read/rating queries
  db/schema.ts                profiles, ratings + Better Auth tables (source of truth)
  ai/gemini.ts                Server-only Gemini client (fallback provider)
  ai/groq.ts                  Server-only Groq client (primary provider, plain fetch)
  ai/provider.ts              Groq-first, Gemini-fallback ordering for AI features
  ai/copy.ts                  Shared facts-only prompts for the copy writer
  ai/resume.ts                Resume PDF text → profile patch extraction + sanitizing
  validation/profile.ts       Zod schemas, URL safety
  validation/rating.ts        Zod schema for a visitor rating
  themes/index.ts             Theme/font/accent presets + resolveTheme()
  profile/                    storage, slug, qr, format, demo, platforms, data access
  cards/export.ts             html-to-image export (dynamic import)
  site.ts                     Site origin (metadata base), repo URL, contact email, mailto()
types/index.ts                Domain models (Profile, ThemeSettings, …)
proxy.ts                      Optimistic cookie gate on POST /api/profiles*
drizzle/                      Generated SQL migrations (owned by db:generate/db:migrate)
scripts/migrate.mts           Applies pending migrations to Neon
tests/                        Vitest suite, mirroring the source layout
docs/                         Architecture, API and deployment notes
```

## Routes

| Route                       | Purpose                                                                 |
| --------------------------- | ----------------------------------------------------------------------- |
| `/`                         | Landing page with hero demo, feature tour and recent published profiles |
| `/create`                   | Profile editor: form + live preview + card studio + share panel         |
| `/p/[slug]`                 | Public profile page (demo: `/p/ada`)                                    |
| `/contact`                  | Contact page: email + GitHub, and a form that drafts a message          |
| `/rate`                     | Rate Waku in stars, read what other visitors said                       |
| `/legal/privacy-policy`     | What is collected, what is not, how to have it removed                  |
| `/legal/cookie-policy`      | The one cookie Waku sets, and how to clear it                           |
| `/legal/terms`              | The rules of using Waku                                                 |
| `/api/auth/[...all]`        | Better Auth — sign-in, callback, session, sign-out                      |
| `/api/profiles`             | `POST` — publish a profile (session required)                           |
| `/api/profiles/claim-draft` | `POST` — import the local draft as your first page                      |
| `/api/ratings`              | `GET` — approved ratings · `POST` — leave or revise your rating          |
| `/api/ai/bio`               | `POST` — AI bio/tagline generation                                      |
| `/api/ai/resume`            | `POST` — resume PDF upload → reviewable profile patch (never stored)    |
| `/api/upload`               | `POST` — signed profile photo upload                                    |
| `/api/config`               | `GET` — `{ authEnabled, providers }` for the UI                         |

Full request/response contracts, error codes and status ladders:
**[docs/api.md](docs/api.md)**.

## Architecture

The short version:

- **One renderer, two consumers.** `ProfileView` renders both the editor
  preview and `/p/[slug]`. There is no second implementation to drift.
- **Themes are tokens, not branches.** `resolveTheme()` turns a
  `ThemeSettings` object into a flat map of CSS custom properties
  (`--pt-*`) applied to the profile container. Switching a theme rewrites
  tokens; content and markup are untouched.
- **Drafts are local until you publish.** The editor writes to
  `localStorage` (`waku.draft.v1`, with migration from `linkpersona.draft.v1`
  and a salvage path for corrupt drafts). Publishing is the only write path to
  the database, and it requires a session.
- **The server owns slugs and secrets.** Slugs are generated server-side
  (kebab-case name + nanoid, retried on collision) and ownership is decided
  against the database. The Gemini key, Cloudinary secret and OAuth secrets
  never leave the server.
- **Every handler validates and degrades.** Zod first, a uniform
  `{ ok, code, message, hint }` error envelope, and an actionable `503` when a
  dependency is unconfigured — never a stack trace.
- **URLs are sanitized.** Only `http`, `https`, `mailto` and `tel` pass
  `safeExternalUrl`, so an unsafe scheme can never render on a public profile.

Deep dive: **[docs/architecture.md](docs/architecture.md)**.

## Documentation

| Document                                     | What's in it                                                                              |
| -------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [docs/architecture.md](docs/architecture.md) | Rendering pipeline, theme token system, state management, data flow, auth, security model |
| [docs/api.md](docs/api.md)                   | Every endpoint: request/response shapes, status codes, error codes                        |
| [docs/deployment.md](docs/deployment.md)     | Production environment setup, OAuth configuration, degradation matrix, release checklist  |
| [LANDING_PROMPT.md](LANDING_PROMPT.md)       | Historical product/design brief for the landing page (context, not docs)                  |

## Deployment

Any host that runs `next build` / `next start` works — there is no vendor lock
beyond Neon for the database. Minimum for a useful production instance:

1. `DATABASE_URL` (Neon) — publishing, accounts, showcase.
2. `BETTER_AUTH_SECRET` + `BETTER_AUTH_URL` — sessions.
3. `NEXT_PUBLIC_SITE_URL` — correct social-share previews.
4. One OAuth provider, with its callback URL pointed at
   `https://<your-domain>/api/auth/callback/<provider>` (Better Auth's default
   path under its `/api/auth` base path).
5. `GROQ_API_KEY` (or `GEMINI_API_KEY`) if you want the AI writer and resume import; `CLOUDINARY_*` if you want photo
   uploads.

Create the database shape with `pnpm db:migrate` before the first publish — in
production only migrations change the schema (`ensureSchema()` is a dev-only
self-heal).

Without the database the app still runs: the editor, all themes, card export
and QR work entirely client-side. Full setup guide and checklist:
**[docs/deployment.md](docs/deployment.md)**.

## Design system

Warm off-white canvas (`#f5f3ee`), near-black ink (`#1a1a16`), deep charcoal
surfaces and a single restrained electric-lime accent (`#c6f24e`).

Profile rendering is fully tokenised:

- **10 themes** — Mono, Terminal, Editorial, Aurora, Noir, Sunrise, Forest,
  Ocean, Neon, Paper
- **8 font pairings** — Geist, Editorial, Terminal, System, Playfair,
  Grotesque, Lora, JetBrains
- **16 accent presets** + free-form hex
- **8 background treatments** — plain, subtle glow, grid, aurora glow, dots,
  stripes, mesh, rings
- **6 social button styles** — minimal, outline, solid, soft, elevated,
  underline
- **4 page designs**, **8 card layouts**
- 9 social platforms with canonical metadata (GitHub, LinkedIn, X, Instagram,
  YouTube, Bluesky, Mastodon, portfolio, email)

All presets live in `lib/themes/index.ts` and `components/*/…`; tokens are

## Future improvements

- **Tighter image allowlist.** `images.remotePatterns` still accepts any
  http/https host so arbitrary pasted avatar URLs render. Constraining it to
  Cloudinary (plus the demo's Unsplash source) removes the SSRF/bandwidth
  surface, at the cost of breaking avatars hosted elsewhere — so it needs a
  migration path for existing profiles first.
- **E2E tests on top of the unit suite.** The Vitest suite covers the pure
  logic and the shared `ProfileView` renderer; the publish → public-URL loop
  and the OAuth sign-in flow are still only exercised by hand. Playwright would
  close that gap.
- **Scheduled schema drift checks.** `ensureSchema()` is now dev-only and
  migrations own production, so a generated migration that diverges from the
  additive fallbacks would only surface in production. A CI check that
  `pnpm db:generate` is clean (no pending diff) would catch that before deploy.

## License

Waku is released under the **MIT License** — see [LICENSE](LICENSE). Copy,
modify and ship it, including commercially; attribution is the only ask.

## Contact

Built by **Anos714**.

- **GitHub:** [github.com/Anos714](https://github.com/Anos714) — issues and
  pull requests are welcome there.
- **Email:** [sainrahul374@gmail.com](mailto:sainrahul374@gmail.com)
- **X:** [x.com/RahulSain714](https://x.com/RahulSain714)
- **LinkedIn:** [linkedin.com/in/rahulxcode](https://www.linkedin.com/in/rahulxcode)

Found a bug or have a feature in mind? Open an issue on
[GitHub](https://github.com/Anos714/waku/issues).
