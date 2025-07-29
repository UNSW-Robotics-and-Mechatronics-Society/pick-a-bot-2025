"use client";

import { TOKEN_TRANSACTION_TIMEOUT } from "@/constants";
import { isYupValidationError, validateObject } from "@/lib";
import { createClient } from "@/lib/supabase/client";
import { currentMatchDataSchema } from "@/schemas";
import { PreviousMatchResult } from "@/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

export const useCurrentMatch = () => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [previousMatchResult, setPreviousMatchResult] =
    useState<PreviousMatchResult | null>(null);

  const query = useQuery({
    queryKey: ["current_match"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("current_match")
        .select()
        .single();

      if ((error && error.code !== "PGRST116") || !data) {
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

  const onCurrentMatchDelete = useCallback(async () => {
    queryClient.setQueryData(["current_match"], null);
    await new Promise((resolve) =>
      setTimeout(resolve, TOKEN_TRANSACTION_TIMEOUT)
    );

    // fetch previous match data if available
    if (previousMatchResult?.matchId) {
      const { data: previousTransaction, error: previousMatchError } =
        await supabase
          .from("token_transaction")
          .select()
          .eq("match_id", previousMatchResult.matchId)
          .single();
      if (previousMatchError || !previousTransaction) {
        if (previousMatchError.code !== "PGRST116") {
          console.warn(
            "Failed to fetch previous match data",
            previousMatchError
          );
        }
        return;
      }
      if (previousTransaction.winner) {
        setPreviousMatchResult({
          matchId: previousTransaction.match_id,
          winner: previousTransaction.winner,
          tokenUsed: previousTransaction.amount || 0,
          tokenDelta: previousTransaction.balance_delta || 0,
          botChosen: previousTransaction.bot_chosen || null,
          newTokenBalance: previousTransaction.balance_after || 0,
        });
      } else {
        setPreviousMatchResult((prev) =>
          prev
            ? {
                matchId: prev.matchId,
                winner: null,
                tokenUsed: prev.tokenUsed,
                tokenDelta: prev.tokenDelta,
                botChosen: prev.botChosen,
                newTokenBalance: prev.newTokenBalance,
              }
            : null
        );
      }
    }
  }, [queryClient, previousMatchResult, supabase]);

  useEffect(() => {
    const subscription = supabase
      .channel("public:current_match")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "current_match" },
        (payload) => {
          if (payload.eventType === "DELETE" || !payload.new) {
            onCurrentMatchDelete();
            return;
          }
          validateObject(payload.new, currentMatchDataSchema, {
            abortEarly: false,
            stripUnknown: true,
          }).then((validated) => {
            if (!isYupValidationError(validated)) {
              queryClient.setQueryData(["current_match"], validated);
              const matchId = validated.match_id;
              if (matchId !== previousMatchResult?.matchId) {
                setPreviousMatchResult({
                  matchId,
                  winner: null,
                  tokenUsed: 0,
                  tokenDelta: 0,
                  botChosen: null,
                  newTokenBalance: 0,
                });
              }
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
  }, [
    supabase,
    queryClient,
    onCurrentMatchDelete,
    previousMatchResult?.matchId,
  ]);

  return {
    match: query.data ?? null,
    isLoading:
      query.isLoading ||
      query.isRefetching ||
      query.isFetching ||
      query.isPending,
    isError: query.isError,
    error: query.error?.message ?? null,
    refetch: query.refetch,
    lastFetchedAt: query.dataUpdatedAt,
    previousMatchResult,
  };
};
