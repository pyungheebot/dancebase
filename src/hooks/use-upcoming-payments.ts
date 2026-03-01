"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";

export type UpcomingPayment = {
  id: string;
  title: string;
  amount: number;
  transaction_date: string;
  group_id: string;
  group_name: string;
  project_id: string | null;
  project_name: string | null;
  paid_by: string | null;
  is_paid: boolean;
};

export function useUpcomingPayments() {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.upcomingPayments(),
    async (): Promise<UpcomingPayment[]> => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      // 이번 달 시작/끝 계산
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .slice(0, 10);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .slice(0, 10);

      // 사용자가 속한 그룹 목록 조회
      const { data: memberGroups, error: memberError } = await supabase
        .from("group_members")
        .select("group_id, groups(id, name)")
        .eq("user_id", user.id);

      if (memberError || !memberGroups || memberGroups.length === 0) return [];

      type MemberGroupRow = {
        group_id: string;
        groups: { id: string; name: string } | null;
      };

      const typedMemberGroups = memberGroups as MemberGroupRow[];
      const groupIds = typedMemberGroups.map((m) => m.group_id);
      const groupNameMap: Record<string, string> = {};
      for (const m of typedMemberGroups) {
        const g = m.groups;
        if (g) groupNameMap[g.id] = g.name;
      }

      // 이번 달 수입(income) 거래 내역 조회
      // income 항목은 회비 납부를 의미하며, paid_by가 null이면 미납 상태
      const { data: transactions, error: txError } = await supabase
        .from("finance_transactions")
        .select(
          "id, title, amount, transaction_date, group_id, project_id, paid_by, projects(id, name)"
        )
        .in("group_id", groupIds)
        .eq("type", "income")
        .gte("transaction_date", startOfMonth)
        .lte("transaction_date", endOfMonth)
        .order("transaction_date", { ascending: true });

      if (txError || !transactions) return [];

      type TxRow = {
        id: string;
        title: string;
        amount: number;
        transaction_date: string;
        group_id: string;
        project_id: string | null;
        paid_by: string | null;
        projects: { id: string; name: string } | null;
      };

      const results: UpcomingPayment[] = (transactions as TxRow[]).map((tx) => {
        return {
          id: tx.id,
          title: tx.title,
          amount: tx.amount,
          transaction_date: tx.transaction_date,
          group_id: tx.group_id,
          group_name: groupNameMap[tx.group_id] ?? "",
          project_id: tx.project_id ?? null,
          project_name: tx.projects?.name ?? null,
          paid_by: tx.paid_by ?? null,
          is_paid: tx.paid_by !== null,
        };
      });

      return results;
    }
  );

  const payments = data ?? [];
  const unpaidPayments = payments.filter((p) => !p.is_paid);
  const paidPayments = payments.filter((p) => p.is_paid);

  return {
    payments,
    unpaidPayments,
    paidPayments,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
