# Architecture

How Waku is put together, and why. Read this before touching more than one
package's worth of code — most decisions here are load-bearing.

**Stack:** Next.js 16 App Router · React 19 · TypeScript strict · Tailwind v4 ·
Drizzle + Neon Postgres · Better Auth · Groq (+ Gemini fallback) · Cloudinary.

---

## 1. Mental model

Three planes, one direction of truth:

```
 browser                              server
 ┌──────────────────────────┐         ┌──────────────────────────────┐
 │  localStorage draft      │ publish │  Neon Postgres               │
 │  (waku.draft.v1)         ├────────►│  profiles(slug, data, owner) │
 │                          │  POST   │  user / session / account    │
 │  ProfileView  ◄──────────┼──SSR────┤                              │
 └──────────────────────────┘         └──────────────────────────────┘
```

- **Authoring is local-first.** The editor never talks to the network while
  you type. State lives in `localStorage`, written on a 350 ms debounce.
- **Publishing is the only write path to the database**, and it requires a
  Better Auth session. The server assigns the slug and records `owner_id`.
- **Reading is server-first.** `/p/[slug]` renders on the server from the
  database; when there is no row (no DB configured, unknown slug), a client
  resolver falls back to the author's local draft or the bundled demo, clearly
  labelled.

## 2. Rendering: one renderer, two consumers

`components/profile/profile-view.tsx` is the only implementation of what a
profile looks like. It is rendered by:

1. `components/editor/preview-pane.tsx` — inside `/create`, with live values
   from `useWatch()` (re-renders on every keystroke).
2. `app/p/[slug]/page.tsx` → `components/profile/public-profile.tsx` — on the
   public page, from data fetched by `lib/profile/profile-data.ts`.

Page-level layout variants (`editorial`, `centered`, `sidebar`, `hero`) are
picked by `renderProfileDesign()` in `components/profile/profile-designs.tsx`;
section content is shared across them. The identity card is a separate,
fixed-size surface (`components/cards/identity-card.tsx`) driven by the *same*
profile object, rendered at design pixel size and scaled with a CSS transform
(`lib/cards/use-scaled-surface.ts`) so exports are crisp.

Hydration safety: anything browser-only (localStorage, `location`, media
queries) is read through `useSyncExternalStore` with an explicit server
snapshot — `useProfileUrl`, `useInView`, `usePrefersReducedMotion`. The editor
substitutes the demo profile as its server snapshot so the first paint matches.

## 3. Theme system

A profile's appearance is data, not markup.

```
ThemeSettings ──resolveTheme()──► ResolvedTheme (flat token map)
                                        │
                                        ▼
                          inline CSS custom properties on .pt-vars
                          (--pt-bg, --pt-ink, --pt-accent, font vars, …)
```

- Presets live in `lib/themes/index.ts`: 10 themes, 8 font pairings, 16 accent
  presets, plus `resolveTheme()` which merges preset → user overrides →
  defaults.
- Token *defaults* and all visual treatments (backgrounds `.pt-grid`,
  `.pt-glow`, `.pt-dots`, `.pt-stripes`, `.pt-mesh`, `.pt-rings`; social button
  styles `.pt-social-*`) are declared once in `app/globals.css`.
- Because the theme is applied as custom properties on a container, switching
  themes rewrites variables only — content, layout components and the stored
  profile JSON are untouched. The same profile can be re-skinned without a
  migration.

The landing page has its own small theme bus: `lib/landing/hero-themes.ts`
dispatches a `CustomEvent` (`waku:hero-theme`) that the hero listens to, so
feature chips can re-theme the demo without cross-section provider wiring.

## 4. Editor state

`components/editor/editor-provider.tsx`:

- **react-hook-form + `zodResolver(profileSchema)`** — one form, one schema
  (`lib/validation/profile.ts`). The schema is the same one the publish
  endpoint re-validates server-side; the client copy is a UX convenience, the
  server copy is the authority.
- **`useWatch()`** feeds the preview, so preview and form share a single value
  tree (no mirrored state to drift).
- **Debounced persistence** — 350 ms after the last change, the whole profile
  is serialised to `localStorage` under `waku.draft.v1`.
- **Draft migration & salvage** — `lib/profile/storage.ts` upgrades the legacy
  `linkpersona.draft.v1` key and *salvages* malformed drafts into a render-safe
  profile instead of wiping the user's work.

AI copy (`components/editor/ai-bio-generator.tsx`) posts to `/api/ai/bio`,
receives three variations, and only writes one into the form when the user
accepts it.

## 5. Data layer

`lib/db.ts` is deliberately defensive:

- `db` is created lazily from `DATABASE_URL`; when the variable is missing,
  `db === null` and **nothing throws at import time**. `hasDatabase()` is the
  single feature flag callers check.
- `ensureSchema()` runs memoised, idempotent raw SQL creating `profiles` plus
  Better Auth's `user` / `session` / `account` / `verification` tables, so a
  dev or preview database never races a request. It is a no-op in production,
  where Drizzle migrations (`pnpm db:migrate`) are the only authority on the
  schema — the additive `ensureSchema()` statements would otherwise race a
  migration that renames or retypes a column.
- Queries are thin, purpose-built functions: `getPublishedProfile`,
  `listRecentPublished`, `countPublishedProfiles`, `publishProfile`,
  `claimDraftForUser`, `getOwnedSlugs`, `unpublishProfile`.

Schema (`lib/db/schema.ts`):

```
profiles(
  slug        text primary key,      -- server-assigned
  data        jsonb,                 -- the whole validated Profile
  owner_id    text → user.id,
  published_at / updated_at timestamptz
)
github_stats(
  user_id     text primary key → user.id,
  login, followers, public_repos, total_stars, repo_count,
  top_languages jsonb, updated_at timestamptz
)
```

`github_stats` is a public snapshot captured when a signed-in user imports
repositories (`lib/github/*`, `app/api/github/repos/route.ts`). It exists so a
rank or leaderboard can score an account without re-hitting the GitHub API on
every read, and it totals **public, non-fork** signal only — the `repo` OAuth
scope stays confined to autofill.

Storing the profile as JSONB means the Zod-validated object round-trips
untouched; adding a field to `Profile` needs no schema change. Ownership
queries (`owner_id = ?`) are the authorization check for updates.

Data access is isolated behind `lib/profile/profile-data.ts` so the storage
backend can be swapped without touching renderers.

## 6. Auth

`auth.ts`:

- Better Auth with the Drizzle adapter, `provider: "pg"`,
  **`transaction: false`** — Neon's HTTP driver cannot run transactions, so
  Better Auth writes user/account/session rows sequentially.
- **Social-only** (GitHub, Google). A provider is wired only when *both* its
  client id and secret are present; otherwise the sign-in button is hidden and
  `/api/config` reports the gap. A fresh checkout with no secrets never fails
  mid-redirect.
- `getSession()` never throws — a broken auth probe returns `null` so public
  pages and publishing keep working.
- `proxy.ts` (Next 16's middleware successor) gates `POST /api/profiles*` on
  the mere *presence* of a `better-auth` cookie — an optimistic filter that
  keeps anonymous POSTs out. **It is not the authorization check**; ownership
  is decided in the handler against the database.

## 7. API conventions

Every route handler in `app/api/` follows the same shape:

1. Cheap availability check first (`hasDatabase()`, `hasApiKey()`, Cloudinary
   config) → `503` with a hint that names the missing variable.
2. Authentication → `401 UNAUTHENTICATED`.
3. Body parse → `400 BAD_BODY`.
4. Zod validation → `422 INVALID_*` with the first issue's `message` and path.
5. Downstream failure → `502` with the provider's reason as the hint.
6. Success → `{ ok: true, … }`.

Errors are always `{ ok: false, code, message, hint? }`. `code` is a stable
machine string; `message` is safe to show a user; `hint` tells them what to do
about it. Detailed contracts: [api.md](api.md).

Runtime/ISR notes: route handlers are `runtime = "nodejs"` and
`dynamic = "force-dynamic"`; the landing page is a server component with
`revalidate = 300` and fails closed to an empty showcase / zero count when the
database is absent.

## 8. Security model

| Concern | Mechanism |
| --- | --- |
| Arbitrary link schemes | `safeExternalUrl` / `isSafeUrl` allow only `http`, `https`, `mailto`, `tel`; scheme-less input is treated as `https` (`lib/validation/profile.ts`) |
| Slug hijacking | Slugs are minted server-side (kebab(name) + 6-char nanoid, up to 5 collision retries); a client-supplied slug for someone else's profile is ignored and a new URL issued |
| Session forgery | Cookie sessions signed by Better Auth; ownership enforced by `owner_id` comparisons in the DB layer |
| Secret exposure | Groq/Gemini keys, Cloudinary secret, OAuth secrets are read only inside route handlers / `lib/ai` / `auth.ts`; the browser sees `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` and nothing else |
| AI hallucination | The shared copy/extraction prompts are "facts only" — no invented employers, metrics, clients or credentials — with JSON responses validated before anything reaches the UI; variations and resume patches are shown for approval before anything is written to the profile |
| Upload abuse | Type allow-list (jpeg/png/webp/avif/gif), 8 MB cap, server-computed SHA-1 signature, forced `w_512,c_thumb,g_face,q_auto` transformation |

## 9. Performance & shipping details

- **React Compiler** enabled (`reactCompiler: true` in `next.config.ts`) with
  `babel-plugin-react-compiler`.
- `html-to-image` is **dynamically imported** on first export so it never
  enters the initial bundle; export canvases are cached per serialised
  profile, JPEG gets an opaque background fill, others keep alpha.
- Landing showcase is ISR (`revalidate = 300`); promo video is served from
  `/media/*` with a one-week `Cache-Control` + `stale-while-revalidate`
  (it ships unhashed, so it is header-cached rather than content-hashed).
- OG/Twitter images are generated at request time (`app/opengraph-image.tsx`,
  1200×630 via `next/og`), inlining the mascot, mark and Geist woff files — no
  static screenshot to keep in sync.
- All interactive hooks honour `prefers-reduced-motion`; there is a global
  reduced-motion override in `app/globals.css`.

## 10. Conventions worth keeping

- Design tokens are law: canvas `#f5f3ee`, ink `#1a1a16`, accent `#c6f24e`.
  New UI pulls from tokens, not one-off hex.
- Shared library modules carry a short JSDoc explaining *why* they exist.
- No comments in ordinary component code unless the reasoning is non-obvious.
- Definition of done: `pnpm typecheck`, `pnpm lint`, `pnpm build` all clean.
- Route handlers own validation; components never trust their own schema.
