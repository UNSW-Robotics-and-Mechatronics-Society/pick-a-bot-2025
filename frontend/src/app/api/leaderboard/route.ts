import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.DB_URL as string,
      process.env.DB_SECRET_KEY as string
    );
    const dbResp = await supabase
      .from("user")
      .select("name, tokens")
      .order("tokens", { ascending: false });

    if (!dbResp.data) {
      throw new Error("No data found");
    }

    console.log(dbResp);

    return Response.json({
      dbResp,
    });
  } catch (err) {
    console.error("Error fetching leaderboard:", err);
  }
}
