import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit configuration.
 *
 * `pnpm db:generate` diffs `lib/db/schema.ts` against the last generated
 * migration and writes SQL to `drizzle/`. Review it before applying — the
 * generator can emit destructive statements (drops, retypes) that
 * `ensureSchema()` would never produce.
 *
 * `pnpm db:migrate` applies the pending SQL to Neon and is the only path that
 * should touch a production database's shape.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  // Only needed by `db:push`/`db:migrate`; generation works without it.
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  // Fail loudly rather than silently generating a migration that drops data.
  strict: true,
  verbose: true,
});
