

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";





SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."cron_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "run_at" timestamp with time zone NOT NULL,
    "payload" "text",
    "by" "text" DEFAULT 'cron'::"text" NOT NULL,
    "status" "text" DEFAULT 'SUCCESS'::"text" NOT NULL,
    CONSTRAINT "cron_logs_status_check" CHECK (("status" = ANY (ARRAY['SUCCESS'::"text", 'FAILURE'::"text"])))
);


ALTER TABLE "public"."cron_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."cron_logs" IS 'Stores logs for CRON';



CREATE TABLE IF NOT EXISTS "public"."match" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "challonge_match_id" integer NOT NULL,
    "bot1" "text" NOT NULL,
    "bot2" "text" NOT NULL,
    "winner" "text",
    "score_bot1" smallint DEFAULT '0'::smallint,
    "round" integer NOT NULL,
    "state" "text" DEFAULT ''::"text" NOT NULL,
    "start_time" timestamp with time zone,
    "score_bot2" smallint DEFAULT '0'::smallint,
    "ordering" bigint NOT NULL,
    "tournament_id" "text" NOT NULL,
    "updated_time" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text"),
    CONSTRAINT "match_state_check" CHECK (("state" = ANY (ARRAY['pending'::"text", 'open'::"text", 'complete'::"text"])))
);


ALTER TABLE "public"."match" OWNER TO "postgres";


COMMENT ON TABLE "public"."match" IS 'Stores current match state and results synced from Challonge.';



CREATE TABLE IF NOT EXISTS "public"."user" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" DEFAULT ''::"text" NOT NULL,
    "email" "text" DEFAULT ''::"text" NOT NULL,
    "tokens" integer DEFAULT 100 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user" OWNER TO "postgres";


COMMENT ON TABLE "public"."user" IS 'Stores user info, token balance and total points earned';



CREATE TABLE IF NOT EXISTS "public"."user_vote" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" DEFAULT "gen_random_uuid"(),
    "vote_id" "uuid" DEFAULT "gen_random_uuid"()
);


ALTER TABLE "public"."user_vote" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_vote" IS 'TODO: add more columns';



CREATE TABLE IF NOT EXISTS "public"."vote" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "match_id" "uuid",
    "bot_chosen" "text" NOT NULL,
    "used_tokens" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."vote" OWNER TO "postgres";


COMMENT ON TABLE "public"."vote" IS 'Logs individual votes and how many points were earned per match.';



ALTER TABLE ONLY "public"."cron_logs"
    ADD CONSTRAINT "cron_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."match"
    ADD CONSTRAINT "match_ordering_key" UNIQUE ("ordering");



ALTER TABLE ONLY "public"."match"
    ADD CONSTRAINT "match_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user"
    ADD CONSTRAINT "user_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."user"
    ADD CONSTRAINT "user_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_vote"
    ADD CONSTRAINT "user_vote_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vote"
    ADD CONSTRAINT "vote_pkey" PRIMARY KEY ("id");



CREATE INDEX "match_state_idx" ON "public"."match" USING "btree" ("state");



CREATE INDEX "vote_match_id_idx" ON "public"."vote" USING "btree" ("match_id");



CREATE INDEX "vote_user_id_idx" ON "public"."vote" USING "btree" ("user_id");



ALTER TABLE ONLY "public"."user_vote"
    ADD CONSTRAINT "user_vote_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON UPDATE CASCADE;



ALTER TABLE ONLY "public"."user_vote"
    ADD CONSTRAINT "user_vote_vote_id_fkey" FOREIGN KEY ("vote_id") REFERENCES "public"."vote"("id") ON UPDATE CASCADE;



ALTER TABLE ONLY "public"."vote"
    ADD CONSTRAINT "vote_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."match"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vote"
    ADD CONSTRAINT "vote_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE;



CREATE POLICY "Allow service role insert" ON "public"."cron_logs" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Anyone can read match data" ON "public"."match" FOR SELECT USING (true);



CREATE POLICY "Enable users to view their own data only" ON "public"."user" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "Users can insert their own vote" ON "public"."vote" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own vote" ON "public"."vote" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."cron_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."match" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_vote" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vote" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."match";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."user";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";








































































































































































GRANT ALL ON TABLE "public"."cron_logs" TO "anon";
GRANT ALL ON TABLE "public"."cron_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."cron_logs" TO "service_role";



GRANT ALL ON TABLE "public"."match" TO "anon";
GRANT ALL ON TABLE "public"."match" TO "authenticated";
GRANT ALL ON TABLE "public"."match" TO "service_role";



GRANT ALL ON TABLE "public"."user" TO "anon";
GRANT ALL ON TABLE "public"."user" TO "authenticated";
GRANT ALL ON TABLE "public"."user" TO "service_role";



GRANT ALL ON TABLE "public"."user_vote" TO "anon";
GRANT ALL ON TABLE "public"."user_vote" TO "authenticated";
GRANT ALL ON TABLE "public"."user_vote" TO "service_role";



GRANT ALL ON TABLE "public"."vote" TO "anon";
GRANT ALL ON TABLE "public"."vote" TO "authenticated";
GRANT ALL ON TABLE "public"."vote" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
