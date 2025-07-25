import { createClient } from "@/lib/supabase/server";
import { CurrentMatchData } from "@/schemas";
import { NextResponse, type NextRequest } from "next/server";

type DeletePayload<T = object> = {
  type: "DELETE";
  table: string;
  schema: string;
  record: null;
  old_record: T;
};

export async function POST(request: NextRequest) {
  const webhookSecret = request.headers.get("x-webhook-secret");
  if (webhookSecret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const supabase = await createClient();

  const payload: DeletePayload<CurrentMatchData> = await request.json();
  const { match_id, winner } = payload.old_record;

  const { data: votes, error: votesError } = await supabase
    .from("vote")
    .select("user_id, bot_chosen, used_tokens")
    .eq("match_id", match_id);

  if (votesError)
    return NextResponse.json(
      { error: "Error in fetching votes" },
      { status: 400 }
    );

  for (const vote of votes) {
    let newAmount: number;
    const initial = await supabase
      .from("user")
      .select("tokens")
      .eq("id", vote.user_id)
      .single();
    if (vote.bot_chosen !== winner) {
      newAmount = Number(initial) - Number(vote.used_tokens);
    } else {
      newAmount = Number(initial) + Number(vote.used_tokens);
    }
    const { error: updateErr } = await supabase
      .from("user")
      .update({ tokens: newAmount })
      .eq("id", vote.user_id);
    if (updateErr)
      return NextResponse.json(
        { error: "Token update failed" },
        { status: 400 }
      );
    const { error: transErr } = await supabase
      .from("token_transaction")
      .insert({
        user_id: vote.user_id,
        match_id: match_id,
        amount: vote.used_tokens,
        balance_before: initial,
        balance_after: newAmount,
      });
    if (transErr)
      return NextResponse.json(
        { error: "Transaction update failed" },
        { status: 400 }
      );
  }
  return NextResponse.json({ votesUpdated: votes.length }, { status: 200 });
}
