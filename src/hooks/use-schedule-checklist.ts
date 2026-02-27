"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { invalidateScheduleChecklist } from "@/lib/swr/invalidate";
import type { ScheduleChecklistItem } from "@/types";

export function useScheduleChecklist(scheduleId: string | null) {
  const { data, isLoading, mutate } = useSWR(
    scheduleId ? swrKeys.scheduleChecklist(scheduleId) : null,
    async () => {
      if (!scheduleId) return [];
      const supabase = createClient();

      const { data: rows, error } = await supabase
        .from("schedule_checklist_items")
        .select("*")
        .eq("schedule_id", scheduleId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (rows ?? []) as ScheduleChecklistItem[];
    }
  );

  /** 항목 추가 */
  const addItem = async (title: string): Promise<void> => {
    if (!scheduleId) return;
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("로그인이 필요합니다");

    const currentItems = data ?? [];
    const maxOrder = currentItems.reduce(
      (max, item) => Math.max(max, item.sort_order),
      -1
    );

    const { error } = await supabase.from("schedule_checklist_items").insert({
      schedule_id: scheduleId,
      title: title.trim(),
      sort_order: maxOrder + 1,
      created_by: user.id,
    });

    if (error) throw error;

    invalidateScheduleChecklist(scheduleId);
    mutate();
  };

  /** 항목 삭제 */
  const removeItem = async (itemId: string): Promise<void> => {
    if (!scheduleId) return;
    const supabase = createClient();

    const { error } = await supabase
      .from("schedule_checklist_items")
      .delete()
      .eq("id", itemId);

    if (error) throw error;

    invalidateScheduleChecklist(scheduleId);
    mutate();
  };

  /** 완료 토글 */
  const toggleDone = async (itemId: string, isDone: boolean): Promise<void> => {
    if (!scheduleId) return;
    const supabase = createClient();

    const { error } = await supabase
      .from("schedule_checklist_items")
      .update({ is_done: isDone })
      .eq("id", itemId);

    if (error) throw error;

    invalidateScheduleChecklist(scheduleId);
    mutate();
  };

  const items = data ?? [];
  const doneCount = items.filter((item) => item.is_done).length;
  const totalCount = items.length;
  const completionRate =
    totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return {
    items,
    loading: isLoading,
    refetch: () => mutate(),
    addItem,
    removeItem,
    toggleDone,
    doneCount,
    totalCount,
    completionRate,
  };
}
