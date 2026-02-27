"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { startOfMonth, endOfMonth, subDays } from "date-fns";

export type DashboardQuickStats = {
  totalSchedules: number;
  avgAttendanceRate: number;
  unpaidMemberCount: number;
  monthlyIncome: number;
};

export function useDashboardQuickStats(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.dashboardQuickStats(groupId),
    async (): Promise<DashboardQuickStats> => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return {
          totalSchedules: 0,
          avgAttendanceRate: 0,
          unpaidMemberCount: 0,
          monthlyIncome: 0,
        };
      }

      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30).toISOString();
      const monthStart = startOfMonth(now).toISOString();
      const monthEnd = endOfMonth(now).toISOString();

      // 병렬 조회: 최근 30일 일정 + 그룹 멤버 수 + 이번 달 회비 거래
      const [schedulesRes, membersRes, transactionsRes] = await Promise.all([
        supabase
          .from("schedules")
          .select("id")
          .eq("group_id", groupId)
          .neq("attendance_method", "none")
          .gte("starts_at", thirtyDaysAgo)
          .lte("starts_at", now.toISOString()),
        supabase
          .from("group_members")
          .select("user_id")
          .eq("group_id", groupId),
        supabase
          .from("finance_transactions")
          .select("id, type, amount, status")
          .eq("group_id", groupId)
          .gte("transaction_date", monthStart.slice(0, 10))
          .lte("transaction_date", monthEnd.slice(0, 10)),
      ]);

      const schedules = schedulesRes.data ?? [];
      const totalSchedules = schedules.length;
      const members = membersRes.data ?? [];
      const memberCount = members.length;
      const transactions = transactionsRes.data ?? [];

      // 평균 출석률 계산
      let avgAttendanceRate = 0;
      if (totalSchedules > 0 && memberCount > 0) {
        const scheduleIds = schedules.map((s: { id: string }) => s.id);
        const { data: attendanceData } = await supabase
          .from("attendance")
          .select("user_id, status")
          .in("schedule_id", scheduleIds)
          .in("status", ["present", "late"]);

        const presentCount = (attendanceData ?? []).length;
        const possibleCount = totalSchedules * memberCount;
        avgAttendanceRate =
          possibleCount > 0
            ? Math.round((presentCount / possibleCount) * 100)
            : 0;
      }

      // 이번 달 미납 건 수 (status가 'unpaid'인 income 거래)
      const unpaidMemberCount = transactions.filter(
        (t: { id: string; type: string; amount: number; status: string }) =>
          t.type === "income" && t.status === "unpaid"
      ).length;

      // 이번 달 총 수입
      const monthlyIncome = transactions
        .filter(
          (t: { id: string; type: string; amount: number; status: string }) =>
            t.type === "income" && t.status === "paid"
        )
        .reduce(
          (
            sum: number,
            t: { id: string; type: string; amount: number; status: string }
          ) => sum + t.amount,
          0
        );

      return {
        totalSchedules,
        avgAttendanceRate,
        unpaidMemberCount,
        monthlyIncome,
      };
    }
  );

  return {
    stats: data ?? null,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
