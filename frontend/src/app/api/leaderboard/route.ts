import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const dbResp = await supabase
      .from("leaderboard")
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
