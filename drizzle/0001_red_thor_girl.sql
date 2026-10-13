CREATE TABLE "ratings" (
	"id" text PRIMARY KEY NOT NULL,
	"author_name" text NOT NULL,
	"rating" integer NOT NULL,
	"message" text,
	"approved" boolean DEFAULT true NOT NULL,
	"fingerprint" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ratings_fingerprint_unique" UNIQUE("fingerprint")
);
--> statement-breakpoint
CREATE INDEX "ratings_created_at_idx" ON "ratings" USING btree ("created_at");