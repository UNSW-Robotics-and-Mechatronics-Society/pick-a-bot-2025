ALTER TABLE "match" ADD COLUMN "is_final" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "match" ADD CONSTRAINT "match_ordering_unique" UNIQUE("ordering");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_email_unique" UNIQUE("email");