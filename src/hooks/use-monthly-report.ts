"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";

export type MonthlyReportData = {
  // 일정
  totalSchedules: number;
  completedSchedules: number; // 이미 지난 일정
  // 출석
  avgAttendanceRate: number; // 해당 월 평균 출석률
  totalPresent: number;
  totalAbsent: number;
  // 재정
  totalIncome: number;
  totalExpense: number;
  balance: number;
  // 게시판
  totalPosts: number;
  totalComments: number;
  // 멤버
  newMembers: number; // 해당 월 가입
  totalMembers: number;
  // 프로젝트
  activeProjects: number;
  completedProjects: number; // 해당 월 완료
};

function getMonthRange(year: number, month: number): { start: string; end: string } {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const end = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
  return { start, end };
}

export function useMonthlyReport(groupId: string, year: number, month: number) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.monthlyReport(groupId, year, month) : null,
    async (): Promise<MonthlyReportData> => {
      const supabase = createClient();
      const { start, end } = getMonthRange(year, month);
      const now = new Date().toISOString();

      // 1. 일정, 출석, 재정, 게시판(글+댓글), 멤버(신규+전체), 프로젝트 병렬 조회
      const [
        schedulesRes,
        financeRes,
        postsRes,
        commentsRes,
        newMembersRes,
        totalMembersRes,
        activeProjectsRes,
        completedProjectsRes,
      ] = await Promise.all([
        // 해당 월 일정 목록 (출석 기록 집계를 위해 id와 starts_at 필요)
        supabase
          .from("schedules")
          .select("id, starts_at")
          .eq("group_id", groupId)
          .gte("starts_at", start)
          .lt("starts_at", end),

        // 해당 월 재정 거래 (transaction_date 기준)
        supabase
          .from("finance_transactions")
          .select("type, amount")
          .eq("group_id", groupId)
          .gte("transaction_date", start)
          .lt("transaction_date", end),

        // 해당 월 게시글 수
        supabase
          .from("board_posts")
          .select("id", { count: "exact", head: true })
          .eq("group_id", groupId)
          .gte("created_at", start)
          .lt("created_at", end),

        // 해당 월 댓글 수 (board_posts join으로 group_id 필터)
        supabase
          .from("board_comments")
          .select("id, board_posts!inner(group_id)", { count: "exact", head: true })
          .eq("board_posts.group_id", groupId)
          .gte("created_at", start)
          .lt("created_at", end),

        // 해당 월 신규 가입 멤버 수
        supabase
          .from("group_members")
          .select("id", { count: "exact", head: true })
          .eq("group_id", groupId)
          .gte("joined_at", start)
          .lt("joined_at", end),

        // 전체 멤버 수
        supabase
          .from("group_members")
          .select("id", { count: "exact", head: true })
          .eq("group_id", groupId),

        // 진행 중인 프로젝트 수
        supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .eq("group_id", groupId)
          .in("status", ["신규", "진행"]),

        // 해당 월 완료된 프로젝트 수 (updated_at이 해당 월이고 status=종료)
        supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .eq("group_id", groupId)
          .eq("status", "종료")
          .gte("updated_at", start)
          .lt("updated_at", end),
      ]);

      // 2. 일정 집계
      const scheduleRows = schedulesRes.data ?? [];
      const totalSchedules = scheduleRows.length;
      const completedSchedules = scheduleRows.filter(
        (s: { starts_at: string }) => s.starts_at < now
      ).length;

      // 3. 출석 집계 (해당 월 일정의 출석 기록)
      let totalPresent = 0;
      let totalAbsent = 0;
      let avgAttendanceRate = 0;

      if (scheduleRows.length > 0) {
        const scheduleIds = scheduleRows.map((s: { id: string }) => s.id);
        const { data: attendanceRows } = await supabase
          .from("attendance")
          .select("status")
          .in("schedule_id", scheduleIds);

        const records = attendanceRows ?? [];
        totalPresent = records.filter(
          (a: { status: string }) => a.status === "present" || a.status === "late"
        ).length;
        totalAbsent = records.filter(
          (a: { status: string }) => a.status === "absent"
        ).length;
        const totalRecords = totalPresent + totalAbsent;
        avgAttendanceRate =
          totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;
      }

      // 4. 재정 집계
      const financeRows = financeRes.data ?? [];
      const totalIncome = financeRows
        .filter((t: { type: string }) => t.type === "income")
        .reduce((sum: number, t: { amount: number }) => sum + t.amount, 0);
      const totalExpense = financeRows
        .filter((t: { type: string }) => t.type === "expense")
        .reduce((sum: number, t: { amount: number }) => sum + t.amount, 0);
      const balance = totalIncome - totalExpense;

      return {
        totalSchedules,
        completedSchedules,
        avgAttendanceRate,
        totalPresent,
        totalAbsent,
        totalIncome,
        totalExpense,
        balance,
        totalPosts: postsRes.count ?? 0,
        totalComments: commentsRes.count ?? 0,
        newMembers: newMembersRes.count ?? 0,
        totalMembers: totalMembersRes.count ?? 0,
        activeProjects: activeProjectsRes.count ?? 0,
        completedProjects: completedProjectsRes.count ?? 0,
      };
    }
  );

  return {
    report: data ?? null,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
