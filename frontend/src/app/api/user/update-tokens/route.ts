import { Tables } from "@/types/database.types";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

type DeletePayload<T = object> = {
  type: "DELETE";
  table: string;
  schema: string;
  record: null;
  old_record: T;
};

export const POST = async (request: NextRequest) => {
  const webhookSecret = request.headers.get("x-webhook-secret");
  if (webhookSecret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let payload: DeletePayload<Tables<"current_match">>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid or empty JSON body" },
      { status: 400 }
    );
  }
  const { match_id, winner } = payload.old_record;

  if (!winner) {
    return NextResponse.json(
      { message: "Match does not have a winner" },
      { status: 200 }
    );
  }

  console.log(`Updating tokens for match ${match_id} with winner ${winner}`);

  // Fetch all votes for this match where bot_chosen != winner
  const { data: votes, error: votesError } = await supabase
    .from("vote")
    .select("user_id, bot_chosen, used_tokens")
    .eq("match_id", match_id);

  if (votesError)
    return NextResponse.json(
      { error: "Error in fetching votes" },
      { status: 400 }
    );

  if (!votes || votes.length === 0) {
    return NextResponse.json({ votesUpdated: 0 }, { status: 200 });
  }

  // Fetch all affected users' tokens in one query
  const userIds = votes.map((vote) => vote.user_id);
  const { data: users, error: usersError } = await supabase
    .from("user")
    .select("id, tokens")
    .in("id", userIds);

  if (usersError)
    return NextResponse.json(
      { error: "Error in fetching user data" },
      { status: 400 }
    );

  // Fetch existing transactions for this match and these users
  const { data: prevTransactions, error: prevTransError } = await supabase
    .from("token_transaction")
    .select("user_id")
    .eq("match_id", match_id)
    .in("user_id", userIds);

  if (prevTransError)
    return NextResponse.json(
      { error: "Error in fetching previous transactions" },
      { status: 400 }
    );

  const alreadyUpdatedUserIds = new Set(
    (prevTransactions ?? []).map((t) => t.user_id)
  );

  // Prepare bulk update and transaction arrays
  const updates = [];
  const transactions = [];

  for (const vote of votes) {
    if (alreadyUpdatedUserIds.has(vote.user_id)) continue;

    const userData = users.find((u) => u.id === vote.user_id);
    if (!userData) continue;

    const balance_before = Number(userData.tokens ?? 0);
    const used_tokens = Number(vote.used_tokens ?? 0);

    let newAmount = balance_before;
    let description = `Match ${match_id} vote update`;
    if (vote.bot_chosen === winner) {
      newAmount += used_tokens * 2; // Double tokens for correct guess
      description += ` - Correct guess for bot ${vote.bot_chosen}`;
    } else {
      newAmount -= used_tokens; // Lose tokens for wrong guess
      description += ` - Wrong guess for bot ${vote.bot_chosen}`;
    }

    updates.push({ id: vote.user_id, tokens: newAmount });
    transactions.push({
      amount: used_tokens,
      balance_after: newAmount,
      balance_before,
      match_id: match_id,
      user_id: vote.user_id,
      description,
    });
  }

  // Bulk update tokens
  if (updates.length > 0) {
    const { error: updateErr } = await supabase
      .from("user")
      .upsert(updates, { onConflict: "id" });
    if (updateErr)
      return NextResponse.json(
        { error: "Token bulk update failed" },
        { status: 400 }
      );
  }

  // Bulk insert transactions
  if (transactions.length > 0) {
    const { error: transErr } = await supabase
      .from("token_transaction")
      .insert(transactions);
    if (transErr)
      return NextResponse.json(
        { error: "Transaction bulk insert failed" },
        { status: 400 }
      );
  }

  return NextResponse.json({ votesUpdated: updates.length }, { status: 200 });
};
