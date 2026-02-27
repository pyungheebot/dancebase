"use client";

import useSWR from "swr";
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";
import { ko } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { toast } from "sonner";
import type { AttendanceStatus } from "@/types";

export type MemberMonthlyRate = {
  month: string;      // "2월" 형태 (표시용)
  yearMonth: string;  // "2025-02" 형태 (정렬용)
  rate: number;       // 0~100
  totalSchedules: number;
};

export type MemberComparisonData = {
  userId: string;
  name: string;
  monthlyRates: MemberMonthlyRate[];
  avgRate: number;
};

export function useAttendanceComparison(
  groupId: string,
  selectedUserIds: string[],
  memberMap: Record<string, string>,   // userId -> 표시 이름
  projectId?: string | null
) {
  const supabase = createClient();

  const key =
    selectedUserIds.length > 0
      ? swrKeys.attendanceComparison(groupId, selectedUserIds, projectId)
      : null;

  const { data, isLoading } = useSWR(key, async () => {
    // 1. 최근 6개월 범위
    const now = new Date();
    const from = startOfMonth(subMonths(now, 5)).toISOString();
    const to = endOfMonth(now).toISOString();

    // 2. 기간 내 schedules 조회
    let schedulesQuery = supabase
      .from("schedules")
      .select("id, starts_at")
      .eq("group_id", groupId)
      .neq("attendance_method", "none")
      .gte("starts_at", from)
      .lte("starts_at", to);

    if (projectId) {
      schedulesQuery = schedulesQuery.eq("project_id", projectId);
    }

    const { data: scheduleRows, error: schedErr } = await schedulesQuery;
    if (schedErr) {
      toast.error("일정 데이터를 불러오지 못했습니다");
      return [];
    }

    const schedules = (scheduleRows ?? []) as { id: string; starts_at: string }[];
    const scheduleIds = schedules.map((s) => s.id);

    // schedule_id -> yearMonth 매핑
    const scheduleYearMonthMap = new Map<string, string>();
    for (const s of schedules) {
      scheduleYearMonthMap.set(s.id, format(new Date(s.starts_at), "yyyy-MM"));
    }

    // 월별 총 일정 수 집계
    const monthlyScheduleCount = new Map<string, number>();
    for (const s of schedules) {
      const ym = format(new Date(s.starts_at), "yyyy-MM");
      monthlyScheduleCount.set(ym, (monthlyScheduleCount.get(ym) ?? 0) + 1);
    }

    // 3. 선택된 멤버들의 출석 기록 조회
    let attendanceRows: { user_id: string; status: AttendanceStatus; schedule_id: string }[] = [];
    if (scheduleIds.length > 0 && selectedUserIds.length > 0) {
      const { data: attData, error: attErr } = await supabase
        .from("attendance")
        .select("user_id, status, schedule_id")
        .in("schedule_id", scheduleIds)
        .in("user_id", selectedUserIds);

      if (attErr) {
        toast.error("출석 데이터를 불러오지 못했습니다");
        return [];
      }
      attendanceRows = (attData ?? []) as { user_id: string; status: AttendanceStatus; schedule_id: string }[];
    }

    // 4. 최근 6개월 레이블 목록 생성
    const months: { yearMonth: string; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      months.push({
        yearMonth: format(d, "yyyy-MM"),
        label: format(d, "M월", { locale: ko }),
      });
    }

    // 5. 멤버별 월간 출석률 집계
    const result: MemberComparisonData[] = selectedUserIds.map((userId) => {
      const userAtt = attendanceRows.filter((a) => a.user_id === userId);

      // 월별 출석 수 집계
      const monthlyPresent = new Map<string, number>();
      for (const att of userAtt) {
        if (att.status === "present" || att.status === "late") {
          const ym = scheduleYearMonthMap.get(att.schedule_id);
          if (ym) {
            monthlyPresent.set(ym, (monthlyPresent.get(ym) ?? 0) + 1);
          }
        }
      }

      const monthlyRates: MemberMonthlyRate[] = months.map(({ yearMonth, label }) => {
        const total = monthlyScheduleCount.get(yearMonth) ?? 0;
        const present = monthlyPresent.get(yearMonth) ?? 0;
        const rate = total > 0 ? Math.round((present / total) * 100) : 0;
        return { month: label, yearMonth, rate, totalSchedules: total };
      });

      const ratesWithData = monthlyRates.filter((m) => m.totalSchedules > 0);
      const avgRate =
        ratesWithData.length > 0
          ? Math.round(ratesWithData.reduce((sum, m) => sum + m.rate, 0) / ratesWithData.length)
          : 0;

      return {
        userId,
        name: memberMap[userId] ?? userId,
        monthlyRates,
        avgRate,
      };
    });

    return result;
  });

  return {
    data: data ?? [],
    loading: isLoading,
  };
}
