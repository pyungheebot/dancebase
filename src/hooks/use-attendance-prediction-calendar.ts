"use client";

import useSWR from "swr";
import {
  startOfMonth,
  endOfMonth,
  getDaysInMonth,
  parseISO,
  isValid,
  getDay,
  getHours,
  format,
} from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type {
  AttendancePredictionCalendarResult,
  PredictionCalendarDay,
} from "@/types";

// ============================================
// 시간대 분류 헬퍼 (0=오전, 1=오후, 2=저녁)
// ============================================

function getTimeSlot(hour: number): 0 | 1 | 2 {
  if (hour < 12) return 0; // 오전
  if (hour < 18) return 1; // 오후
  return 2; // 저녁
}

// ============================================
// 가중 평균 예측 (요일 70% + 시간대 30%)
// ============================================

function calcPredictedRate(
  dow: number,
  timeSlot: 0 | 1 | 2,
  dowRates: number[],
  timeSlotRates: number[]
): number {
  const dowRate = dowRates[dow] ?? 50;
  const tsRate = timeSlotRates[timeSlot] ?? 50;
  return Math.round(dowRate * 0.7 + tsRate * 0.3);
}

// ============================================
// 훅
// ============================================

export function useAttendancePredictionCalendar(
  groupId: string | null,
  userId: string | null,
  month: string // YYYY-MM
) {
  const { data, isLoading, mutate } = useSWR(
    groupId && userId && month
      ? swrKeys.attendancePredictionCalendar(groupId, userId, month)
      : null,
    async (): Promise<AttendancePredictionCalendarResult> => {
      if (!groupId || !userId || !month) {
        return {
          days: [],
          dayOfWeekRates: Array(7).fill(0),
          overallRate: 0,
          month,
        };
      }

      const supabase = createClient();

      // =============================================
      // 1. 과거 출석 기록 조회 (그룹 전체, 최근 12개월)
      // =============================================
      const historyStart = new Date();
      historyStart.setFullYear(historyStart.getFullYear() - 1);

      const { data: pastScheduleRows, error: pastSchedErr } = await supabase
        .from("schedules")
        .select("id, starts_at")
        .eq("group_id", groupId)
        .neq("attendance_method", "none")
        .gte("starts_at", historyStart.toISOString())
        .lt("starts_at", `${month}-31T23:59:59Z`)
        .order("starts_at", { ascending: true });

      if (pastSchedErr) throw pastSchedErr;

      const pastSchedules = pastScheduleRows ?? [];
      const pastScheduleIds = pastSchedules.map((s: { id: string }) => s.id);

      // 과거 출석 기록 (해당 멤버)
      type AttRow = { schedule_id: string; status: string };
      let pastAttRows: AttRow[] = [];
      if (pastScheduleIds.length > 0) {
        const { data: attData, error: attErr } = await supabase
          .from("attendance")
          .select("schedule_id, status")
          .eq("user_id", userId)
          .in("schedule_id", pastScheduleIds);
        if (attErr) throw attErr;
        pastAttRows = (attData ?? []) as AttRow[];
      }

      const pastAttMap = new Map<string, string>();
      for (const row of pastAttRows) {
        pastAttMap.set(row.schedule_id, row.status);
      }

      // =============================================
      // 2. 요일별 출석률 계산 (0=일 ~ 6=토)
      //    이번 달 이전 일정만 사용
      // =============================================
      const monthStart = startOfMonth(parseISO(`${month}-01`));

      type ScheduleRow = { id: string; starts_at: string };

      const dowTotals = Array(7).fill(0);
      const dowPresent = Array(7).fill(0);
      const tsTotal = [0, 0, 0]; // 오전/오후/저녁
      const tsPresent = [0, 0, 0];

      for (const sched of pastSchedules as ScheduleRow[]) {
        const d = parseISO(sched.starts_at);
        if (!isValid(d)) continue;
        // 이번 달 이전 일정만 패턴 분석에 사용
        if (d >= monthStart) continue;

        const dow = getDay(d); // 0=일, 6=토
        const ts = getTimeSlot(getHours(d));
        const status = pastAttMap.get(sched.id);
        const isPresent =
          status === "present" || status === "late";

        dowTotals[dow]++;
        if (isPresent) dowPresent[dow]++;
        tsTotal[ts]++;
        if (isPresent) tsPresent[ts]++;
      }

      const dayOfWeekRates = dowTotals.map((total, i) =>
        total > 0 ? Math.round((dowPresent[i] / total) * 100) : 50
      );

      const timeSlotRates = tsTotal.map((total, i) =>
        total > 0 ? Math.round((tsPresent[i] / total) * 100) : 50
      );

      // 전체 출석률
      const totalPastSchedules = pastSchedules.filter(
        (s: ScheduleRow) => parseISO(s.starts_at) < monthStart
      ).length;
      const totalPastPresent = pastAttRows.filter(
        (a) => a.status === "present" || a.status === "late"
      ).length;
      const overallRate =
        totalPastSchedules > 0
          ? Math.round((totalPastPresent / totalPastSchedules) * 100)
          : 0;

      // =============================================
      // 3. 이번 달 일정 조회
      // =============================================
      const monthEnd = endOfMonth(monthStart);

      const { data: monthScheduleRows, error: monthSchedErr } = await supabase
        .from("schedules")
        .select("id, title, starts_at")
        .eq("group_id", groupId)
        .neq("attendance_method", "none")
        .gte("starts_at", monthStart.toISOString())
        .lte("starts_at", monthEnd.toISOString())
        .order("starts_at", { ascending: true });

      if (monthSchedErr) throw monthSchedErr;

      const monthSchedules = (monthScheduleRows ?? []) as {
        id: string;
        title: string;
        starts_at: string;
      }[];
      const monthScheduleIds = monthSchedules.map((s) => s.id);

      // 이번 달 실제 출석 기록
      type MonthAttRow = { schedule_id: string; status: string };
      let monthAttRows: MonthAttRow[] = [];
      if (monthScheduleIds.length > 0) {
        const { data: mAttData, error: mAttErr } = await supabase
          .from("attendance")
          .select("schedule_id, status")
          .eq("user_id", userId)
          .in("schedule_id", monthScheduleIds);
        if (mAttErr) throw mAttErr;
        monthAttRows = (mAttData ?? []) as MonthAttRow[];
      }

      const monthAttMap = new Map<string, string>();
      for (const row of monthAttRows) {
        monthAttMap.set(row.schedule_id, row.status);
      }

      // 날짜(YYYY-MM-DD) → 이번 달 일정 매핑 (1개 날짜에 1개 일정만 표시)
      const dateScheduleMap = new Map<
        string,
        { id: string; title: string; starts_at: string }
      >();
      for (const sched of monthSchedules) {
        const d = parseISO(sched.starts_at);
        if (!isValid(d)) continue;
        const dateKey = format(d, "yyyy-MM-dd");
        // 같은 날 여러 일정이면 첫 번째만 표시
        if (!dateScheduleMap.has(dateKey)) {
          dateScheduleMap.set(dateKey, sched);
        }
      }

      // =============================================
      // 4. 달력 days 배열 생성
      // =============================================
      const daysInMonth = getDaysInMonth(monthStart);
      const today = format(new Date(), "yyyy-MM-dd");
      const days: PredictionCalendarDay[] = [];

      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${month}-${String(d).padStart(2, "0")}`;
        const sched = dateScheduleMap.get(dateStr) ?? null;

        let predictedRate: number | null = null;
        let actualStatus: PredictionCalendarDay["actualStatus"] = null;

        if (sched) {
          const schedDate = parseISO(sched.starts_at);
          const dow = getDay(schedDate);
          const ts = getTimeSlot(getHours(schedDate));

          const isPast = dateStr <= today;

          if (isPast) {
            // 과거: 실제 출석 결과
            const status = monthAttMap.get(sched.id);
            if (status === "present") actualStatus = "present";
            else if (status === "late") actualStatus = "late";
            else actualStatus = "absent";
          } else {
            // 미래: 예측 확률
            predictedRate = calcPredictedRate(dow, ts, dayOfWeekRates, timeSlotRates);
          }
        }

        days.push({
          date: dateStr,
          scheduleId: sched?.id ?? null,
          scheduleTitle: sched?.title ?? null,
          predictedRate,
          actualStatus,
        });
      }

      return {
        days,
        dayOfWeekRates,
        overallRate,
        month,
      };
    }
  );

  return {
    data: data ?? null,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
