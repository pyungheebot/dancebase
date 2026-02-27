"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { invalidateScheduleRoles } from "@/lib/swr/invalidate";
import type { ScheduleRoleWithProfile } from "@/types";

const ROLE_HISTORY_KEY = "schedule_role_history";
const MAX_HISTORY = 10;

function getRoleHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ROLE_HISTORY_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function addRoleHistory(roleName: string): void {
  if (typeof window === "undefined") return;
  try {
    const history = getRoleHistory().filter((r) => r !== roleName);
    history.unshift(roleName);
    localStorage.setItem(
      ROLE_HISTORY_KEY,
      JSON.stringify(history.slice(0, MAX_HISTORY))
    );
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

export function useScheduleRoles(scheduleId: string | null) {
  const { data, isLoading, mutate } = useSWR(
    scheduleId ? swrKeys.scheduleRoles(scheduleId) : null,
    async () => {
      if (!scheduleId) return [];
      const supabase = createClient();

      const { data: rows, error } = await supabase
        .from("schedule_roles")
        .select("*, profiles(id, name, avatar_url)")
        .eq("schedule_id", scheduleId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (rows ?? []) as ScheduleRoleWithProfile[];
    }
  );

  const addRole = async (userId: string, roleName: string): Promise<void> => {
    if (!scheduleId) return;
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("로그인이 필요합니다");

    const { error } = await supabase.from("schedule_roles").insert({
      schedule_id: scheduleId,
      user_id: userId,
      role_name: roleName.trim(),
      created_by: user.id,
    });

    if (error) throw error;

    addRoleHistory(roleName.trim());
    invalidateScheduleRoles(scheduleId);
    mutate();
  };

  const removeRole = async (roleId: string): Promise<void> => {
    if (!scheduleId) return;
    const supabase = createClient();

    const { error } = await supabase
      .from("schedule_roles")
      .delete()
      .eq("id", roleId);

    if (error) throw error;

    invalidateScheduleRoles(scheduleId);
    mutate();
  };

  return {
    roles: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
    addRole,
    removeRole,
    getRoleHistory,
  };
}
