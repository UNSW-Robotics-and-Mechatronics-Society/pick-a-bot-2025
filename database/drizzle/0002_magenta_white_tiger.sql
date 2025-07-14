CREATE TABLE "current_match" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
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
	"updated_time" timestamp with time zone DEFAULT now(),
	"is_final" boolean DEFAULT false NOT NULL,
	CONSTRAINT "current_match_ordering_unique" UNIQUE("ordering")
);
--> statement-breakpoint
CREATE TABLE "upcoming_match" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
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
	"updated_time" timestamp with time zone DEFAULT now(),
	"is_final" boolean DEFAULT false NOT NULL,
	CONSTRAINT "upcoming_match_ordering_unique" UNIQUE("ordering")
);
--> statement-breakpoint
ALTER TABLE "current_match" ADD CONSTRAINT "current_match_match_id_match_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."match"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "upcoming_match" ADD CONSTRAINT "upcoming_match_match_id_match_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."match"("id") ON DELETE no action ON UPDATE no action;