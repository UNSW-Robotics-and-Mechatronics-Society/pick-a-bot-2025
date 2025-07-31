import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("leaderboard")
      .select("name, tokens, rank, id")
      .order("rank", { ascending: true })
      .order("name", { ascending: true });

    if (!data || error) {
      throw new Error("No data found");
    }

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      throw new Error("No user found");
    }

    const userId = authData.user?.id;
    const userData = data.find((item) => item.id === userId);

    const leaderboard = {
      top: data.slice(0, 10).map((item) => ({
        name: item.name,
        points: item.tokens,
        rank: item.rank,
      })),
      self: {
        name: userData!.name,
        points: userData!.tokens,
        rank: userData!.rank,
      },
    };

    return NextResponse.json(leaderboard);
  } catch (err) {
    console.error("Error fetching leaderboard:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
