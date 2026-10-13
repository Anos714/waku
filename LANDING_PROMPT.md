# Task: Refresh the Waku landing page — make it publish-aware and genuinely catchy

You are continuing work on **Waku**, a personal-identity builder (profile page + matching identity card + QR + PNG export). Repo root: `/home/anos/Documents/pp/LinkPersona`. Stack: **Next.js 16 App Router + TypeScript + Tailwind v4 + Radix UI**, and **Better Auth + Drizzle/Neon** were just wired up. Branding is "Waku" (the folder is called LinkPersona — ignore that, the product name in the UI is Waku).

> ⚠️ From `AGENTS.md`: this is **not** the Next.js you know. Before writing code, read the relevant guide in `node_modules/next/dist/docs/` and heed deprecation notices.

## Part 0 — Read these first (grounding)

- `app/page.tsx` — landing composition: `<Nav /> <Hero /> <Steps /> <Features /> <FinalCta /> <Footer />`
- `components/landing/*` — nav, hero, hero-preview, steps, features, final-cta, footer
- `app/globals.css` — design tokens, `.bg-grid`, `.bg-dots`, `.accent-glow`, `.eyebrow`, `.balance`, and existing keyframes `animate-pop`, `animate-wiggle`, `animate-fade-up`, `animate-in/out`
- `components/editor/editor-header.tsx` — the reference **account menu** pattern (avatar + name + sign-out via `authClient`)
- `components/editor/share-panel.tsx` — the reference **sign-in-to-publish** UI (GitHub/Google buttons, `/api/config` gating, session via `authClient.useSession()`)
- `lib/db.ts`, `app/api/profiles/route.ts`, `app/p/[slug]/page.tsx` — the publish pipeline

## Part 1 — What just shipped (this is why the landing page is now stale)

Auth + publishing were completed in the previous session:

- **Better Auth** with Drizzle adapter, **GitHub + Google** OAuth, handler at `app/api/auth/[...all]/route.ts`; client at `lib/auth-client.ts` (`authClient.useSession()`, `authClient.signIn.social({ provider, callbackURL })`, `authClient.signOut()`).
- **DB**: `profiles` table with `slug`, `data`, `owner_id`, `published_at`; idempotent `ensureSchema()`.
- **Publish** = `POST /api/profiles`: requires a session (else `401`), server assigns the slug (kebab + nanoid, retry on collision), records the owner. `proxy.ts` gates that route on the session cookie.
- **Public profiles** at `/p/[slug]` now server-render real published rows (`getPublishedProfile`), falling back to the local draft / demo / honest "not online" state.
- **Draft claiming**: an anonymous draft is imported as your first published page on first sign-in (`claimDraftForUser`, surfaced by `<DraftClaimer>`).
- **Editor header** shows an account menu (avatar, name, sign out) when signed in.
- Config endpoint `GET /api/config` → `{ ok, authEnabled, providers: { github, google } }`.

**The landing page still describes the pre-auth world.** It implies everything stays in your browser and never says you can own a permanent, publicly reachable link. That is the core thing to fix.

## Part 2 — Factual copy corrections (do these, no matter what)

Quote → fix. Keep the brand voice (short, confident, no hype-words like "seamlessly").

1. **Hero subhead** (`components/landing/hero.tsx`)
   Now: *"Your name, role and links, shaped into a designed profile page and a matching identity card."*
   → Should promise a **real, owned, shareable link**: sign in, publish, get `/p/your-name` that anyone can open. Also mention nothing leaves the browser until you publish.

2. **Steps step 03** (`components/landing/steps.tsx`)
   Now: *"Choose a card layout, add a QR code, download a sharp PNG and copy your profile link."*
   → The link is only real **after publish**. Rewrite as e.g. **"Publish and share"**: *"Sign in with GitHub or Google, hit publish, and your page is live at a link you own — waku.app/p/you. Then grab the QR and the PNG card."* Keep the "nothing leaves your browser until you publish" reassurance.

3. **Features** (`components/landing/features.tsx`)
   Nothing mentions publishing, accounts, or ownership. **Add a fourth feature card / rework the bento**: "Own your link" — sign in with GitHub or Google, publish, and `/p/your-name` is reachable by anyone; republish updates the same page in place; your anonymous draft is claimed as your first page when you sign in.

4. **Footer blurb** (`components/landing/footer.tsx`)
   Now: *"A personal identity builder. Profile page, identity card, QR code and shareable export."*
   → Add the published-page idea (a real link you own).

5. **README.md** — the "What needs deployment or a database" section and the "Drafts are local / Nothing is published" notes are now outdated; update them to describe sign-in + publish (mention `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, GitHub/Google client secrets, `DATABASE_URL` from `.env.example`). Only do this if the rest is green.

## Part 3 — New landing-page pieces

1. **Sign-in / account in the Nav** (`components/landing/nav.tsx`)
   - Unsigned: a **"Sign in"** button (GitHub + Google via `authClient.signIn.social`, or a small dropdown offering both providers; disable per `/api/config`).
   - Signed: reuse the `editor-header.tsx` account menu pattern (avatar + name + Sign out). This needs a client component + `authClient.useSession()`.
2. **Eyebrow / trust chips above the hero headline** — small pill row: e.g. `No setup`, `Own your link`, `Export PNG`, `AI bio writer`. Use the `.eyebrow` helper and the accent.
3. **Showcase section** (new, between Features and FinalCta)
   - Query **recently published profiles** server-side (there is no `listPublished*` helper yet — add one to `lib/db.ts`, e.g. `listRecentPublished(limit)`, guarded by `hasDatabase()`).
   - Render a grid of live profile cards linking to `/p/<slug>` (avatar, name, role, accent per profile theme). If the DB is empty/unconfigured, **gracefully hide the section** (render nothing) rather than showing an empty grid. This is real social proof that gets better as the app is used.
4. **Live stat line** in the hero or final CTA — "N profiles published" — only when `hasDatabase()` and N > 0; otherwise omit entirely. Never fake numbers.

## Part 4 — Make it catchy (attention)

Pick the strongest of these; do not stack all of them into noise. Keep the "restrained electric-lime accent" discipline from `globals.css` — no new colors.

1. **Interactive theme switcher in the hero** (highest value): put a small control (chips or arrows) by `<HeroPreview />` that cycles the demo profile through the real themes (Mono, Terminal, Editorial, Aurora…). It uses the same `resolveTheme()` path as the editor, so the hero visibly *becomes* different products — a real demo, not a screenshot. Auto-play slowly on load, pause on hover/tap.
2. **Headline treatment**: keep "Your identity, beautifully put together." but consider a **rotating final phrase** cycling with the theme switcher (e.g. *put together / printed / shipped / shared*), or an animated accent underline that draws in. Subtle, not gimmicky.
3. **Mouse-tracking tilt + spotlight on the hero card**: the identity card already sits at a `-3deg` tilt; make it follow the cursor (parallax), and add a soft radial spotlight on the profile window that tracks the pointer.
4. **Marquee strip** under the hero: a slow row of `waku.app/p/…` slug chips (use the real demo slug + a few tasteful fake ones clearly derived from the demo), or supported platform glyphs. Add `pause on hover`. This fills dead space and telegraphs "these are real links".
5. **Polish the FinalCta**: bigger, centered, with the accent glow (`.accent-glow` exists) and a primary accent button; add the reassurance line "Free, no account needed to start — sign in only when you want to publish."

## Part 5 — Micro-interactions

All must respect `prefers-reduced-motion` (a global override already exists in `globals.css`; new JS-driven motion must also check `matchMedia("(prefers-reduced-motion: reduce)")`). Prefer CSS over JS.

- **Buttons**: arrow nudges right on hover; a one-shot accent shine-sweep across the primary CTA.
- **Nav**: shrink + soften on scroll-down, reveal on scroll-up; active section underline follows scroll position (`/#how-it-works`, `/#features`).
- **Feature bento cards**: lift on hover + accent ring; icon does the existing `animate-wiggle`; a cursor-following radial highlight (dark cards especially).
- **Steps**: the connector lines draw in as the section enters view; numbers fade-up with a stagger.
- **Scroll entrances**: reuse `animate-fade-up` with staggered `animation-delay`s via an IntersectionObserver hook (add one small hook, e.g. `lib/use-in-view.ts`), applied to hero copy, steps, and feature cards.
- **Theme chips in Features**: clicking one re-themes the hero preview (ties Part 4.1 into the grid).
- **Copy-link buttons**: existing `useCopy` + `animate-pop` check pattern — reuse it anywhere a link is shown.
- **QR in the hero card**: fade/pixelate in once generated (it already loads async).

## Part 6 — Files you will likely touch

- `app/page.tsx` (compose new sections)
- `components/landing/{nav,hero,hero-preview,steps,features,final-cta,footer}.tsx`
- new: `components/landing/showcase.tsx`, maybe `components/landing/theme-switcher.tsx`, `lib/use-in-view.ts`
- `lib/db.ts` (add `listRecentPublished`), maybe `lib/profile/profile-data.ts`
- `app/globals.css` (new keyframes/utilities only — tokens stay)
- `README.md` (Part 2.5)

## Part 7 — Conventions / constraints

- **Design tokens are the law**: warm off-white `#f5f3ee` canvas, near-black ink `#1a1a16`, charcoal `#171714`, single electric-lime accent `#c6f24e`. Use `var(--color-*)` / the Tailwind theme names (`bg`, `surface`, `ink`, `ink-2`, `ink-3`, `line`, `line-2`, `accent`). No new palette colors.
- Fonts already loaded in `app/layout.tsx`: Geist, Geist Mono, Instrument Serif, Playfair, Space Grotesk, Lora, JetBrains Mono — use the CSS variables, don't add font imports.
- Reuse, don't rebuild: `Button`, the icon sets (`components/icons/*`), `ProfileView`, `IdentityCard`, `DEMO_PROFILE`, `resolveTheme`, `useQrCode`, `useProfileUrl`, `useCopy`.
- The hero already renders the **real** `ProfileView` + `IdentityCard` from `DEMO_PROFILE` — keep it the real product surface; don't swap in images.
- Server components by default; `"use client"` only where interactivity is needed (keep the heavy hero preview client island isolated).
- Match the existing code style (the repo uses explanatory JSDoc comments on shared modules; follow that for new lib files, keep components clean).
- Landing must stay fast: no client-side auth blocking render (`useSession` is fine, it resolves after mount).

## Part 8 — Definition of done

1. `pnpm typecheck` clean
2. `pnpm lint` clean
3. `pnpm build` passes
4. Browser-verify: hero + theme switcher, scroll animations, nav sign-in flow, showcase section (and its empty state when the DB is off), mobile viewport, and `prefers-reduced-motion` (animations effectively instant).
5. Report back: what changed per file, any new env/config needs, and anything you intentionally did NOT do and why.

---

**Tone of the result:** the page should feel like a designed product, not a template — confident, quiet, with the lime accent doing the work. The single most important behavior change: a first-time visitor must understand within 5 seconds that they can **make a profile and get a real link they own**, not just a local draft.
