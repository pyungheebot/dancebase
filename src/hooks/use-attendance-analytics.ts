"use client";

import { useState, useCallback } from "react";
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";
import { ko } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { EntityContext } from "@/types/entity-context";
import type { AttendanceStatus } from "@/types";

export type MemberAttendanceStat = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  present: number;
  late: number;
  earlyLeave: number;
  absent: number;
  total: number;
  rate: number;
};

export type MonthlyAttendanceStat = {
  month: string;       // "2025년 9월" 형태
  yearMonth: string;   // "2025-09" 형태 (정렬용)
  totalSchedules: number;
  avgRate: number;
};

export type AttendanceAnalyticsData = {
  memberStats: MemberAttendanceStat[];
  monthlyStats: MonthlyAttendanceStat[];
  overallAvgRate: number;
  totalSchedules: number;
};

export function useAttendanceAnalytics(ctx: EntityContext) {
  const [data, setData] = useState<AttendanceAnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  const fetch = useCallback(async () => {
    if (ctx.members.length === 0) return;
    setLoading(true);

    try {
      // =============================================
      // 1. 최근 6개월 범위 계산
      // =============================================
      const now = new Date();
      const from = startOfMonth(subMonths(now, 5)).toISOString();
      const to = endOfMonth(now).toISOString();

      // =============================================
      // 2. 기간 내 schedules 조회 (출석 방식이 none이 아닌 것)
      // =============================================
      let schedulesQuery = supabase
        .from("schedules")
        .select("id, starts_at")
        .eq("group_id", ctx.groupId)
        .neq("attendance_method", "none")
        .gte("starts_at", from)
        .lte("starts_at", to);

      if (ctx.projectId) {
        schedulesQuery = schedulesQuery.eq("project_id", ctx.projectId);
      }

      const { data: scheduleRows, error: schedErr } = await schedulesQuery;
      if (schedErr) {
        toast.error("일정 데이터를 불러오지 못했습니다");
        return;
      }

      const scheduleIds = (scheduleRows ?? []).map((s: { id: string; starts_at: string }) => s.id);
      const totalSchedules = scheduleIds.length;

      // =============================================
      // 3. 출석 기록 조회
      // =============================================
      let attendanceRows: { user_id: string; status: AttendanceStatus; schedule_id: string }[] = [];
      if (scheduleIds.length > 0) {
        const { data: attData, error: attErr } = await supabase
          .from("attendance")
          .select("user_id, status, schedule_id")
          .in("schedule_id", scheduleIds);

        if (attErr) {
          toast.error("출석 데이터를 불러오지 못했습니다");
          return;
        }
        attendanceRows = (attData ?? []) as { user_id: string; status: AttendanceStatus; schedule_id: string }[];
      }

      // =============================================
      // 4. 멤버별 출석 통계 집계
      // =============================================
      const memberStats: MemberAttendanceStat[] = ctx.members.map((member) => {
        const memberAtt = attendanceRows.filter((a) => a.user_id === member.userId);
        const present = memberAtt.filter((a) => a.status === "present").length;
        const late = memberAtt.filter((a) => a.status === "late").length;
        const earlyLeave = memberAtt.filter((a) => a.status === "early_leave").length;
        const absent = Math.max(0, totalSchedules - present - late - earlyLeave);
        const rate = totalSchedules > 0
          ? Math.round(((present + late) / totalSchedules) * 100)
          : 0;

        return {
          userId: member.userId,
          name: member.nickname || member.profile.name,
          avatarUrl: member.profile.avatar_url,
          present,
          late,
          earlyLeave,
          absent,
          total: totalSchedules,
          rate,
        };
      });

      // 출석률 내림차순 정렬
      memberStats.sort((a, b) => b.rate - a.rate || a.name.localeCompare(b.name));

      // =============================================
      // 5. 전체 평균 출석률 계산
      // =============================================
      const overallAvgRate = memberStats.length > 0
        ? Math.round(memberStats.reduce((sum, m) => sum + m.rate, 0) / memberStats.length)
        : 0;

      // =============================================
      // 6. 월별 출석 통계 집계 (최근 6개월)
      // =============================================
      // schedule_id -> starts_at 매핑
      const scheduleMap = new Map(
        (scheduleRows ?? []).map((s: { id: string; starts_at: string }) => [
          s.id,
          s.starts_at,
        ])
      );

      // 월별 schedule 수 집계
      const monthlyScheduleCount = new Map<string, number>();
      for (const sched of scheduleRows ?? []) {
        const ym = format(new Date((sched as { id: string; starts_at: string }).starts_at), "yyyy-MM");
        monthlyScheduleCount.set(ym, (monthlyScheduleCount.get(ym) ?? 0) + 1);
      }

      // 월별 출석 합산 (present + late를 출석으로 카운트)
      const monthlyPresentCount = new Map<string, number>();
      const monthlyPossibleCount = new Map<string, number>(); // 전체 멤버 * 해당 월 일정 수

      for (const [ym, cnt] of monthlyScheduleCount.entries()) {
        monthlyPossibleCount.set(ym, cnt * ctx.members.length);
      }

      for (const att of attendanceRows) {
        const startsAt = scheduleMap.get(att.schedule_id);
        if (!startsAt) continue;
        const ym = format(new Date(startsAt as string), "yyyy-MM");
        if (att.status === "present" || att.status === "late") {
          monthlyPresentCount.set(ym, (monthlyPresentCount.get(ym) ?? 0) + 1);
        }
      }

      // 최근 6개월 순서대로 정렬
      const monthlyStats: MonthlyAttendanceStat[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(now, i);
        const ym = format(d, "yyyy-MM");
        const label = format(d, "yyyy년 M월", { locale: ko });
        const schedCnt = monthlyScheduleCount.get(ym) ?? 0;
        const possible = monthlyPossibleCount.get(ym) ?? 0;
        const present = monthlyPresentCount.get(ym) ?? 0;
        const avgRate = possible > 0 ? Math.round((present / possible) * 100) : 0;

        monthlyStats.push({
          month: label,
          yearMonth: ym,
          totalSchedules: schedCnt,
          avgRate,
        });
      }

      setData({
        memberStats,
        monthlyStats,
        overallAvgRate,
        totalSchedules,
      });
    } finally {
      setLoading(false);
    }
  }, [supabase, ctx.groupId, ctx.projectId, ctx.members]);

  return { data, loading, refetch: fetch };
}
