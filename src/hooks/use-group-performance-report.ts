"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { GroupPerformanceReport, ReportMetricItem } from "@/types";

function calcMetric(current: number, previous: number): ReportMetricItem {
  const changeRate = previous > 0 ? Math.round(((current - previous) / previous) * 100) : current > 0 ? 100 : 0;
  return { current, previous, changeRate };
}

export function useGroupPerformanceReport(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.groupPerformanceReport(groupId) : null,
    async (): Promise<GroupPerformanceReport> => {
      const supabase = createClient();
      const now = new Date();
      const days30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const days60Ago = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

      // 병렬 조회: 현재 30일 + 이전 30일
      const [
        curSchedules, prevSchedules,
        curAttendance, prevAttendance,
        curPosts, prevPosts,
        curComments, prevComments,
        curMembers, prevNewMembers, curNewMembers,
        curIncome, prevIncome,
        curExpense, prevExpense,
      ] = await Promise.all([
        // 일정
        supabase.from("schedules").select("id", { count: "exact", head: true }).eq("group_id", groupId).gte("starts_at", days30Ago),
        supabase.from("schedules").select("id", { count: "exact", head: true }).eq("group_id", groupId).gte("starts_at", days60Ago).lt("starts_at", days30Ago),
        // 출석
        supabase.from("attendance").select("id, status, schedules!inner(group_id)").eq("schedules.group_id", groupId).gte("created_at", days30Ago),
        supabase.from("attendance").select("id, status, schedules!inner(group_id)").eq("schedules.group_id", groupId).gte("created_at", days60Ago).lt("created_at", days30Ago),
        // 게시글
        supabase.from("board_posts").select("id", { count: "exact", head: true }).eq("group_id", groupId).gte("created_at", days30Ago),
        supabase.from("board_posts").select("id", { count: "exact", head: true }).eq("group_id", groupId).gte("created_at", days60Ago).lt("created_at", days30Ago),
        // 댓글
        supabase.from("board_comments").select("id, board_posts!inner(group_id)", { count: "exact", head: true }).eq("board_posts.group_id", groupId).gte("created_at", days30Ago),
        supabase.from("board_comments").select("id, board_posts!inner(group_id)", { count: "exact", head: true }).eq("board_posts.group_id", groupId).gte("created_at", days60Ago).lt("created_at", days30Ago),
        // 멤버
        supabase.from("group_members").select("id", { count: "exact", head: true }).eq("group_id", groupId),
        supabase.from("group_members").select("id", { count: "exact", head: true }).eq("group_id", groupId).gte("joined_at", days60Ago).lt("joined_at", days30Ago),
        supabase.from("group_members").select("id", { count: "exact", head: true }).eq("group_id", groupId).gte("joined_at", days30Ago),
        // 수입
        supabase.from("finance_transactions").select("amount").eq("group_id", groupId).eq("type", "income").gte("transaction_date", days30Ago),
        supabase.from("finance_transactions").select("amount").eq("group_id", groupId).eq("type", "income").gte("transaction_date", days60Ago).lt("transaction_date", days30Ago),
        // 지출
        supabase.from("finance_transactions").select("amount").eq("group_id", groupId).eq("type", "expense").gte("transaction_date", days30Ago),
        supabase.from("finance_transactions").select("amount").eq("group_id", groupId).eq("type", "expense").gte("transaction_date", days60Ago).lt("transaction_date", days30Ago),
      ]);

      // 출석률 계산
      const curAttData = curAttendance.data ?? [];
      const prevAttData = prevAttendance.data ?? [];
      const curAttendCount = curAttData.filter((a: { status: string }) => a.status === "present" || a.status === "late").length;
      const curAttendTotal = curAttData.length;
      const prevAttendCount = prevAttData.filter((a: { status: string }) => a.status === "present" || a.status === "late").length;
      const prevAttendTotal = prevAttData.length;
      const curRate = curAttendTotal > 0 ? Math.round((curAttendCount / curAttendTotal) * 100) : 0;
      const prevRate = prevAttendTotal > 0 ? Math.round((prevAttendCount / prevAttendTotal) * 100) : 0;

      // 금액 합산
      const sumAmount = (rows: { amount: number }[] | null) => (rows ?? []).reduce((s, r) => s + r.amount, 0);
      const curIncomeTotal = sumAmount(curIncome.data as { amount: number }[] | null);
      const prevIncomeTotal = sumAmount(prevIncome.data as { amount: number }[] | null);
      const curExpenseTotal = sumAmount(curExpense.data as { amount: number }[] | null);
      const prevExpenseTotal = sumAmount(prevExpense.data as { amount: number }[] | null);

      return {
        period: "최근 30일",
        attendanceRate: calcMetric(curRate, prevRate),
        attendanceCount: calcMetric(curAttendTotal, prevAttendTotal),
        postCount: calcMetric(curPosts.count ?? 0, prevPosts.count ?? 0),
        commentCount: calcMetric(curComments.count ?? 0, prevComments.count ?? 0),
        memberCount: calcMetric(curMembers.count ?? 0, (curMembers.count ?? 0) - (curNewMembers.count ?? 0) + (prevNewMembers.count ?? 0)),
        newMemberCount: calcMetric(curNewMembers.count ?? 0, prevNewMembers.count ?? 0),
        scheduleCount: calcMetric(curSchedules.count ?? 0, prevSchedules.count ?? 0),
        totalIncome: calcMetric(curIncomeTotal, prevIncomeTotal),
        totalExpense: calcMetric(curExpenseTotal, prevExpenseTotal),
        netIncome: calcMetric(curIncomeTotal - curExpenseTotal, prevIncomeTotal - prevExpenseTotal),
      };
    },
    { revalidateOnFocus: false }
  );

  return {
    report: data ?? null,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
