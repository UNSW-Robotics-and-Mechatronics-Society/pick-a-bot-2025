import { SupabaseClient } from "@supabase/supabase-js";

export const upsertProfile = async (
  supabase: SupabaseClient,
  id: string,
  name: string,
  email: string
): Promise<{ success: boolean; error?: string; status?: number }> => {
  const { error } = await supabase
    .from("user")
    .upsert({ id, name, email }, { onConflict: "id" });
  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Profile already exists", status: 409 };
    }
    return {
      success: false,
      error: `Profile upsert failed: ${error.message}`,
      status: 500,
    };
  }
  return { success: true };
};
