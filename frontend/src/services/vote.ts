import { CurrentMatchData, VoteFormData } from "@/schemas";
import { SupabaseClient } from "@supabase/supabase-js";

export const enforceVoteRules = (
  userTokens: number,
  match: CurrentMatchData,
  vote: VoteFormData
) => {
  if (match.match_id !== vote.matchId) {
    return { error: "Match ID mismatch", status: 400 };
  }
  if (match.underway_time) {
    const startTs = new Date(match.underway_time).getTime();
    const cutoffTs = startTs + 5 * 60 * 1000; // +5 minutes
    if (Date.now() > cutoffTs) {
      return {
        ok: false,
        error: "Betting window has closed for this match",
        status: 400,
      };
    }
  }
  if (!match.is_final && vote.amount > userTokens * 0.5) {
    return {
      error: "Can only vote up to half your tokens until finals",
      status: 400,
    };
  }
  if (vote.botChosen !== match.bot1 && vote.botChosen !== match.bot2) {
    return { ok: false, error: "Chosen bot not in this match", status: 400 };
  }
  return { ok: true };
};

export const commitVote = async (
  supabase: SupabaseClient,
  userId: string,
  matchId: string,
  botChosen: string,
  voteAmt: number
) => {
  const { error: voteErr } = await supabase.from("vote").insert({
    user_id: userId,
    match_id: matchId,
    bot_chosen: botChosen,
    used_tokens: voteAmt,
  });
  if (voteErr?.code === "23505") {
    return { ok: false, error: "Already voted for this match", status: 400 };
  } else if (voteErr) {
    return { ok: false, error: `Vote failed: ${voteErr.message}`, status: 500 };
  }

  return { ok: true };
};
