import { NextResponse, type NextRequest } from "next/server";
import * as yup from "yup";

import { validateRequest } from "@lib";
import { createClient } from "@lib/supabase/server";
import { signInOrSignUp, upsertProfile } from "@services";

const joinSchema = yup.object({
  accessCode: yup
    .string()
    .required("`accessCode` is required")
    .oneOf(["PICKABOT2025"], "`accessCode` must match"),
  name: yup.string().required("`name` is required"),
  email: yup
    .string()
    .email("`email` must be valid")
    .required("`email` is required"),
});

export const POST = async (request: NextRequest) => {
  const supabase = await createClient();

  const result = await validateRequest(request, joinSchema, {
    abortEarly: false,
    stripUnknown: true,
  });
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
    return NextResponse.json({ error: profileRes.error }, { status: 500 });
  }

  return NextResponse.json({ message: "Welcome!", userId: authRes.user.id });
};
