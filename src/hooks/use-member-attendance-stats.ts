"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { MemberAttendanceStatsResult } from "@/types";
import { parseISO, isValid, startOfWeek, subWeeks } from "date-fns";
import { formatKo } from "@/lib/date-utils";

export function useMemberAttendanceStats(groupId: string, userId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId && userId ? swrKeys.memberAttendanceStats(groupId, userId) : null,
    async (): Promise<MemberAttendanceStatsResult> => {
      const supabase = createClient();

      // 1. 해당 그룹의 출석 체크 대상 일정 전체 조회
      const { data: scheduleRows, error: schedErr } = await supabase
        .from("schedules")
        .select("id, starts_at")
        .eq("group_id", groupId)
        .neq("attendance_method", "none")
        .order("starts_at", { ascending: true });

      if (schedErr) throw schedErr;

      const schedules = scheduleRows ?? [];
      const scheduleIds = schedules.map((s: { id: string }) => s.id);

      if (scheduleIds.length === 0) {
        return {
          overallRate: 0,
          presentCount: 0,
          absentCount: 0,
          lateCount: 0,
          totalSchedules: 0,
          weeklyRates: [],
          currentStreak: 0,
          longestStreak: 0,
          bestDayOfWeek: null,
          groupAverageRate: 0,
        };
      }

      // 2. 해당 유저의 출석 기록
      const { data: attRows, error: attErr } = await supabase
        .from("attendance")
        .select("schedule_id, status")
        .eq("user_id", userId)
        .in("schedule_id", scheduleIds);

      if (attErr) throw attErr;

      // schedule_id → status 맵
      const statusMap = new Map<string, string>();
      for (const row of attRows ?? []) {
        statusMap.set(row.schedule_id, row.status);
      }

      // 3. 전체 출석 통계
      let presentCount = 0;
      let absentCount = 0;
      let lateCount = 0;

      for (const s of schedules) {
        const status = statusMap.get(s.id);
        if (status === "present") presentCount++;
        else if (status === "late") lateCount++;
        else absentCount++;
      }

      const totalSchedules = schedules.length;
      const overallRate =
        totalSchedules > 0
          ? Math.round(((presentCount + lateCount) / totalSchedules) * 100)
          : 0;

      // 4. 최근 12주 주간 출석률
      const now = new Date();
      const weeklyRates: { week: string; rate: number }[] = [];

      for (let i = 11; i >= 0; i--) {
        const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const weekSchedules = schedules.filter((s: { id: string; starts_at: string }) => {
          const d = parseISO(s.starts_at);
          return isValid(d) && d >= weekStart && d < weekEnd;
        });

        const weekTotal = weekSchedules.length;
        const weekPresent = weekSchedules.filter(
          (s: { id: string; starts_at: string }) =>
            statusMap.get(s.id) === "present" || statusMap.get(s.id) === "late"
        ).length;

        weeklyRates.push({
          week: formatKo(weekStart, "M/d"),
          rate: weekTotal > 0 ? Math.round((weekPresent / weekTotal) * 100) : 0,
        });
      }

      // 5. 연속 출석 스트릭
      const orderedPresent = schedules.map((s: { id: string; starts_at: string }) => {
        const status = statusMap.get(s.id);
        return status === "present" || status === "late";
      });

      // 현재 스트릭 (역순으로 연속 출석)
      let currentStreak = 0;
      for (let i = orderedPresent.length - 1; i >= 0; i--) {
        if (orderedPresent[i]) {
          currentStreak++;
        } else {
          break;
        }
      }

      // 최장 스트릭
      let longestStreak = 0;
      let tempStreak = 0;
      for (const isPresent of orderedPresent) {
        if (isPresent) {
          tempStreak++;
          if (tempStreak > longestStreak) longestStreak = tempStreak;
        } else {
          tempStreak = 0;
        }
      }

      // 6. 선호 요일 (가장 출석률 높은 요일)
      // 요일별 [출석수, 전체수] 집계
      const dayStats: [number, number][] = Array.from({ length: 7 }, () => [0, 0]);

      for (const s of schedules) {
        const d = parseISO(s.starts_at);
        if (!isValid(d)) continue;
        const dow = d.getDay(); // 0=일, 1=월 ... 6=토
        dayStats[dow][1]++;
        const status = statusMap.get(s.id);
        if (status === "present" || status === "late") {
          dayStats[dow][0]++;
        }
      }

      let bestDayOfWeek: number | null = null;
      let bestDayRate = -1;

      for (let dow = 0; dow < 7; dow++) {
        const [p, t] = dayStats[dow];
        if (t === 0) continue;
        const rate = p / t;
        if (rate > bestDayRate) {
          bestDayRate = rate;
          bestDayOfWeek = dow;
        }
      }

      // 7. 그룹 평균 출석률
      // 해당 그룹의 모든 그룹 멤버 출석 기록을 집계
      const { data: allAttRows, error: allAttErr } = await supabase
        .from("attendance")
        .select("user_id, status")
        .in("schedule_id", scheduleIds);

      if (allAttErr) throw allAttErr;

      // 유저별 출석 횟수 집계
      const userPresent = new Map<string, number>();
      const userTotal = new Map<string, number>();

      for (const row of allAttRows ?? []) {
        const uid = row.user_id as string;
        userTotal.set(uid, (userTotal.get(uid) ?? 0) + 1);
        if (row.status === "present" || row.status === "late") {
          userPresent.set(uid, (userPresent.get(uid) ?? 0) + 1);
        }
      }

      let groupAverageRate = 0;
      if (userTotal.size > 0) {
        let sumRates = 0;
        for (const [uid, total] of userTotal.entries()) {
          const present = userPresent.get(uid) ?? 0;
          sumRates += (present / total) * 100;
        }
        groupAverageRate = Math.round(sumRates / userTotal.size);
      }

      return {
        overallRate,
        presentCount,
        absentCount,
        lateCount,
        totalSchedules,
        weeklyRates,
        currentStreak,
        longestStreak,
        bestDayOfWeek,
        groupAverageRate,
      };
    }
  );

  return {
    stats: data ?? null,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
