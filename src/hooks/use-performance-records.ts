"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import { invalidatePerformanceRecords } from "@/lib/swr/invalidate";
import type { PerformanceRecord, PerformanceEventType } from "@/types";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";

export type PerformanceRecordInput = {
  event_name: string;
  event_date: string;
  event_type: PerformanceEventType;
  result?: string | null;
  ranking?: string | null;
  audience_count?: number | null;
  venue?: string | null;
  notes?: string | null;
  project_id?: string | null;
};

export function usePerformanceRecords(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.performanceRecords(groupId) : null,
    async () => {
      if (!groupId) return [];
      const supabase = createClient();

      const { data: rows, error } = await supabase
        .from("performance_records")
        .select("*")
        .eq("group_id", groupId)
        .order("event_date", { ascending: false });

      if (error) throw error;
      return (rows ?? []) as PerformanceRecord[];
    }
  );

  const records = data ?? [];

  // 통계 계산
  const totalCount = records.length;
  const awardCount = records.filter((r) => r.result && r.result.trim() !== "").length;
  const currentYear = new Date().getFullYear().toString();
  const thisYearCount = records.filter((r) => r.event_date.startsWith(currentYear)).length;

  const addRecord = async (input: PerformanceRecordInput): Promise<boolean> => {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error(TOAST.LOGIN_REQUIRED);
      return false;
    }

    const { error } = await supabase.from("performance_records").insert({
      group_id: groupId,
      project_id: input.project_id ?? null,
      event_name: input.event_name.trim(),
      event_date: input.event_date,
      event_type: input.event_type,
      result: input.result?.trim() || null,
      ranking: input.ranking?.trim() || null,
      audience_count: input.audience_count ?? null,
      venue: input.venue?.trim() || null,
      notes: input.notes?.trim() || null,
      created_by: user.id,
    });

    if (error) {
      toast.error(TOAST.PERFORMANCE_RECORD.ADD_ERROR);
      return false;
    }

    toast.success(TOAST.PERFORMANCE_RECORD.CREATED);
    invalidatePerformanceRecords(groupId);
    mutate();
    return true;
  };

  const updateRecord = async (
    id: string,
    input: Partial<PerformanceRecordInput>
  ): Promise<boolean> => {
    const supabase = createClient();

    const updateData: Record<string, unknown> = {};
    if (input.event_name !== undefined) updateData.event_name = input.event_name.trim();
    if (input.event_date !== undefined) updateData.event_date = input.event_date;
    if (input.event_type !== undefined) updateData.event_type = input.event_type;
    if (input.result !== undefined) updateData.result = input.result?.trim() || null;
    if (input.ranking !== undefined) updateData.ranking = input.ranking?.trim() || null;
    if (input.audience_count !== undefined) updateData.audience_count = input.audience_count ?? null;
    if (input.venue !== undefined) updateData.venue = input.venue?.trim() || null;
    if (input.notes !== undefined) updateData.notes = input.notes?.trim() || null;
    if (input.project_id !== undefined) updateData.project_id = input.project_id ?? null;

    const { error } = await supabase
      .from("performance_records")
      .update(updateData)
      .eq("id", id);

    if (error) {
      toast.error(TOAST.PERFORMANCE_RECORD.UPDATE_ERROR);
      return false;
    }

    toast.success(TOAST.PERFORMANCE_RECORD.UPDATED);
    invalidatePerformanceRecords(groupId);
    mutate();
    return true;
  };

  const deleteRecord = async (id: string): Promise<boolean> => {
    const supabase = createClient();

    const { error } = await supabase
      .from("performance_records")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error(TOAST.PERFORMANCE_RECORD.DELETE_ERROR);
      return false;
    }

    toast.success(TOAST.PERFORMANCE_RECORD.DELETED);
    invalidatePerformanceRecords(groupId);
    mutate();
    return true;
  };

  return {
    records,
    loading: isLoading,
    totalCount,
    awardCount,
    thisYearCount,
    addRecord,
    updateRecord,
    deleteRecord,
    refetch: () => mutate(),
  };
}
