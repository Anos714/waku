# API reference

All endpoints are Next.js Route Handlers under `app/api/`. Every one of them
speaks the same dialect:

```jsonc
// success
{ "ok": true, /* …payload */ }

// failure
{
  "ok": false,
  "code": "STABLE_MACHINE_CODE",
  "message": "Safe to show a user.",
  "hint": "What to do about it." // optional
}
```

Rules that hold across every handler:

- Input is validated with Zod **before** it touches anything downstream.
- A missing dependency yields `503` with a hint naming the exact env var —
  never a stack trace and never a silent no-op.
- Handlers are `runtime = "nodejs"`, `dynamic = "force-dynamic"`; responses are
  never cached.
- `proxy.ts` rejects `POST /api/profiles*` without a `better-auth` cookie with
  `401 UNAUTHENTICATED` before the handler runs. That is only an optimistic
  filter — the handler still authenticates and authorizes properly.

---

## `POST /api/profiles`

Publishes the current draft so anyone can open `/p/<slug>`.

**Auth:** required (`getSession()`); **Database:** required.

### Request

A full profile object, identical to the shape the editor validates with
`profileSchema`:

```jsonc
{
  "name": "Ada Lovelace",
  "role": "Analytical Engineer & Technical Writer",
  "tagline": "Writing the first program, and the notes that go with it.",
  "bio": "…",                        // ≤ 600 chars
  "location": "London, England",
  "websiteUrl": "https://example.com/ada",
  "avatarUrl": "https://…",
  "skills": ["Mathematics", "…"],     // ≤ 24
  "interests": ["Poetry", "…"],        // ≤ 24
  "socials": [{ "platform": "github", "label": "GitHub", "url": "https://…" }], // ≤ 12
  "projects": [{ "title": "…", "url": "…", "description": "…", "kind": "WRITING" }], // ≤ 6
  "sections": { "about": true, "skills": true, "projects": true, "contact": true },
  "theme": { "theme": "terminal", "accent": "#8fdc6f", "fontPairing": "terminal",
             "background": "plain", "socialStyle": "outline", "avatarShape": "rounded" },
  "cardLayout": "classic",
  "profileDesign": "editorial",
  "showQr": true
}
```

The `slug` field in the payload is informational — **the server owns the
public URL**. If you already own a slug, re-publishing updates it in place; a
slug you don't own is ignored and a fresh one is minted.

### Responses

| Status | `code` | When |
| --- | --- | --- |
| `200` | — | `{ ok: true, slug, updated }`. `updated: true` means an existing page was overwritten. |
| `401` | `UNAUTHENTICATED` | No session (or no cookie — pre-filtered by `proxy.ts`). |
| `400` | `BAD_BODY` | Body is not readable JSON. |
| `422` | `INVALID_PROFILE` | Zod rejection. `message` is the first issue, `hint` its path. |
| `502` | `PUBLISH_FAILED` | Database unreachable / write failed. |
| `503` | `MISSING_DATABASE` | `DATABASE_URL` not configured. |

### Slug rules

`kebabCase(name)` + `-` + 6-char `nanoid`, up to 5 attempts on collision →
`ada-lovelace-7f3k2x`. Anonymous names still produce a usable slug.

---

## `POST /api/profiles/claim-draft`

Imports the visitor's `localStorage` draft as their first published page when
they sign in for the first time. **Idempotent** — if the user already owns a
profile, nothing is written and the existing slug comes back.

Same auth/validation ladder as `/api/profiles` (`MISSING_DATABASE` →
`UNAUTHENTICATED` → `BAD_BODY` → `INVALID_PROFILE` → `PUBLISH_FAILED`).

**200 response:** `{ ok: true, claimed: boolean, slug: string | null }`

- `claimed: true` — a new page was created from the draft.
- `claimed: false, slug: "…"` — the user already had a page; this is its URL.

---

## `POST /api/ai/bio`

Generates bio or tagline variations with Google Gemini. The API key lives on
the server; the browser only ever posts profile *inputs*.

### Request

```jsonc
{
  "type": "bio",                    // "bio" | "tagline"
  "role": "Analytical Engineer",    // 2–80 chars
  "name": "Ada Lovelace",           // optional, ≤ 60
  "skills": ["Mathematics"],        // each 1–32 chars, ≤ 24
  "interests": ["Poetry"],          // each 1–32 chars, ≤ 24
  "style": "professional"           // "professional" | "casual" | "minimal" | "creative"
}
```

### Responses

| Status | `code` | When |
| --- | --- | --- |
| `200` | — | `{ ok: true, variations: [{ id, text }], model }` — three variations. |
| `400` | `BAD_BODY` | Body not readable as JSON. |
| `422` | `INVALID_INPUT` | Zod rejection (`message` + path in `hint`). |
| `503` | `MISSING_API_KEY` | `GEMINI_API_KEY` unset. Everything else keeps working. |
| `502` | `EMPTY_RESPONSE` / `UNPARSEABLE_RESPONSE` / `NO_USABLE_VARIATIONS` | Model returned nothing, non-JSON, or no variation survived filtering. |
| `500` | `UNKNOWN` | Unexpected failure; the raw code is only surfaced in dev. |

The system prompt is constrained to facts already present in the input — no
invented employers, metrics, clients or credentials — and the response is
parsed against a JSON schema before anything reaches the UI. Variations are
applied only when the user explicitly accepts one.

---

## `POST /api/upload`

Uploads a profile photo to Cloudinary with a server-computed signature.

### Request

`multipart/form-data` with a single field:

| Field | Type | Constraints |
| --- | --- | --- |
| `file` | file | `image/jpeg`, `image/png`, `image/webp`, `image/avif`, `image/gif` · ≤ 8 MB |

The server appends a fixed transformation (`w_512,c_thumb,g_face,q_auto`) and
its own SHA-1 signature — the client cannot request arbitrary processing, and
`CLOUDINARY_API_SECRET` never leaves the server.

### Responses

| Status | `code` | When |
| --- | --- | --- |
| `200` | — | `{ ok: true, publicId, url }`. `publicId` is what the profile stores; `url` is kept for contexts that cannot run delivery-time transforms (PNG export). |
| `400` | `BAD_BODY` / `NO_FILE` | Not a valid multipart upload, or no `file` field. |
| `415` | `UNSUPPORTED_TYPE` | MIME type not on the allow-list (JPG, PNG, WebP, AVIF, GIF). |
| `413` | `FILE_TOO_LARGE` | Over 8 MB. |
| `502` | `UPLOAD_FAILED` | Cloudinary rejected the upload; its message is in `hint`. |
| `500` | `UPLOAD_ERROR` | Unexpected failure. |
| `503` | `MISSING_CLOUDINARY_CONFIG` | Any of the `CLOUDINARY_*` vars unset. |

Delivery URLs (`avif`/`webp` sources) are built client-side from `publicId` in
`lib/profile/avatar-delivery.ts` using
`NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`.

---

## `GET /api/config`

Non-sensitive server configuration for the publishing UI. No session, no
database required.

```json
{
  "ok": true,
  "authEnabled": true,
  "providers": { "github": true, "google": false }
}
```

- `authEnabled` — `hasDatabase()`. When `false`, the editor tells the user
  drafts stay local instead of showing a sign-in flow that cannot work.
- `providers` — a provider is `true` only when both its id and secret are set;
  the UI hides buttons for `false`.

---

## `GET|POST /api/ratings`

Visitor ratings for the `/rate` page and the landing page's social-proof strip.
Posting is anonymous — no session — but deduped: the request's IP and user
agent are hashed into a unique fingerprint, so one person only ever has one
rating, and posting again revises it in place.

`GET` accepts an optional `?limit=` (1–48, default 12).

### Request (`POST`)

```json
{ "authorName": "Ada Lovelace", "rating": 5, "message": "Genuinely lovely." }
```

- `authorName` — required, 1–60 characters after trimming.
- `rating` — required, an integer 1–5.
- `message` — optional, at most 500 characters; a blank one is stored as `null`.

### Responses

```json
{
  "ok": true,
  "rating": {
    "id": "V1StGXR8_Z5jdHi6B-myT",
    "authorName": "Ada Lovelace",
    "rating": 5,
    "message": "Genuinely lovely.",
    "createdAt": "2026-10-13T19:11:00.000Z"
  }
}
```

| Status | Code               | When                                                    |
| ------ | ------------------ | ------------------------------------------------------- |
| 200    | —                  | Saved (or revised). The landing page is revalidated.    |
| 400    | `BAD_BODY`         | The body is not readable JSON.                          |
| 422    | `INVALID_RATING`   | Fails Zod validation; the first issue's message is used. |
| 502    | `SAVE_FAILED`      | The write did not land in the database.                 |
| 503    | `MISSING_DATABASE` | `DATABASE_URL` is unset.                                |

`GET` always answers `200` — with empty ratings and a zero average when the
database is off, so the page still renders.

---

## `GET|POST /api/auth/[...all]`

The Better Auth handler (sign-in, OAuth callback, session, sign-out) mounted at
its default `/api/auth` base path. It runs `ensureSchema()` first so a fresh
dev database never races the first request; in production the schema comes from
`pnpm db:migrate` instead.

Sign-in is social-only; callback URLs are
`/api/auth/callback/github` and `/api/auth/callback/google` on your origin.

---

## Status code map (quick reference)

| Status | Meaning in Waku |
| --- | --- |
| `200` | Success, `{ ok: true, … }` |
| `400` | Body could not be parsed |
| `401` | No session / no auth cookie |
| `404` | (pages only) unknown slug — handled by the client resolver |
| `413` | Upload over the size cap |
| `422` | Zod validation failure |
| `500` | Unexpected; raw detail only in dev |
| `502` | Downstream provider (Cloudinary, Gemini, DB write) failed |
| `503` | Feature not configured — `hint` names the env var |
