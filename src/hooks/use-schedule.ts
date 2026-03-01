"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { useIndependentEntityIds } from "@/hooks/use-independent-entities";
import type { Schedule, AttendanceWithProfile } from "@/types";

export function useSchedules(groupId: string, projectId?: string | null) {
  // 그룹 뷰일 때만 독립 엔티티 ID 조회 (SWR 캐시 공유로 중복 RPC 방지)
  const { data: independentEntities } = useIndependentEntityIds(
    !projectId ? groupId : undefined,
  );

  const { data, isLoading, mutate } = useSWR(
    // independentEntities가 로드되거나 projectId가 있을 때만 fetcher 실행
    projectId !== undefined
      ? swrKeys.schedules(groupId, projectId)
      : independentEntities !== undefined
        ? swrKeys.schedules(groupId, projectId)
        : null,
    async () => {
      const supabase = createClient();
      let query = supabase
        .from("schedules")
        .select("id, group_id, project_id, title, description, location, address, latitude, longitude, attendance_method, starts_at, ends_at, created_by, late_threshold, attendance_deadline, require_checkout, recurrence_id, max_attendees")
        .eq("group_id", groupId)
        .order("starts_at", { ascending: true });

      if (projectId) {
        query = query.eq("project_id", projectId);
      } else {
        // 그룹 뷰: 독립 프로젝트 제외 (SWR 캐시에서 이미 로드된 데이터 활용)
        const excludeProjectIds = (independentEntities || [])
          .filter((e) => e.feature === "schedule")
          .map((e) => e.entity_id);
        if (excludeProjectIds.length > 0) {
          query = query.not("project_id", "in", `(${excludeProjectIds.join(",")})`);
        }
      }

      const { data } = await query;
      return (data ?? []) as Schedule[];
    },
  );

  return {
    schedules: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
  };
}

export function useTodaySchedules() {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.todaySchedules(),
    async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [] as Schedule[];

      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

      // 사용자가 속한 그룹의 오늘 일정 조회
      const { data: memberGroups } = await supabase
        .from("group_members")
        .select("group_id")
        .eq("user_id", user.id);

      if (!memberGroups || memberGroups.length === 0) return [] as Schedule[];

      const groupIds = memberGroups.map((m: { group_id: string }) => m.group_id);

      const { data } = await supabase
        .from("schedules")
        .select("id, group_id, project_id, title, description, location, address, latitude, longitude, attendance_method, starts_at, ends_at, created_by, late_threshold, attendance_deadline, require_checkout, recurrence_id, max_attendees")
        .in("group_id", groupIds)
        .gte("starts_at", startOfDay)
        .lt("starts_at", endOfDay)
        .order("starts_at", { ascending: true });

      return (data ?? []) as Schedule[];
    }
  );

  return {
    schedules: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
  };
}

export function useAttendance(scheduleId: string) {
  const fetcher = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("attendance")
      .select("id, schedule_id, user_id, status, checked_at, check_in_latitude, check_in_longitude, checked_out_at, check_out_latitude, check_out_longitude, excuse_reason, excuse_status, profiles(*)")
      .eq("schedule_id", scheduleId);

    return (data ?? []) as AttendanceWithProfile[];
  };

  const { data, isLoading, mutate } = useSWR(
    swrKeys.attendance(scheduleId),
    fetcher,
  );

  return {
    records: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
  };
}
