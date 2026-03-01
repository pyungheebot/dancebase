"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type { BodyTrackerEntry } from "@/types";

// ============================================
// localStorage 키
// ============================================

function storageKey(memberId: string): string {
  return `dancebase:body-tracker:${memberId}`;
}

// ============================================
// localStorage 헬퍼
// ============================================

function loadEntries(memberId: string): BodyTrackerEntry[] {
  return loadFromStorage<BodyTrackerEntry[]>(storageKey(memberId), []);
}

function saveEntries(memberId: string, entries: BodyTrackerEntry[]): void {
  saveToStorage(storageKey(memberId), entries);
}

// ============================================
// 통계 계산
// ============================================

type BodyTrackerStats = {
  totalEntries: number;
  latestWeight: number | null;
  weightChange: number | null; // 최근 - 이전 (kg)
  averageBodyFat: number | null;
};

function computeStats(entries: BodyTrackerEntry[]): BodyTrackerStats {
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  const totalEntries = sorted.length;

  const latestWeight = sorted.find((e) => e.weight != null)?.weight ?? null;

  // 체중이 있는 기록 두 개로 변화량 계산
  const weightEntries = sorted.filter((e) => e.weight != null);
  let weightChange: number | null = null;
  if (weightEntries.length >= 2) {
    const latest = weightEntries[0].weight!;
    const prev = weightEntries[1].weight!;
    weightChange = Math.round((latest - prev) * 10) / 10;
  }

  // 체지방률 평균
  const bodyFatEntries = sorted.filter((e) => e.bodyFat != null);
  const averageBodyFat =
    bodyFatEntries.length > 0
      ? Math.round(
          (bodyFatEntries.reduce((sum, e) => sum + e.bodyFat!, 0) /
            bodyFatEntries.length) *
            10
        ) / 10
      : null;

  return { totalEntries, latestWeight, weightChange, averageBodyFat };
}

// ============================================
// 훅
// ============================================

type UseBodyTrackerReturn = {
  entries: BodyTrackerEntry[];
  loading: boolean;
  stats: BodyTrackerStats;
  addEntry: (
    entry: Omit<BodyTrackerEntry, "id" | "createdAt">
  ) => void;
  updateEntry: (
    id: string,
    updates: Partial<Omit<BodyTrackerEntry, "id" | "createdAt">>
  ) => boolean;
  deleteEntry: (id: string) => boolean;
  getLatest: () => BodyTrackerEntry | null;
  getByMonth: (year: number, month: number) => BodyTrackerEntry[];
  refetch: () => void;
};

export function useBodyTracker(memberId: string): UseBodyTrackerReturn {
  const { data: entries = [], isLoading, mutate } = useSWR(
    memberId ? swrKeys.bodyTracker(memberId) : null,
    () => loadEntries(memberId),
    { revalidateOnFocus: false }
  );

  const stats = computeStats(entries);

  // 기록 추가
  const addEntry = useCallback(
    (entry: Omit<BodyTrackerEntry, "id" | "createdAt">) => {
      const newEntry: BodyTrackerEntry = {
        ...entry,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      const updated = [...entries, newEntry].sort((a, b) =>
        b.date.localeCompare(a.date)
      );
      saveEntries(memberId, updated);
      mutate(updated, false);
    },
    [memberId, entries, mutate]
  );

  // 기록 수정
  const updateEntry = useCallback(
    (
      id: string,
      updates: Partial<Omit<BodyTrackerEntry, "id" | "createdAt">>
    ): boolean => {
      const idx = entries.findIndex((e) => e.id === id);
      if (idx === -1) return false;

      const updated = entries.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      );
      const sorted = [...updated].sort((a, b) => b.date.localeCompare(a.date));
      saveEntries(memberId, sorted);
      mutate(sorted, false);
      return true;
    },
    [memberId, entries, mutate]
  );

  // 기록 삭제
  const deleteEntry = useCallback(
    (id: string): boolean => {
      const filtered = entries.filter((e) => e.id !== id);
      if (filtered.length === entries.length) return false;
      saveEntries(memberId, filtered);
      mutate(filtered, false);
      return true;
    },
    [memberId, entries, mutate]
  );

  // 가장 최근 기록 반환
  const getLatest = useCallback((): BodyTrackerEntry | null => {
    if (entries.length === 0) return null;
    return [...entries].sort((a, b) => b.date.localeCompare(a.date))[0];
  }, [entries]);

  // 특정 연월의 기록 반환
  const getByMonth = useCallback(
    (year: number, month: number): BodyTrackerEntry[] => {
      const prefix = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
      return entries.filter((e) => e.date.startsWith(prefix));
    },
    [entries]
  );

  return {
    entries,
    loading: isLoading,
    stats,
    addEntry,
    updateEntry,
    deleteEntry,
    getLatest,
    getByMonth,
    refetch: () => mutate(),
  };
}
