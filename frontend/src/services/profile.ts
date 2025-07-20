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
    return { success: false, error: `Profile upsert failed: ${error.message}` };
  }
  return { success: true };
};
