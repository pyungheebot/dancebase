"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { FinanceBudget } from "@/types";

export function useFinanceBudget(
  entityType: "group" | "project",
  entityId: string,
  yearMonth: string
) {
  const fetcher = async (): Promise<FinanceBudget | null> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("finance_budgets")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .eq("year_month", yearMonth)
      .maybeSingle();

    if (error) {
      throw error;
    }
    return data as FinanceBudget | null;
  };

  const { data, isLoading, mutate } = useSWR(
    swrKeys.financeBudget(entityType, entityId, yearMonth),
    fetcher
  );

  return {
    budget: data ?? null,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
