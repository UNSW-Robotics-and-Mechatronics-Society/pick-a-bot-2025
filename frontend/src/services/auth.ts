"use server";

import { SupabaseClient } from "@supabase/supabase-js";

export const isValidAccessCode = async (code: string): Promise<boolean> => {
  const REQUIRED_ACCESS_CODE = process.env.ACCESS_CODE;
  if (!REQUIRED_ACCESS_CODE) {
    throw new Error("Access code is not set");
  }
  return code === REQUIRED_ACCESS_CODE;
};

export const signInOrSignUp = async (
  supabase: SupabaseClient,
  email: string,
  name: string
): Promise<{ user: { id: string } } | { error: string; status: number }> => {
  const REQUIRED_ACCESS_CODE = process.env.ACCESS_CODE;
  if (!REQUIRED_ACCESS_CODE) {
    return { error: "Access code is not set", status: 500 };
  }

  // try sign-in
  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({
      email,
      password: REQUIRED_ACCESS_CODE,
    });
  if (signInData?.user) {
    return { user: signInData.user };
  }

  // if “invalid credentials”, sign-up
  if (signInError?.code === "invalid_credentials") {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
      {
        email,
        password: REQUIRED_ACCESS_CODE,
        options: { data: { displayName: name, emailConfirmed: true } },
      }
    );
    if (signUpError) {
      console.error("Sign-up error:", signUpError);
      return { error: `Sign-up failed: ${signUpError.message}`, status: 500 };
    }
    return { user: signUpData.user! };
  }

  // any other error
  return { error: `Sign-in failed: ${signInError?.message}`, status: 500 };
};
