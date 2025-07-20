import { NextResponse, type NextRequest } from "next/server";

import { joinSchema } from "@/schemas";
import { validateRequest } from "@lib";
import { createClient } from "@lib/supabase/server";
import { isValidAccessCode, signInOrSignUp, upsertProfile } from "@services";

export const POST = async (request: NextRequest) => {
  const supabase = await createClient();

  const result = await validateRequest(
    request,
    joinSchema,
    {
      abortEarly: false,
      stripUnknown: true,
    },
    {
      pre: async (raw) => {
        const { accessCode } = raw as { accessCode: string };
        if (!accessCode) {
          return { error: "Access code is required", status: 400 };
        }
        if (!(await isValidAccessCode(accessCode))) {
          return { error: "Invalid access code", status: 403 };
        }
      },
    }
  );

  if ("error" in result) {
    const err = result;
    return NextResponse.json({ error: err.error }, { status: err.status });
  }
  const { name, email } = result as { name: string; email: string };

  const authRes = await signInOrSignUp(supabase, email, name);
  if ("error" in authRes) {
    return NextResponse.json(
      { error: authRes.error },
      { status: authRes.status }
    );
  }

  const profileRes = await upsertProfile(
    supabase,
    authRes.user.id,
    name,
    email
  );
  if (!profileRes.success) {
    console.error("Profile upsert error:", profileRes.error);
    return NextResponse.json(
      { error: profileRes.error },
      { status: profileRes.status }
    );
  }

  return NextResponse.json({ message: "Welcome!", userId: authRes.user.id });
};
