"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type {
  ScheduleAttendanceSummaryResult,
  ScheduleAttendanceMember,
  AttendanceRecordStatus,
} from "@/types";

export function useScheduleAttendanceSummary(
  scheduleId: string
): ScheduleAttendanceSummaryResult {
  const { data, isLoading, mutate } = useSWR(
    scheduleId ? swrKeys.scheduleAttendanceSummary(scheduleId) : null,
    async () => {
      const supabase = createClient();

      // 1. 일정 정보 조회
      const { data: schedule, error: scheduleError } = await supabase
        .from("schedules")
        .select("id, group_id, title, starts_at")
        .eq("id", scheduleId)
        .single();

      if (scheduleError || !schedule) {
        throw new Error(scheduleError?.message ?? "일정을 찾을 수 없습니다.");
      }

      // 2. 그룹 멤버 목록 조회 (profiles JOIN)
      const { data: groupMembers, error: membersError } = await supabase
        .from("group_members")
        .select("user_id, profiles(id, name)")
        .eq("group_id", schedule.group_id);

      if (membersError) {
        throw new Error(membersError.message);
      }

      // 3. 해당 일정의 출석 기록 조회
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from("attendance")
        .select("user_id, status")
        .eq("schedule_id", scheduleId);

      if (attendanceError) {
        throw new Error(attendanceError.message);
      }

      // 4. 출석 기록을 userId → status 맵으로 변환
      const attendanceMap = new Map<string, AttendanceRecordStatus>();
      for (const record of attendanceRecords ?? []) {
        attendanceMap.set(record.user_id, record.status as AttendanceRecordStatus);
      }

      // 5. 멤버별 상태 계산
      const members: ScheduleAttendanceMember[] = (groupMembers ?? []).map(
        (gm: { user_id: string; profiles: { id: string; name: string } | { id: string; name: string }[] | null }) => {
          const profile = Array.isArray(gm.profiles)
            ? gm.profiles[0]
            : gm.profiles;
          const status = attendanceMap.get(gm.user_id);
          return {
            userId: gm.user_id,
            name: profile?.name ?? "알 수 없음",
            status: status ?? "no_response",
          };
        }
      );

      const totalMembers = members.length;
      const presentCount = members.filter((m) => m.status === "present").length;
      const absentCount = members.filter((m) => m.status === "absent").length;
      const lateCount = members.filter((m) => m.status === "late").length;
      const noResponseCount = members.filter(
        (m) => m.status === "no_response"
      ).length;

      const attendanceRate =
        totalMembers > 0
          ? Math.round(((presentCount + lateCount) / totalMembers) * 100)
          : 0;

      return {
        scheduleId: schedule.id,
        scheduleTitle: schedule.title,
        startsAt: schedule.starts_at,
        totalMembers,
        presentCount,
        absentCount,
        lateCount,
        noResponseCount,
        attendanceRate,
        members,
      };
    }
  );

  return {
    scheduleId: data?.scheduleId ?? scheduleId,
    scheduleTitle: data?.scheduleTitle ?? "",
    startsAt: data?.startsAt ?? "",
    totalMembers: data?.totalMembers ?? 0,
    presentCount: data?.presentCount ?? 0,
    absentCount: data?.absentCount ?? 0,
    lateCount: data?.lateCount ?? 0,
    noResponseCount: data?.noResponseCount ?? 0,
    attendanceRate: data?.attendanceRate ?? 0,
    members: data?.members ?? [],
    loading: isLoading,
    refetch: () => mutate(),
  };
}
