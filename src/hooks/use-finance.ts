"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
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
  const fetcher = async (): Promise<FinanceData> => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { transactions: [], categories: [], financeRole: null };
    }

    // 멤버 역할 + entity_permissions 병렬 조회
    const [memberRes, permissionsRes] = await Promise.all([
      supabase
        .from("group_members")
        .select("role")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("entity_permissions")
        .select("permission")
        .eq("entity_type", "group")
        .eq("entity_id", groupId)
        .eq("user_id", user.id),
    ]);

    let financeRole: FinanceRole = null;
    const isLeader = memberRes.data?.role === "leader";
    const permissions = (permissionsRes.data ?? []).map((p: { permission: string }) => p.permission);
    if (isLeader) {
      financeRole = "manager";
    } else if (permissions.includes("finance_manage")) {
      financeRole = "manager";
    } else if (permissions.includes("finance_view")) {
      financeRole = "viewer";
    }

    let categories: FinanceCategory[] = [];
    let transactions: FinanceTransactionWithDetails[] = [];

    if (projectId) {
      // 특정 프로젝트 회비 - 카테고리와 거래내역 병렬 조회
      const [catsRes, txnsRes] = await Promise.all([
        supabase
          .from("finance_categories")
          .select("*")
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
      // 그룹 회비: 그룹 자체 + 통합 프로젝트/서브그룹의 회비 통합

      // 독립 엔티티 ID 목록 조회
      const { data: independentEntities } = await supabase.rpc(
        "get_independent_entity_ids",
        { p_group_id: groupId, p_feature: "finance" }
      );
      const excludeProjectIds = (independentEntities || []).map((e: { entity_id: string }) => e.entity_id);

      // 카테고리 + 거래내역 병렬 조회
      let catQuery = supabase
        .from("finance_categories")
        .select("*")
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
  };

  const { data, isLoading, mutate } = useSWR(
    swrKeys.finance(groupId, projectId),
    fetcher,
  );

  const transactions = data?.transactions ?? [];
  const categories = data?.categories ?? [];
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
