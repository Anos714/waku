ALTER TABLE "github_stats" ADD COLUMN "score" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "github_stats_score_idx" ON "github_stats" USING btree ("score");