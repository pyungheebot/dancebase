"use client";

import useSWR from "swr";
import { subMonths, startOfMonth, endOfMonth } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import {
  generateAttendanceReport,
  type AttendanceReport,
  type ReportMember,
} from "@/lib/attendance-report-generator";
import type { AttendanceStatus } from "@/types";
import type { EntityMember } from "@/types/entity-context";

export type ReportPeriod = "1m" | "3m" | "6m" | "1y";

const PERIOD_MONTHS: Record<ReportPeriod, number> = {
  "1m": 1,
  "3m": 3,
  "6m": 6,
  "1y": 12,
};

export function useAttendanceReport(
  groupId: string,
  members: EntityMember[],
  period: ReportPeriod = "3m",
  projectId?: string | null
) {
  const supabase = createClient();

  const swrKey =
    groupId && members.length > 0
      ? swrKeys.attendanceReport(groupId, projectId, period)
      : null;

  const { data, isLoading, mutate } = useSWR<AttendanceReport>(
    swrKey,
    async () => {
      // 기간 범위 계산
      const now = new Date();
      const months = PERIOD_MONTHS[period];
      const from = startOfMonth(subMonths(now, months - 1)).toISOString();
      const to = endOfMonth(now).toISOString();

      // 일정 조회
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
        throw new Error("일정 데이터를 불러오지 못했습니다");
      }

      const schedules = (scheduleRows ?? []) as Array<{
        id: string;
        starts_at: string;
      }>;

      // 출석 기록 조회
      const scheduleIds = schedules.map((s) => s.id);
      let attendances: Array<{
        schedule_id: string;
        user_id: string;
        status: AttendanceStatus;
      }> = [];

      if (scheduleIds.length > 0) {
        const { data: attData, error: attErr } = await supabase
          .from("attendance")
          .select("schedule_id, user_id, status")
          .in("schedule_id", scheduleIds);

        if (attErr) {
          throw new Error("출석 데이터를 불러오지 못했습니다");
        }
        attendances = (attData ?? []) as typeof attendances;
      }

      // 멤버 목록 변환
      const reportMembers: ReportMember[] = members.map((m) => ({
        userId: m.userId,
        name: m.nickname || m.profile.name,
      }));

      return generateAttendanceReport(schedules, attendances, reportMembers);
    }
  );

  return {
    report: data ?? null,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
