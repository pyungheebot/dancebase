"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { RehearsalScheduleEntry, RehearsalType } from "@/types";

// ============================================================
// localStorage 유틸
// ============================================================

function storageKey(groupId: string, projectId: string): string {
  return `dancebase:rehearsal-schedule:${groupId}:${projectId}`;
}

function loadEntries(
  groupId: string,
  projectId: string
): RehearsalScheduleEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(groupId, projectId));
    if (!raw) return [];
    return JSON.parse(raw) as RehearsalScheduleEntry[];
  } catch {
    return [];
  }
}

function saveEntries(
  groupId: string,
  projectId: string,
  entries: RehearsalScheduleEntry[]
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      storageKey(groupId, projectId),
      JSON.stringify(entries)
    );
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

// ============================================================
// 훅
// ============================================================

export function useRehearsalSchedule(groupId: string, projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.rehearsalSchedule(groupId, projectId),
    () => loadEntries(groupId, projectId),
    { fallbackData: [] }
  );

  const entries = data ?? [];

  /** 리허설 추가 */
  const addRehearsal = useCallback(
    (params: {
      title: string;
      type: RehearsalType;
      date: string;
      startTime: string;
      endTime: string;
      location?: string;
      focusAreas: string[];
      requiredMembers: string[];
      notes?: string;
    }): boolean => {
      if (!params.title.trim()) return false;
      const current = loadEntries(groupId, projectId);
      const newEntry: RehearsalScheduleEntry = {
        id: crypto.randomUUID(),
        title: params.title.trim(),
        type: params.type,
        date: params.date,
        startTime: params.startTime,
        endTime: params.endTime,
        location: params.location?.trim() || undefined,
        focusAreas: params.focusAreas,
        requiredMembers: params.requiredMembers,
        notes: params.notes?.trim() || undefined,
        status: "scheduled",
        createdAt: new Date().toISOString(),
      };
      const updated = [newEntry, ...current];
      saveEntries(groupId, projectId, updated);
      mutate(updated, false);
      return true;
    },
    [groupId, projectId, mutate]
  );

  /** 리허설 수정 */
  const updateRehearsal = useCallback(
    (
      id: string,
      patch: Partial<Omit<RehearsalScheduleEntry, "id" | "createdAt">>
    ): void => {
      const current = loadEntries(groupId, projectId);
      const updated = current.map((e) =>
        e.id === id ? { ...e, ...patch } : e
      );
      saveEntries(groupId, projectId, updated);
      mutate(updated, false);
    },
    [groupId, projectId, mutate]
  );

  /** 리허설 삭제 */
  const deleteRehearsal = useCallback(
    (id: string): void => {
      const current = loadEntries(groupId, projectId);
      const updated = current.filter((e) => e.id !== id);
      saveEntries(groupId, projectId, updated);
      mutate(updated, false);
    },
    [groupId, projectId, mutate]
  );

  /** 완료 처리 */
  const completeRehearsal = useCallback(
    (id: string): void => {
      const current = loadEntries(groupId, projectId);
      const updated = current.map((e) =>
        e.id === id ? { ...e, status: "completed" as const } : e
      );
      saveEntries(groupId, projectId, updated);
      mutate(updated, false);
    },
    [groupId, projectId, mutate]
  );

  /** 취소 처리 */
  const cancelRehearsal = useCallback(
    (id: string): void => {
      const current = loadEntries(groupId, projectId);
      const updated = current.map((e) =>
        e.id === id ? { ...e, status: "cancelled" as const } : e
      );
      saveEntries(groupId, projectId, updated);
      mutate(updated, false);
    },
    [groupId, projectId, mutate]
  );

  /** 오늘 이후 예정된 리허설 */
  const getUpcoming = useCallback((): RehearsalScheduleEntry[] => {
    const today = new Date().toISOString().slice(0, 10);
    return entries
      .filter((e) => e.status === "scheduled" && e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [entries]);

  /** 유형별 필터 */
  const getByType = useCallback(
    (type: RehearsalType): RehearsalScheduleEntry[] => {
      return entries.filter((e) => e.type === type);
    },
    [entries]
  );

  // 통계
  const totalRehearsals = entries.length;
  const completedCount = entries.filter((e) => e.status === "completed").length;
  const today = new Date().toISOString().slice(0, 10);
  const upcomingList = entries
    .filter((e) => e.status === "scheduled" && e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const upcomingCount = upcomingList.length;
  const nextRehearsal = upcomingList.length > 0 ? upcomingList[0] : null;

  return {
    entries,
    loading: isLoading,
    refetch: () => mutate(),
    addRehearsal,
    updateRehearsal,
    deleteRehearsal,
    completeRehearsal,
    cancelRehearsal,
    getUpcoming,
    getByType,
    totalRehearsals,
    completedCount,
    upcomingCount,
    nextRehearsal,
  };
}
