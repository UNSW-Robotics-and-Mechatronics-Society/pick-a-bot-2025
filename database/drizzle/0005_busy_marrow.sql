DROP TABLE "upcoming_match" CASCADE;--> statement-breakpoint
CREATE VIEW "public"."leaderboard" AS (select "id", "email", "name", "tokens" from "user");