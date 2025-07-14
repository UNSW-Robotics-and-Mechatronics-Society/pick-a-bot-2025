CREATE TYPE "public"."match_state" AS ENUM('pending', 'open', 'complete');--> statement-breakpoint
CREATE TABLE "cron_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_at" timestamp with time zone NOT NULL,
	"payload" text,
	"by" text DEFAULT 'cron' NOT NULL,
	"status" text DEFAULT 'SUCCESS' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challonge_match_id" integer NOT NULL,
	"bot1" text NOT NULL,
	"bot2" text NOT NULL,
	"winner" text,
	"score_bot1" smallint DEFAULT 0,
	"score_bot2" smallint DEFAULT 0,
	"round" integer NOT NULL,
	"state" "match_state" DEFAULT 'pending' NOT NULL,
	"start_time" timestamp with time zone,
	"ordering" integer NOT NULL,
	"tournament_id" text NOT NULL,
	"updated_time" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"email" text DEFAULT '' NOT NULL,
	"tokens" integer DEFAULT 100 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vote" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"match_id" uuid,
	"bot_chosen" text NOT NULL,
	"used_tokens" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "vote" ADD CONSTRAINT "vote_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote" ADD CONSTRAINT "vote_match_id_match_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."match"("id") ON DELETE cascade ON UPDATE no action;