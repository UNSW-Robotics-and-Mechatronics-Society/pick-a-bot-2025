import { isYupValidationError, validateObject } from "@/lib";
import { createClient } from "@/lib/supabase/client";
import { userDataSchema } from "@/schemas";
import { useQuery } from "@tanstack/react-query";

export function useUserProfile() {
  const query = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const supabase = createClient();

      const { data: profileData, error: fetchError } = await supabase
        .from("user")
        .select("*")
        .single();
      if (fetchError || !profileData) {
        throw new Error("Failed to fetch user profile");
      }

      const validated = await validateObject(profileData, userDataSchema, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (isYupValidationError(validated)) {
        throw new Error("User profile validation failed");
      }
      return validated;
    },
  });

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    /** Call this to force-reload the profile from the server */
    refetch: query.refetch,
  };
}
