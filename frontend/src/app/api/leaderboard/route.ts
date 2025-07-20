import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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

    return NextResponse.json({
      dbResp,
    });
  } catch (err) {
    console.error("Error fetching leaderboard:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
