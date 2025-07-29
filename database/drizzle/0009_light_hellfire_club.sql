DROP VIEW "public"."leaderboard";--> statement-breakpoint
ALTER TABLE "token_transaction" ADD COLUMN "winner" text NOT NULL;--> statement-breakpoint
ALTER TABLE "token_transaction" ADD COLUMN "bot_chosen" text NOT NULL;--> statement-breakpoint
ALTER TABLE "token_transaction" ADD COLUMN "balance_delta" integer NOT NULL;--> statement-breakpoint
CREATE VIEW "public"."leaderboard" AS (select "id", "email", "name", "tokens", DENSE_RANK() OVER (ORDER BY "tokens" DESC, "name" ASC) as "rank" from "user");