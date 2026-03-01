"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type {
  AttendanceComparisonDetail,
  AttendanceComparisonDetailResult,
  AttendanceStatus,
} from "@/types";

/**
 * useAttendanceComparisonDetail
 * 선택된 멤버들의 전체 기간 출석/결석/지각 횟수와 출석률을 조회한다.
 */
export function useAttendanceComparisonDetail(
  groupId: string,
  selectedUserIds: string[],
  memberMap: Record<string, { name: string; avatarUrl: string | null }>,
  projectId?: string | null
) {
  const key =
    groupId && selectedUserIds.length > 0
      ? swrKeys.attendanceComparisonDetail(groupId, selectedUserIds, projectId)
      : null;

  const { data, isLoading, mutate } = useSWR<AttendanceComparisonDetailResult>(
    key,
    async () => {
      const supabase = createClient();

      // 1. 그룹(+프로젝트) 일정 조회 (attendance_method != 'none')
      let schedulesQuery = supabase
        .from("schedules")
        .select("id")
        .eq("group_id", groupId)
        .neq("attendance_method", "none");

      if (projectId) {
        schedulesQuery = schedulesQuery.eq("project_id", projectId);
      }

      const { data: scheduleRows, error: schedErr } = await schedulesQuery;
      if (schedErr) {
        toast.error(TOAST.SCHEDULE.DATA_LOAD_ERROR);
        return { members: [], hasData: false };
      }

      const scheduleIds = (scheduleRows ?? []).map(
        (s: { id: string }) => s.id
      );

      if (scheduleIds.length === 0) {
        // 일정이 없으면 0으로 채워 반환
        const members: AttendanceComparisonDetail[] = selectedUserIds.map(
          (userId) => ({
            userId,
            name: memberMap[userId]?.name ?? userId,
            avatarUrl: memberMap[userId]?.avatarUrl ?? null,
            totalSchedules: 0,
            presentCount: 0,
            absentCount: 0,
            lateCount: 0,
            attendanceRate: 0,
          })
        );
        return { members, hasData: false };
      }

      // 2. 선택된 멤버들의 출석 기록 조회
      const { data: attRows, error: attErr } = await supabase
        .from("attendance")
        .select("user_id, status, schedule_id")
        .in("schedule_id", scheduleIds)
        .in("user_id", selectedUserIds);

      if (attErr) {
        toast.error(TOAST.ATTENDANCE.DATA_LOAD_ERROR);
        return { members: [], hasData: false };
      }

      const attendances = (attRows ?? []) as {
        user_id: string;
        status: AttendanceStatus;
        schedule_id: string;
      }[];

      const totalSchedules = scheduleIds.length;

      // 3. 멤버별 집계
      const members: AttendanceComparisonDetail[] = selectedUserIds.map(
        (userId) => {
          const userAtt = attendances.filter((a) => a.user_id === userId);

          let presentCount = 0;
          let absentCount = 0;
          let lateCount = 0;

          for (const att of userAtt) {
            if (att.status === "present") presentCount += 1;
            else if (att.status === "absent") absentCount += 1;
            else if (att.status === "late") lateCount += 1;
            // early_leave는 출석으로 집계
            else if (att.status === "early_leave") presentCount += 1;
          }

          const attendedCount = presentCount + lateCount;
          const attendanceRate =
            totalSchedules > 0
              ? Math.round((attendedCount / totalSchedules) * 100)
              : 0;

          return {
            userId,
            name: memberMap[userId]?.name ?? userId,
            avatarUrl: memberMap[userId]?.avatarUrl ?? null,
            totalSchedules,
            presentCount,
            absentCount,
            lateCount,
            attendanceRate,
          };
        }
      );

      const hasData = attendances.length > 0;
      return { members, hasData };
    },
    { revalidateOnFocus: false }
  );

  return {
    data: data ?? { members: [], hasData: false },
    loading: isLoading,
    refetch: () => mutate(),
  };
}
