import { SupabaseClient } from "@supabase/supabase-js";

export const upsertProfile = async (
  supabase: SupabaseClient,
  id: string,
  name: string,
  email: string
): Promise<{ success: boolean; error?: string }> => {
  const { error } = await supabase
    .from("user")
    .upsert({ id, name, email, tokens: 100 }, { onConflict: "id" });
  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Profile already exists" };
    }
    return { success: false, error: `Profile upsert failed: ${error.message}` };
  }
  return { success: true };
};
