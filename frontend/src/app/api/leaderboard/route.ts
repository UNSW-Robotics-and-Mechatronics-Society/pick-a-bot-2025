import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("leaderboard")
      .select("name, tokens, rank")
      .order("rank", { ascending: true })
      .order("name", { ascending: true });

    if (!data || error) {
      throw new Error("No data found");
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Error fetching leaderboard:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
