CREATE TABLE "github_stats" (
	"user_id" text PRIMARY KEY NOT NULL,
	"login" text NOT NULL,
	"followers" integer DEFAULT 0 NOT NULL,
	"public_repos" integer DEFAULT 0 NOT NULL,
	"total_stars" integer DEFAULT 0 NOT NULL,
	"repo_count" integer DEFAULT 0 NOT NULL,
	"top_languages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "github_stats" ADD CONSTRAINT "github_stats_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "github_stats_total_stars_idx" ON "github_stats" USING btree ("total_stars");