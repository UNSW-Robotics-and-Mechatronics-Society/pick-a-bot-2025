import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const GET = async () => {
  try {
    const supabase = await createClient();
    const user = await supabase.from("user").select("name, tokens").single();
    return NextResponse.json({
      name: user?.data?.name,
      points: user?.data?.tokens,
    });
  } catch (err) {
    console.error("Error fetching user:", err);
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }
};
