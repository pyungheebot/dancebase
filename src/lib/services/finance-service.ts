import { createClient } from "@/lib/supabase/client";
import type { FinanceBudget } from "@/types";

// ============================================
// 회비/예산 서비스
// ============================================

/**
 * 월별 예산 upsert (신규 생성 또는 기존 수정)
 */
export async function upsertFinanceBudget(data: {
  entityType: "group" | "project";
  entityId: string;
  yearMonth: string;
  budgetIncome: number;
  budgetExpense: number;
  createdBy: string;
}): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("finance_budgets").upsert(
    {
      entity_type: data.entityType,
      entity_id: data.entityId,
      year_month: data.yearMonth,
      budget_income: data.budgetIncome,
      budget_expense: data.budgetExpense,
      created_by: data.createdBy,
    },
    { onConflict: "entity_type,entity_id,year_month" }
  );
  if (error) throw error;
}

/**
 * 월별 예산 삭제
 */
export async function deleteFinanceBudget(budgetId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("finance_budgets")
    .delete()
    .eq("id", budgetId);
  if (error) throw error;
}

/**
 * 특정 월 예산 조회
 */
export async function getFinanceBudget(
  entityType: "group" | "project",
  entityId: string,
  yearMonth: string
): Promise<FinanceBudget | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("finance_budgets")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .eq("year_month", yearMonth)
    .maybeSingle();
  if (error) throw error;
  return data as FinanceBudget | null;
}
