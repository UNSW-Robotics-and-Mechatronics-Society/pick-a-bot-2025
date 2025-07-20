-- Enable RLS
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "match" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "current_match" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cron_log" ENABLE ROW LEVEL SECURITY;

-- Enable Supabase Realtime for tables (only if not already added)
-- Check if table is already in publication before adding
DO $$
BEGIN
    -- Add match table to realtime if not already present
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'match'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE "match";
    END IF;

    -- Add current_match table to realtime if not already present
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'current_match'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE "current_match";
    END IF;
END $$;

-- Create policies only if they don't exist
DO $$
BEGIN
    -- Public read access to match data
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'match' AND policyname = 'Anyone can read match data'
    ) THEN
        CREATE POLICY "Anyone can read match data"
          ON "match"
          FOR SELECT
          TO public
          USING (true);
    END IF;

    -- Public read access to current match data
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'current_match' AND policyname = 'Anyone can read current match data'
    ) THEN
        CREATE POLICY "Anyone can read current match data"
          ON "current_match"
          FOR SELECT
          TO public
          USING (true);
    END IF;

    -- Allow authenticated users to view their own user row
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'user' AND policyname = 'Enable users to view their own data only'
    ) THEN
        CREATE POLICY "Enable users to view their own data only"
          ON "user"
          FOR SELECT
          TO authenticated
          USING ("id" = auth.uid());
    END IF;

    -- Allow authenticated users to insert their own user row
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'user' AND policyname = 'Users can insert own user row'
    ) THEN
        CREATE POLICY "Users can insert own user row"
          ON "user"
          FOR INSERT
          TO authenticated
          WITH CHECK ("id" = auth.uid());
    END IF;

    -- Allow authenticated users to update their own user row
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'user' AND policyname = 'Users can update own user row'
    ) THEN
        CREATE POLICY "Users can update own user row"
          ON "user"
          FOR UPDATE
          TO authenticated
          USING ("id" = auth.uid());
    END IF;

    -- Allow authenticated users to insert their own vote
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'vote' AND policyname = 'Users can insert their own vote'
    ) THEN
        CREATE POLICY "Users can insert their own vote"
          ON "vote"
          FOR INSERT
          TO authenticated
          WITH CHECK ("user_id" = auth.uid());
    END IF;

    -- Allow authenticated users to view their own votes
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'vote' AND policyname = 'Users can view their own vote'
    ) THEN
        CREATE POLICY "Users can view their own vote"
          ON "vote"
          FOR SELECT
          TO authenticated
          USING ("user_id" = auth.uid());
    END IF;

    -- Allow service_role to insert cron logs
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'cron_log' AND policyname = 'Allow service role insert'
    ) THEN
        CREATE POLICY "Allow service role insert"
          ON "cron_log"
          FOR INSERT
          TO service_role
          WITH CHECK (true);
    END IF;
END $$;
