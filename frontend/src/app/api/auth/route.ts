import { createClient } from "@supabase/supabase-js";
import { SignJWT } from "jose";
import { type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const secret = new TextEncoder().encode("secret");
  const body = await request.json();

  const { name, email } = body as any;
  const supabase = createClient(
    process.env.DB_URL as string,
    process.env.DB_SECRET_KEY as string
  );

  let dbResp = await supabase
    .from("user")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (!dbResp.data) {
    dbResp = await supabase
      .from("user")
      .insert({ name, email, tokens: 100 })
      .select()
      .single();
  }

  const id = dbResp.data!.id;

  const jwt = await new SignJWT({ id, name, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1y")
    .sign(secret);
  return Response.json({
    jwt,
    name,
    email,
  });
}

export const runtime = "edge";
