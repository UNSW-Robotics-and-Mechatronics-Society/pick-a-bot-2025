"use client";
import { createClient } from "@/lib/supabase/client";

export const getActiveUser = async () => {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    throw new Error("User not authenticated");
  }
  return data.user;
};

export const getActiveUserName = async () => {
  const user = await getActiveUser();
  return user?.user_metadata?.displayName;
};

export const getActiveUserEmail = async () => {
  const user = await getActiveUser();
  return user?.email;
};

export const getActiveUserId = async () => {
  const user = await getActiveUser();
  return user?.id;
};
