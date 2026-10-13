/**
 * Applies pending Drizzle migrations to Neon.
 *
 * Run with `pnpm db:migrate`. This is the only path that should change a
 * production database's shape — always review the generated SQL first
 * (`pnpm db:generate`), because the generator can emit destructive statements
 * (drops and retypes) that `ensureSchema()` would never produce.
 *
 * Uses the Neon serverless driver, which runs one statement per query: the
 * migrator honours the `--> statement-breakpoint` markers so each command is
 * prepared individually (Postgres rejects several commands in one prepared
 * statement). The HTTP driver has no transactions, so a failure leaves the
 * migration half-applied — the journal is only advanced on success.
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

const MIGRATIONS_FOLDER = new URL("../drizzle", import.meta.url).pathname;

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error(
      "DATABASE_URL is not set. Add a Neon connection string to .env.local first.",
    );
    process.exitCode = 1;
    return;
  }

  const db = drizzle(neon(url));

  try {
    console.log(`Applying migrations from ${MIGRATIONS_FOLDER}…`);
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
    console.log("Migrations applied successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  }
}

void main();
