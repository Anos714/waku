import { boolean, index, integer, jsonb, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";

/**
 * Drizzle table definitions for the Waku database.
 *
 * `user`, `account`, `session` and `verification` are Better Auth's tables
 * (see https://www.better-auth.com/docs/concepts/database). Their Drizzle keys
 * match Better Auth's field names exactly — the Drizzle adapter resolves a
 * Better Auth field to a column by that key — while the column names follow
 * Better Auth's CLI default of snake_case.
 *
 * `profiles` holds published profile pages. Every row is owned by the user who
 * published it (`owner_id`); a user may own several profiles.
 */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const profiles = pgTable(
  "profiles",
  {
    /** Server-generated public URL, e.g. `ada-lovelace-7f3k2x`. */
    slug: text("slug").primaryKey(),
    data: jsonb("data").notNull(),
    /** Better Auth user id of the profile's owner. */
    ownerId: text("owner_id"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("profiles_owner_id_idx").on(table.ownerId)],
);

/**
 * Public feedback left by visitors on the `/rate` page. Ratings power the
 * landing page's social-proof section once enough have collected.
 *
 * `fingerprint` (a hash of the request's IP + user agent) is unique, so it both
 * dedupes submissions and lets the same visitor revise their rating instead of
 * adding a second one. Rows are approved on write; flip `approved` to hide one
 * without deleting it.
 */
export const ratings = pgTable(
  "ratings",
  {
    id: text("id").primaryKey(),
    authorName: text("author_name").notNull(),
    rating: integer("rating").notNull(),
    message: text("message"),
    approved: boolean("approved").notNull().default(true),
    fingerprint: text("fingerprint").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("ratings_fingerprint_unique").on(table.fingerprint),
    index("ratings_created_at_idx").on(table.createdAt),
  ],
);

/** The subset of the schema Better Auth's Drizzle adapter needs. */
export const authSchema = { user, account, session, verification };
