# Deployment

Waku is a standard Next.js app: `pnpm build` + `pnpm start` on any Node 20+
host. The only stateful dependency is Postgres (Neon); everything else is an
optional integration that degrades cleanly.

---

## 1. Degradation matrix

Know what a missing variable costs before you ship:

| Missing | What still works | What you lose |
| --- | --- | --- |
| *(nothing — bare checkout)* | Editor, all themes/designs, live preview, card export, QR, demo profile at `/p/ada` | Publishing, sign-in, showcase, AI, uploads |
| `DATABASE_URL` | Everything above; drafts persist per browser | Publishing, accounts, landing showcase & published count (`/api/config` reports `authEnabled: false`) |
| OAuth credentials (one provider) | Sign-in with the other provider | That provider's button is hidden — no broken redirects |
| `GEMINI_API_KEY` | Everything else | AI writer shows a configuration notice |
| `CLOUDINARY_*` | Everything else | Photo upload reports `MISSING_CLOUDINARY_CONFIG`; monogram avatars still render |

## 2. Required environment

Copy `.env.example` to `.env.local` locally, or set them in your host's
dashboard. Full variable reference: [../README.md](../README.md#environment-variables).

### Core (needed for a public, publishable instance)

```bash
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
BETTER_AUTH_SECRET=<openssl rand -base64 32>
BETTER_AUTH_URL=https://your-domain.com
```

- **Neon:** create a project, copy the pooled connection string. The schema is
  created automatically — `ensureSchema()` runs idempotent SQL before the auth
  handler and on first DB access, creating `profiles` and Better Auth's
  `user` / `session` / `account` / `verification` tables. There is no migrate
  step to run.
- **`BETTER_AUTH_URL` must be the public origin** (no trailing path). Better
  Auth compares it against the sign-in request's origin; a mismatch blocks
  sign-in silently.

### OAuth

GitHub — [Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)

```
Homepage URL:            https://your-domain.com
Authorization callback URL: https://your-domain.com/api/auth/callback/github
```

Google — [Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
(Web application OAuth client):

```
Authorized redirect URI: https://your-domain.com/api/auth/callback/google
```

Both providers are optional and independent; a provider is only wired when
*both* its id and secret are non-empty. Add `https://<domain>` to Better Auth's
trusted origins if you front the app with a proxy that rewrites hosts.

### AI

```bash
GEMINI_API_KEY=...            # https://aistudio.google.com/app/apikey
# GEMINI_MODEL=gemini-3.8-flash   # override the default
```

Server-side only. Missing key → `/api/ai/bio` returns `503 MISSING_API_KEY`
with a hint; the editor shows the same message inline.

### Uploads

```bash
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...           # server-side signing only
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=... # browser-exposed, builds delivery URLs
```

Keep the `NEXT_PUBLIC_` value identical to `CLOUDINARY_CLOUD_NAME`.

## 3. Build & run

```bash
pnpm install
pnpm lint && pnpm typecheck && pnpm build
pnpm start          # serves .next on PORT (default 3000)
```

Notes:

- **Set `metadataBase` to your production origin** in `app/layout.tsx` — it is
  currently the placeholder `https://waku.local`, and OG/Twitter image URLs
  derive from it.
- `next.config.ts` sets long-lived cache headers on `/media/*` (the promo
  video ships unhashed). Use content hashing if you replace it often.
- `images.remotePatterns` currently allows **all** http/https hosts so
  arbitrary avatar URLs render. Tighten it once avatar sources are constrained.
- The React Compiler and Tailwind v4 Turbopack loader are configured in
  `next.config.ts`; don't strip them when upgrading Next.

## 4. Post-deploy verification

Run through this once on a fresh production URL:

1. `/` renders; showcase section appears only if published profiles exist.
2. `/create` — type, refresh, draft is restored.
3. Sign in with each configured provider; sign out from the account menu.
4. Publish → note the slug → open `/p/<slug>` in a private window.
5. Re-publish → same slug, `updated: true`.
6. Open the share panel: QR, copy link and Web Share all resolve against the
   production origin.
7. Generate an AI bio (if keyed) and upload a photo (if Cloudinary is set).
8. Export the identity card in at least two formats.
9. Without any secrets in a staging deploy: UI reports the missing pieces, no
   console errors, no failed redirects.

## 5. Production checklist

- [ ] `DATABASE_URL` points at the production database, not staging
- [ ] `BETTER_AUTH_SECRET` is a strong random value, not the dev one
- [ ] `BETTER_AUTH_URL` matches the public origin exactly
- [ ] OAuth callback URLs updated for the real domain
- [ ] `metadataBase` updated to the public origin
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm build` all pass in CI
- [ ] HTTPS enforced by the host; secure cookie variant confirmed in devtools
- [ ] Error/uptime monitoring attached to the Node process
- [ ] Database backups/PITR enabled on Neon
- [ ] `.env.local` never committed (`.gitignore` covers `.env*`)

## 6. Local production smoke test

```bash
pnpm build && pnpm start
# then re-run the verification list against http://localhost:3000
```

The share panel's QR and copied links point at the current origin, so test them
against the origin you actually care about.
