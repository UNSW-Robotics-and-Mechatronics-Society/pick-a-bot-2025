"use client";

import { isYupValidationError, validateObject } from "@/lib";
import { createClient } from "@/lib/supabase/client";
import { currentMatchDataSchema } from "@/schemas";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export const useCurrentMatch = () => {
  const supabase = createClient();
  const queryClient = useQueryClient();

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
    const subscription = supabase
      .channel("public:current_match")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "current_match" },
        (payload) => {
          validateObject(payload.new, currentMatchDataSchema, {
            abortEarly: false,
            stripUnknown: true,
          }).then((validated) => {
            if (!isYupValidationError(validated)) {
              queryClient.setQueryData(["current_match"], validated);
            } else {
              console.warn("Subscription match data validation failed");
              queryClient.setQueryData(["current_match"], null);
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [supabase, queryClient]);

  return {
    match: query.data ?? null,
    loading:
      query.isLoading ||
      query.isRefetching ||
      query.isFetching ||
      query.isPending,
    isError: query.isError,
    error: query.error?.message ?? null,
    refetch: query.refetch,
    lastFetchedAt: query.dataUpdatedAt,
  };
};
