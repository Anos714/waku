import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Locks in the ownership decision: migrations are the only authority on a
 * production database's shape, so the additive `ensureSchema()` self-heal must
 * stay out of production. Otherwise it races a migration that renames or
 * retypes a column and re-creates the old shape.
 */
describe("ensureSchema ownership", () => {
  // `process.env` types NODE_ENV as read-only; mutate through a writable view.
  const env = process.env as Record<string, string | undefined>;
  const originalNodeEnv = env.NODE_ENV;
  const originalDbUrl = env.DATABASE_URL;

  afterEach(() => {
    if (originalNodeEnv === undefined) delete env.NODE_ENV;
    else env.NODE_ENV = originalNodeEnv;
    if (originalDbUrl === undefined) delete env.DATABASE_URL;
    else env.DATABASE_URL = originalDbUrl;
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it("is a no-op in production", async () => {
    env.DATABASE_URL = "postgresql://user:pass@host/db";
    env.NODE_ENV = "production";
    vi.resetModules();

    const { ensureSchema, db } = await import("@/lib/db");
    expect(db).not.toBeNull();
    const execute = vi.spyOn(db as never as { execute: () => Promise<unknown> }, "execute");

    await ensureSchema();
    expect(execute).not.toHaveBeenCalled();
  });

  it("runs the additive statements outside production", async () => {
    env.DATABASE_URL = "postgresql://user:pass@host/db";
    delete env.NODE_ENV;
    vi.resetModules();

    const { ensureSchema, db } = await import("@/lib/db");
    const execute = vi
      .spyOn(db as unknown as { execute: (sql: string) => Promise<unknown> }, "execute")
      .mockResolvedValue({ rows: [] });

    await ensureSchema();
    expect(execute).toHaveBeenCalled();
    // The statements are purely additive (IF NOT EXISTS) — never a drop.
    const statements = execute.mock.calls.map((call) => String(call[0]));
    expect(statements.length).toBeGreaterThan(0);
    for (const statement of statements) {
      expect(statement).not.toMatch(/drop\s/i);
    }
  });

  it("does nothing without a database configured", async () => {
    delete env.DATABASE_URL;
    vi.resetModules();

    const { ensureSchema, db } = await import("@/lib/db");
    expect(db).toBeNull();
    await expect(ensureSchema()).resolves.toBeUndefined();
  });
});
