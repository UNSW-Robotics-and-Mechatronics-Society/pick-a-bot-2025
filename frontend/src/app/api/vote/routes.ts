import { createClient } from "@supabase/supabase-js";
import { decodeJwt } from "jose";
import { NextRequest, NextResponse } from "next/server";

interface bodyRequest {
  matchId: string;
  botChosen: string;
  amount: number;
  jwt: string;
}

interface jwtUserData {
  id: string;
  name: string;
  email: string;
  iat: number;
  exp: number;
}

interface userData {
  id: string;
  name: string;
  email: string;
  tokens: number;
  created_at: string;
}

interface matchData {
  id: string;
  challonge_match_id: number;
  bot1: string;
  bot2: string;
  winner: string;
  score_bot1: number;
  round: number;
  state: string;
  start_time: string;
  score_bot2: number;
  ordering: number;
  tournament_id: string;
  updated_time: string;
  is_final: boolean;
}

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.DB_URL as string,
    process.env.DB_SECRET_KEY as string
  );

  let body: bodyRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Check if matchId can be parsed into integer
  const { matchId, botChosen, amount, jwt } = body;
  const matchIdInt = parseInt(body.matchId, 10);
  if (Number.isNaN(matchIdInt)) {
    return NextResponse.json({ error: "Invalid matchId" }, { status: 400 });
  }

  // Get user's data from localstorage
  const jwtUserData: jwtUserData = decodeJwt(jwt);
  const { id } = jwtUserData;
  let { data, error } = await supabase.from("user").select("*").eq("id", id);

  if (error || !data || data.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const userData: userData = data.shift();
  const { tokens } = userData;

  // Get match's data
  ({ data, error } = await supabase
    .from("match")
    .select("*")
    .eq("challonge_match_id", matchId));

  if (error || !data || data.length === 0) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }

  const matchData: matchData = data.shift();

  // Validation
  // 1. Open state
  // 2. Check final
  //    Yes => allow all in bet
  //    No  => only allow <= 50%
  // 3. Only one vote per matchId
  // 4. Check that the bot chosen exist in match id

  if (matchData.state !== "open") {
    return NextResponse.json(
      { error: "Match should be open" },
      { status: 400 }
    );
  }

  if (!matchData.is_final) {
    const limitBet = tokens * 0.5;
    if (amount > limitBet) {
      return NextResponse.json(
        {
          error:
            "Not final round! only allow less than or equal to half amount of total tokens",
        },
        { status: 400 }
      );
    }
  }

  if (matchData.bot1 !== botChosen && matchData.bot2 !== botChosen) {
    return NextResponse.json(
      { error: "Bot chosen does not exist in match chosen" },
      { status: 400 }
    );
  }

  // Insert Voting
  ({ data, error } = await supabase
    .from("vote")
    .select("id")
    .eq("user_id", id)
    .eq("match_id", matchData.id));

  if (data !== null && data.length !== 0) {
    return NextResponse.json(
      { error: "Only allowed one vote per matchId" },
      { status: 400 }
    );
  }

  ({ data, error } = await supabase
    .from("vote")
    .insert([
      {
        user_id: id,
        match_id: matchData.id,
        bot_chosen: botChosen,
        used_tokens: amount,
      },
    ])
    .select("id"));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const tokenBalance = tokens - amount;

  return NextResponse.json({
    sucess: true,
    newTokenBalance: tokenBalance,
  });
}
