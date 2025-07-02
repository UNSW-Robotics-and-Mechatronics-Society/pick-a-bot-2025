import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { decodeJwt } from "jose";

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
}

export async function POST(request: NextResponse) {
  const supabase = createClient(
    process.env.DB_URL as string,
    process.env.DB_SECRET_KEY as string
  );

  const body = await request.json();
  const { matchId, botChosen, amount, jwt } = body as bodyRequest;

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

  if (matchData.state !== "open") {
    return NextResponse.json(
      { error: "Match should be open" },
      { status: 400 }
    );
  }

  // Round 5 = the finals
  if (matchData.round != 5) {
    const amountBet = tokens * 0.5;
    if (amount > amountBet) {
      return NextResponse.json(
        {
          error:
            "Not final round! only allow less than or equal to half amount of total tokens",
        },
        { status: 400 }
      );
    }
  }

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

  // Insert the voting to supabase VOTE
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

  // Insert this specific vote to USERVOTE DB
  const voteData = data?.shift();
  ({ data, error } = await supabase.from("user_vote").insert([
    {
      user_id: id,
      vote_id: voteData.id,
    },
  ]));

  const tokenBalance = tokens - amount;

  return NextResponse.json({
    sucess: true,
    newTokenBalance: tokenBalance,
  });
}
