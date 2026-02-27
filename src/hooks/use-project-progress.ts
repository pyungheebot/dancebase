"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";

// ============================================
// 지표별 진행률 타입
// ============================================

export type ProgressMetric = {
  /** 완료 수 */
  done: number;
  /** 전체 수 */
  total: number;
  /** 0~100 퍼센트, 데이터 없으면 null */
  rate: number | null;
};

export type ProjectProgressData = {
  /** 태스크 진행률 (done/total) */
  tasks: ProgressMetric;
  /** 곡 진행률 (mastered/total) */
  songs: ProgressMetric;
  /** 출석률 (present+late / 전체 슬롯) */
  attendance: ProgressMetric;
  /** 예산 소진율 (expense / income+expense) */
  budget: ProgressMetric;
  /** 종합 진행률 (유효 지표 평균) */
  overall: number | null;
};

// ============================================
// 훅
// ============================================

export function useProjectProgress(projectId: string, groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    projectId ? swrKeys.projectProgress(projectId) : null,
    async (): Promise<ProjectProgressData> => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return buildEmpty();
      }

      // 4가지 데이터 병렬 조회
      const [tasksRes, songsRes, schedulesRes, financeRes] = await Promise.all([
        // 태스크
        supabase
          .from("project_tasks")
          .select("status")
          .eq("project_id", projectId),
        // 곡
        supabase
          .from("project_songs")
          .select("status")
          .eq("project_id", projectId),
        // 출석 산정을 위한 일정 (출석 방법이 none이 아닌 것)
        supabase
          .from("schedules")
          .select("id")
          .eq("group_id", groupId)
          .eq("project_id", projectId)
          .neq("attendance_method", "none"),
        // 회비 거래내역
        supabase
          .from("finance_transactions")
          .select("type, amount")
          .eq("group_id", groupId)
          .eq("project_id", projectId),
      ]);

      // ── 태스크 진행률 ──
      const taskRows = (tasksRes.data ?? []) as { status: string }[];
      const taskTotal = taskRows.length;
      const taskDone = taskRows.filter((r) => r.status === "done").length;
      const tasks: ProgressMetric = {
        done: taskDone,
        total: taskTotal,
        rate: taskTotal > 0 ? Math.round((taskDone / taskTotal) * 100) : null,
      };

      // ── 곡 진행률 ──
      const songRows = (songsRes.data ?? []) as { status: string }[];
      const songTotal = songRows.length;
      const songDone = songRows.filter((r) => r.status === "mastered").length;
      const songs: ProgressMetric = {
        done: songDone,
        total: songTotal,
        rate: songTotal > 0 ? Math.round((songDone / songTotal) * 100) : null,
      };

      // ── 출석률 ──
      const scheduleRows = (schedulesRes.data ?? []) as { id: string }[];
      const scheduleIds = scheduleRows.map((s) => s.id);

      let attendance: ProgressMetric = { done: 0, total: 0, rate: null };
      if (scheduleIds.length > 0) {
        const { data: attRows } = await supabase
          .from("attendance")
          .select("status, user_id, schedule_id")
          .in("schedule_id", scheduleIds);

        // 프로젝트 멤버 수 조회 (출석 슬롯 기준)
        const { data: memberRows } = await supabase
          .from("project_members")
          .select("user_id")
          .eq("project_id", projectId);

        const memberCount = memberRows?.length ?? 0;
        const totalSlots = scheduleIds.length * memberCount;
        const attRowsTyped = (attRows ?? []) as { status: string; user_id: string; schedule_id: string }[];
        const presentCount = attRowsTyped.filter(
          (r) => r.status === "present" || r.status === "late"
        ).length;

        attendance = {
          done: presentCount,
          total: totalSlots,
          rate: totalSlots > 0 ? Math.round((presentCount / totalSlots) * 100) : null,
        };
      }

      // ── 예산 소진율 ──
      const financeRows = (financeRes.data ?? []) as { type: string; amount: number }[];
      const totalIncome = financeRows
        .filter((r) => r.type === "income")
        .reduce((sum, r) => sum + (r.amount ?? 0), 0);
      const totalExpense = financeRows
        .filter((r) => r.type === "expense")
        .reduce((sum, r) => sum + (r.amount ?? 0), 0);
      const budgetTotal = totalIncome + totalExpense;
      const budget: ProgressMetric = {
        done: totalExpense,
        total: budgetTotal,
        rate: budgetTotal > 0 ? Math.round((totalExpense / budgetTotal) * 100) : null,
      };

      // ── 종합 진행률 (유효한 지표들의 평균) ──
      const rates = [tasks.rate, songs.rate, attendance.rate, budget.rate].filter(
        (r): r is number => r !== null
      );
      const overall = rates.length > 0
        ? Math.round(rates.reduce((sum, r) => sum + r, 0) / rates.length)
        : null;

      return { tasks, songs, attendance, budget, overall };
    }
  );

  return {
    progress: data ?? buildEmpty(),
    loading: isLoading,
    refetch: () => mutate(),
  };
}

function buildEmpty(): ProjectProgressData {
  const empty: ProgressMetric = { done: 0, total: 0, rate: null };
  return { tasks: empty, songs: empty, attendance: empty, budget: empty, overall: null };
}
