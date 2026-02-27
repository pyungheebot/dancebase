"use client";

import useSWR from "swr";
import { startOfWeek, endOfWeek, subWeeks } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { AttendanceStatus } from "@/types";

export type WeeklyTopMember = {
  userId: string;
  name: string;
  count: number;
};

export type WeeklyAttendanceStatsResult = {
  thisWeekRate: number;
  lastWeekRate: number;
  diff: number;
  scheduleCount: number;
  topMembers: WeeklyTopMember[];
};

export function useWeeklyAttendanceStats(
  groupId: string,
  projectId?: string | null
) {
  const supabase = createClient();

  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.weeklyAttendanceStats(groupId, projectId) : null,
    async (): Promise<WeeklyAttendanceStatsResult> => {
      const now = new Date();

      // 이번 주 (월요일 ~ 일요일)
      const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
      const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString();

      // 지난 주
      const lastWeekDate = subWeeks(now, 1);
      const lastWeekStart = startOfWeek(lastWeekDate, { weekStartsOn: 1 }).toISOString();
      const lastWeekEnd = endOfWeek(lastWeekDate, { weekStartsOn: 1 }).toISOString();

      // 이번 주 일정 조회
      let thisWeekSchedulesQuery = supabase
        .from("schedules")
        .select("id")
        .eq("group_id", groupId)
        .neq("attendance_method", "none")
        .gte("starts_at", thisWeekStart)
        .lte("starts_at", thisWeekEnd);

      if (projectId) {
        thisWeekSchedulesQuery = thisWeekSchedulesQuery.eq("project_id", projectId);
      }

      const { data: thisWeekSchedules, error: thisWeekSchedulesErr } =
        await thisWeekSchedulesQuery;

      if (thisWeekSchedulesErr) {
        throw new Error("이번 주 일정 조회 실패");
      }

      const thisWeekScheduleIds = (thisWeekSchedules ?? []).map(
        (s: { id: string }) => s.id
      );
      const scheduleCount = thisWeekScheduleIds.length;

      // 이번 주 출석 데이터 조회
      let thisWeekRate = 0;
      const topMemberMap: Record<string, { name: string; count: number }> = {};

      if (thisWeekScheduleIds.length > 0) {
        const { data: thisWeekAtt, error: thisWeekAttErr } = await supabase
          .from("attendance")
          .select("user_id, status, profiles(name, nickname)")
          .in("schedule_id", thisWeekScheduleIds);

        if (thisWeekAttErr) {
          throw new Error("이번 주 출석 조회 실패");
        }

        const rows = (thisWeekAtt ?? []) as {
          user_id: string;
          status: AttendanceStatus;
          profiles: { name: string; nickname?: string | null } | null;
        }[];

        const totalRecords = rows.length;
        const presentOrLate = rows.filter(
          (r) => r.status === "present" || r.status === "late"
        );

        thisWeekRate =
          totalRecords > 0
            ? Math.round((presentOrLate.length / totalRecords) * 100)
            : 0;

        // Top 3 멤버 집계: present + late 횟수 기준
        for (const row of presentOrLate) {
          if (!topMemberMap[row.user_id]) {
            const profileName =
              row.profiles?.name ?? "알 수 없음";
            topMemberMap[row.user_id] = { name: profileName, count: 0 };
          }
          topMemberMap[row.user_id].count += 1;
        }
      }

      // 지난 주 일정 조회
      let lastWeekSchedulesQuery = supabase
        .from("schedules")
        .select("id")
        .eq("group_id", groupId)
        .neq("attendance_method", "none")
        .gte("starts_at", lastWeekStart)
        .lte("starts_at", lastWeekEnd);

      if (projectId) {
        lastWeekSchedulesQuery = lastWeekSchedulesQuery.eq("project_id", projectId);
      }

      const { data: lastWeekSchedules, error: lastWeekSchedulesErr } =
        await lastWeekSchedulesQuery;

      if (lastWeekSchedulesErr) {
        throw new Error("지난 주 일정 조회 실패");
      }

      const lastWeekScheduleIds = (lastWeekSchedules ?? []).map(
        (s: { id: string }) => s.id
      );

      // 지난 주 출석률 계산
      let lastWeekRate = 0;

      if (lastWeekScheduleIds.length > 0) {
        const { data: lastWeekAtt, error: lastWeekAttErr } = await supabase
          .from("attendance")
          .select("status")
          .in("schedule_id", lastWeekScheduleIds);

        if (lastWeekAttErr) {
          throw new Error("지난 주 출석 조회 실패");
        }

        const lastRows = (lastWeekAtt ?? []) as { status: AttendanceStatus }[];
        const lastTotal = lastRows.length;
        const lastPresentOrLate = lastRows.filter(
          (r) => r.status === "present" || r.status === "late"
        ).length;

        lastWeekRate =
          lastTotal > 0
            ? Math.round((lastPresentOrLate / lastTotal) * 100)
            : 0;
      }

      // Top 3 멤버 정렬
      const topMembers: WeeklyTopMember[] = Object.entries(topMemberMap)
        .map(([userId, { name, count }]) => ({ userId, name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      return {
        thisWeekRate,
        lastWeekRate,
        diff: thisWeekRate - lastWeekRate,
        scheduleCount,
        topMembers,
      };
    }
  );

  return {
    data: data ?? null,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
