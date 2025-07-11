-- Enable RLS
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "match" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cron_log" ENABLE ROW LEVEL SECURITY;

-- Enable Supabase Realtime for `match` table
ALTER PUBLICATION supabase_realtime ADD TABLE "match";
-- Enable Supabase Realtime for `current_match` table
ALTER PUBLICATION supabase_realtime ADD TABLE "current_match";
-- Enable Supabase Realtime for `upcoming_match` table
ALTER PUBLICATION supabase_realtime ADD TABLE "upcoming_match";

-- Public read access to match data
CREATE POLICY "Anyone can read match data"
  ON "match"
  FOR SELECT
  TO public
  USING (true);

-- Public read access to current match data
CREATE POLICY "Anyone can read current match data"
  ON "current_match"
  FOR SELECT
  TO public
  USING (true);

-- Public read access to upcoming match data
CREATE POLICY "Anyone can read upcoming match data"
  ON "upcoming_match"
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to view their own user row
CREATE POLICY "Enable users to view their own data only"
  ON "user"
  FOR SELECT
  TO authenticated
  USING ("id" = auth.uid());

-- Allow authenticated users to insert their own vote
CREATE POLICY "Users can insert their own vote"
  ON "vote"
  FOR INSERT
  TO authenticated
  WITH CHECK ("user_id" = auth.uid());

-- Allow authenticated users to view their own votes
CREATE POLICY "Users can view their own vote"
  ON "vote"
  FOR SELECT
  TO authenticated
  USING ("user_id" = auth.uid());

-- Allow service_role to insert cron logs
CREATE POLICY "Allow service role insert"
  ON "cron_log"
  FOR INSERT
  TO service_role
  WITH CHECK (true);
