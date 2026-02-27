"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";

export type MonthlyPracticeStat = {
  month: string;       // "2026-01", "2026-02" 등 (YYYY-MM)
  label: string;       // "1월", "2월" 등 (표시용)
  scheduleCount: number;
  totalMinutes: number;
  avgAttendees: number;
};

export type PracticeStatsSummary = {
  totalSchedules: number;
  totalMinutes: number;
  avgAttendees: number;
};

export function usePracticeStats(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.practiceStats(groupId),
    async (): Promise<{ monthly: MonthlyPracticeStat[]; summary: PracticeStatsSummary }> => {
      const supabase = createClient();

      // 최근 6개월 범위 계산
      const now = new Date();
      const months: string[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        months.push(ym);
      }

      const fromDate = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString();
      const toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      // 1. schedules 조회 (연습 일정 — 모든 schedule_type 포함)
      const { data: scheduleRows, error: schedErr } = await supabase
        .from("schedules")
        .select("id, starts_at, ends_at")
        .eq("group_id", groupId)
        .gte("starts_at", fromDate)
        .lte("starts_at", toDate)
        .order("starts_at", { ascending: true });

      if (schedErr || !scheduleRows) {
        return {
          monthly: months.map((ym) => ({
            month: ym,
            label: `${parseInt(ym.split("-")[1])}월`,
            scheduleCount: 0,
            totalMinutes: 0,
            avgAttendees: 0,
          })),
          summary: { totalSchedules: 0, totalMinutes: 0, avgAttendees: 0 },
        };
      }

      const scheduleIds = scheduleRows.map((s: { id: string }) => s.id);

      // 2. attendances 조회 (status='present')
      let attendanceRows: { schedule_id: string }[] = [];
      if (scheduleIds.length > 0) {
        const { data: attData } = await supabase
          .from("attendance")
          .select("schedule_id")
          .in("schedule_id", scheduleIds)
          .eq("status", "present");
        attendanceRows = (attData ?? []) as { schedule_id: string }[];
      }

      // 3. 월별 집계
      const monthMap = new Map<
        string,
        { scheduleCount: number; totalMinutes: number; attendeeSum: number }
      >();
      for (const ym of months) {
        monthMap.set(ym, { scheduleCount: 0, totalMinutes: 0, attendeeSum: 0 });
      }

      // 일정 ID -> 참석자 수 매핑
      const attendeeCountMap = new Map<string, number>();
      for (const att of attendanceRows) {
        attendeeCountMap.set(
          att.schedule_id,
          (attendeeCountMap.get(att.schedule_id) ?? 0) + 1
        );
      }

      for (const sched of scheduleRows as { id: string; starts_at: string; ends_at: string }[]) {
        const d = new Date(sched.starts_at);
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!monthMap.has(ym)) continue;

        const entry = monthMap.get(ym)!;
        const startMs = new Date(sched.starts_at).getTime();
        const endMs = new Date(sched.ends_at).getTime();
        const minutes = Math.max(0, Math.round((endMs - startMs) / 60000));

        entry.scheduleCount += 1;
        entry.totalMinutes += minutes;
        entry.attendeeSum += attendeeCountMap.get(sched.id) ?? 0;
      }

      const monthly: MonthlyPracticeStat[] = months.map((ym) => {
        const entry = monthMap.get(ym)!;
        const monthNum = parseInt(ym.split("-")[1]);
        return {
          month: ym,
          label: `${monthNum}월`,
          scheduleCount: entry.scheduleCount,
          totalMinutes: entry.totalMinutes,
          avgAttendees:
            entry.scheduleCount > 0
              ? Math.round(entry.attendeeSum / entry.scheduleCount)
              : 0,
        };
      });

      // 4. 전체 요약
      const totalSchedules = monthly.reduce((s, m) => s + m.scheduleCount, 0);
      const totalMinutes = monthly.reduce((s, m) => s + m.totalMinutes, 0);
      const avgAttendees =
        totalSchedules > 0
          ? Math.round(
              monthly.reduce((s, m) => s + m.avgAttendees * m.scheduleCount, 0) /
                totalSchedules
            )
          : 0;

      return {
        monthly,
        summary: { totalSchedules, totalMinutes, avgAttendees },
      };
    }
  );

  return {
    monthly: data?.monthly ?? [],
    summary: data?.summary ?? { totalSchedules: 0, totalMinutes: 0, avgAttendees: 0 },
    loading: isLoading,
    refetch: () => mutate(),
  };
}
