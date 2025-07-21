// src/hooks/useCurrentMatch.ts
"use client";

import { isYupValidationError, validateObject } from "@/lib";
import { createClient } from "@/lib/supabase/client";
import { currentMatchDataSchema } from "@/schemas";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

export function useCurrentMatch() {
  const supabase = createClient();

  const query = useQuery({
    queryKey: ["current_match"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("current_match")
        .select("*")
        .single();

      if ((error && error.code !== "PGRST116") || !data) {
        console.warn("No current match found:", error);
        return null;
      }

      const validated = await validateObject(data, currentMatchDataSchema, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (isYupValidationError(validated)) {
        throw new Error("Match data validation failed");
      }

      return validated;
    },
  });

  useEffect(() => {
    // subscribe to changes
    try {
      const subscription = supabase
        .channel("public:current_match")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "current_match" },
          (payload) => {
            query.refetch();
            console.log("Current match changed:", payload);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    } catch (error) {
      console.error("Error setting up subscription:", error);
      return;
    }
  }, [supabase, query]);

  return {
    match: query.data ?? null,
    loading: query.isLoading,
    isError: query.isError,
    error: query.error?.message ?? null,
    reload: () => query.refetch(),
  };
}
