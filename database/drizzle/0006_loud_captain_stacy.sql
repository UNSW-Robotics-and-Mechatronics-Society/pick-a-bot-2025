ALTER TABLE "vote" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vote" ALTER COLUMN "match_id" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_match" ON "vote" USING btree ("user_id","match_id");