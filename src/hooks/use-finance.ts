"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { frequentConfig } from "@/lib/swr/cache-config";
import { useIndependentEntityIds } from "@/hooks/use-independent-entities";
import { useGroupContext } from "@/hooks/use-group-context";
import type {
  FinanceCategory,
  FinanceTransactionWithDetails,
  FinanceRole,
} from "@/types";

interface FinanceData {
  transactions: FinanceTransactionWithDetails[];
  categories: FinanceCategory[];
  financeRole: FinanceRole;
}

export function useFinance(groupId: string, projectId?: string | null) {
  // 그룹 뷰일 때만 독립 엔티티 ID 조회 (SWR 캐시 공유로 중복 RPC 방지)
  const { data: independentEntities } = useIndependentEntityIds(
    !projectId ? groupId : undefined,
  );

  // 역할 + 권한을 한 번의 RPC로 조회 (group_members + entity_permissions 통합)
  const { role, hasPermission, loading: contextLoading } = useGroupContext(groupId);

  const { data, isLoading, mutate } = useSWR(
    // 그룹 뷰: independentEntities + context 로드 완료 후 실행 / 프로젝트 뷰: context 로드 완료 후 실행
    projectId !== undefined
      ? !contextLoading ? swrKeys.finance(groupId, projectId) : null
      : independentEntities !== undefined && !contextLoading
        ? swrKeys.finance(groupId, projectId)
        : null,
    async (): Promise<FinanceData> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { transactions: [], categories: [], financeRole: null };
      }

      // useGroupContext에서 이미 역할 + 권한 조회 완료 (RPC 재호출 없음)
      let financeRole: FinanceRole = null;
      if (role === "leader" || hasPermission("finance_manage")) {
        financeRole = "manager";
      } else if (hasPermission("finance_view")) {
        financeRole = "viewer";
      }

      let categories: FinanceCategory[] = [];
      let transactions: FinanceTransactionWithDetails[] = [];

      if (projectId) {
        // 특정 프로젝트 회비 - 카테고리와 거래내역 병렬 조회
        const [catsRes, txnsRes] = await Promise.all([
          supabase
            .from("finance_categories")
            .select("id, group_id, project_id, name, sort_order, fee_rate, created_at")
            .eq("group_id", groupId)
            .eq("project_id", projectId)
            .order("sort_order")
            .order("name"),
          supabase
            .from("finance_transactions")
            .select("*, profiles!finance_transactions_created_by_fkey(id, name, avatar_url), paid_by_profile:profiles!finance_transactions_paid_by_fkey(id, name, avatar_url), finance_categories(id, name)")
            .eq("group_id", groupId)
            .eq("project_id", projectId)
            .order("transaction_date", { ascending: false })
            .order("created_at", { ascending: false }),
        ]);

        if (catsRes.data) categories = catsRes.data;
        if (txnsRes.data) transactions = txnsRes.data as FinanceTransactionWithDetails[];
      } else {
        // 그룹 회비: SWR 캐시에서 이미 로드된 독립 엔티티 활용
        const excludeProjectIds = (independentEntities || [])
          .filter((e) => e.feature === "finance")
          .map((e) => e.entity_id);

        // 카테고리 + 거래내역 병렬 조회
        let catQuery = supabase
          .from("finance_categories")
          .select("id, group_id, project_id, name, sort_order, fee_rate, created_at")
          .eq("group_id", groupId)
          .order("sort_order")
          .order("name");

        let txnQuery = supabase
          .from("finance_transactions")
          .select("*, profiles!finance_transactions_created_by_fkey(id, name, avatar_url), paid_by_profile:profiles!finance_transactions_paid_by_fkey(id, name, avatar_url), finance_categories(id, name), projects(id, name)")
          .eq("group_id", groupId)
          .order("transaction_date", { ascending: false })
          .order("created_at", { ascending: false });

        if (excludeProjectIds.length > 0) {
          catQuery = catQuery.not("project_id", "in", `(${excludeProjectIds.join(",")})`);
          txnQuery = txnQuery.not("project_id", "in", `(${excludeProjectIds.join(",")})`);
        }

        const [catsRes, txnsRes] = await Promise.all([catQuery, txnQuery]);

        if (catsRes.data) categories = catsRes.data;
        if (txnsRes.data) transactions = txnsRes.data as FinanceTransactionWithDetails[];
      }

      return { transactions, categories, financeRole };
    },
    frequentConfig,
  );

  const transactions = useMemo(() => data?.transactions ?? [], [data?.transactions]);
  const categories = useMemo(() => data?.categories ?? [], [data?.categories]);
  const financeRole = data?.financeRole ?? null;

  // 통계 계산
  const stats = useMemo(() => {
    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;

    // 카테고리별 통계
    const byCategory = categories.map((cat) => {
      const catTxns = transactions.filter((t) => t.category_id === cat.id);
      const income = catTxns
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = catTxns
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
      return { category: cat, income, expense };
    });

    // 카테고리 미지정
    const uncategorized = transactions.filter((t) => !t.category_id);
    if (uncategorized.length > 0) {
      byCategory.push({
        category: { id: "", group_id: groupId, project_id: null, name: "미분류", sort_order: 999, fee_rate: 0, created_at: "" },
        income: uncategorized
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + t.amount, 0),
        expense: uncategorized
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + t.amount, 0),
      });
    }

    return { totalIncome, totalExpense, balance, byCategory };
  }, [transactions, categories, groupId]);

  return {
    transactions,
    categories,
    financeRole,
    loading: isLoading,
    stats,
    refetch: () => mutate(),
  };
}
