"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { Schedule, AttendanceWithProfile } from "@/types";

export function useSchedules(groupId: string, projectId?: string | null) {
  const fetcher = async () => {
    const supabase = createClient();
    let query = supabase
      .from("schedules")
      .select("*")
      .eq("group_id", groupId)
      .order("starts_at", { ascending: true });

    if (projectId) {
      query = query.eq("project_id", projectId);
    } else {
      // 그룹 뷰: 독립 프로젝트 제외, 통합 프로젝트 포함
      const { data: independentEntities } = await supabase.rpc(
        "get_independent_entity_ids",
        { p_group_id: groupId, p_feature: "schedule" }
      );
      const excludeProjectIds = (independentEntities || []).map((e: { entity_id: string }) => e.entity_id);
      if (excludeProjectIds.length > 0) {
        query = query.not("project_id", "in", `(${excludeProjectIds.join(",")})`);
      }
    }

    const { data } = await query;
    return (data ?? []) as Schedule[];
  };

  const { data, isLoading, mutate } = useSWR(
    swrKeys.schedules(groupId, projectId),
    fetcher,
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
        .select("*")
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
      .select("*, profiles(*)")
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
