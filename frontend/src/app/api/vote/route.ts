import { isYupValidationError, validateObject, validateRequest } from "@/lib";
import { createClient } from "@/lib/supabase/server";
import {
  currentMatchDataSchema,
  userDataSchema,
  voteRequestSchema,
} from "@/schemas";
import { commitVote, enforceVoteRules } from "@/services/vote";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (request: NextRequest) => {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const matchId = searchParams.get("matchId");
  if (!matchId) {
    return NextResponse.json(
      { error: "Match ID is required" },
      { status: 400 }
    );
  }

  const { data: voteData, error: voteError } = await supabase
    .from("vote")
    .select("*")
    .eq("match_id", matchId)
    .single();

  if (voteError || !voteData) {
    if (voteError.code === "PGRST116") {
      return new NextResponse(null, {
        status: 204,
      });
    }
    return NextResponse.json({ error: "Vote not found" }, { status: 404 });
  }

  return NextResponse.json(
    { vote: voteData },
    {
      status: 200,
    }
  );
};

export const POST = async (request: NextRequest) => {
  const supabase = await createClient();
  console.log("Processing vote request...");

  const vote = await validateRequest(request, voteRequestSchema, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (isYupValidationError(vote)) {
    return NextResponse.json({ error: vote.error }, { status: vote.status });
  }

  const { data: userRaw, error: userError } = await supabase
    .from("user")
    .select("*");

  if (userError || !userRaw) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }

  if (userRaw.length > 1) {
    return NextResponse.json(
      { error: "Multiple users found, expected one" },
      { status: 500 }
    );
  }

  const user = await validateObject(userRaw[0], userDataSchema, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (isYupValidationError(user)) {
    return NextResponse.json({ error: user.error }, { status: user.status });
  }

  // Get current match's data
  const { data: currentMatchRaw, error: currentMatchError } = await supabase
    .from("current_match")
    .select("*");

  if (currentMatchError || !currentMatchRaw) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  } else if (currentMatchRaw.length > 1) {
    return NextResponse.json(
      { error: "Multiple current matches found, expected one" },
      { status: 500 }
    );
  }

  const currentMatch = await validateObject(
    currentMatchRaw[0],
    currentMatchDataSchema,
    {
      abortEarly: false,
      stripUnknown: true,
    }
  );

  if (isYupValidationError(currentMatch)) {
    return NextResponse.json(
      { error: currentMatch.error },
      { status: currentMatch.status }
    );
  }

  if (currentMatch.match_id !== vote.matchId) {
    return NextResponse.json(
      { error: "Match ID does not match current match" },
      { status: 400 }
    );
  }

  const rules = enforceVoteRules(user.tokens, currentMatch, vote);
  if (!rules.ok) {
    return NextResponse.json({ error: rules.error }, { status: rules.status });
  }

  const insertedVote = await commitVote(
    supabase,
    user.id,
    currentMatch.match_id,
    vote.botChosen,
    vote.amount
  );
  if (!insertedVote.ok) {
    return NextResponse.json(
      { error: insertedVote.error },
      { status: insertedVote.status }
    );
  }

  return new NextResponse(null, {
    status: 204,
  });
};
