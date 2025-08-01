import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const GET = async () => {
  try {
    const supabase = await createClient();

    const { data: transactionData, error: transactionError } =
      await supabase.from("token_transaction").select(`
        amount, 
        balance_before, 
        balance_after, 
        bot_chosen,
        winner,
        match (
          bot1,
          bot2,
          ordering
        )
      `);

    if (transactionError || !transactionData) {
      throw new Error("No transaction found");
    }

    return NextResponse.json(transactionData);
  } catch (err) {
    console.error("Error fetching user data:", err);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
};
