import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL: string = process.env.DB_URL!;
const SUPABASE_KEY: string = process.env.DB_SECRET_KEY!;

export async function GET() {
  // Make requests to supabase server
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    // Get the current mathes
    // 1. Get all matches
    // 1. Filter Matches.round = "open"
    // 2. First order one (first row)

    let { data, error } = await supabase
      .from("match")
      .select("*")
      .eq("state", "open")
      .order("round", { ascending: true })
      .limit(1);

    // <TODO: handle if no open matches found>
    if (error || !data || data.length === 0) {
      return NextResponse.json(
        { error: "No open matches found" },
        { status: 404 }
      );
    }

    const currentMatch = data[0];

    return NextResponse.json({
      matchId: currentMatch.challonge_match_id,
      bot1: currentMatch.bot1,
      bot2: currentMatch.bot2,
      round: currentMatch.round,
      state: currentMatch.state,
      winner: currentMatch.winner,
      score: currentMatch.score,
      isFinal: currentMatch.round === "finals",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
