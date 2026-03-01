"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  GroupPracticeFeedbackEntry,
  GroupPracticeFeedbackData,
} from "@/types";

// ============================================================
// 통계 타입
// ============================================================

export type GroupPracticeFeedbackStats = {
  /** 총 피드백 수 */
  totalEntries: number;
  /** 별점 평균 (0이면 데이터 없음) */
  averageRating: number;
  /** 최근 5개 피드백 */
  recentEntries: GroupPracticeFeedbackEntry[];
  /** 별점 트렌드 (날짜순, 날짜-평균별점 쌍) */
  ratingTrend: { date: string; avgRating: number }[];
};

// ============================================================
// 통계 계산
// ============================================================

function calcStats(
  entries: GroupPracticeFeedbackEntry[]
): GroupPracticeFeedbackStats {
  const totalEntries = entries.length;

  const averageRating =
    totalEntries > 0
      ? entries.reduce((sum, e) => sum + e.rating, 0) / totalEntries
      : 0;

  // 최신순 정렬 후 5개
  const recentEntries = [...entries]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  // 날짜별 평균 별점 트렌드 (오래된 순)
  const dateMap: Record<string, number[]> = {};
  for (const e of entries) {
    if (!dateMap[e.practiceDate]) dateMap[e.practiceDate] = [];
    dateMap[e.practiceDate].push(e.rating);
  }
  const ratingTrend = Object.entries(dateMap)
    .map(([date, ratings]) => ({
      date,
      avgRating:
        Math.round(
          (ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10
        ) / 10,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return { totalEntries, averageRating, recentEntries, ratingTrend };
}

// ============================================================
// 훅
// ============================================================

export function useGroupPracticeFeedback(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.groupPracticeFeedback(groupId),
    () => loadFromStorage<GroupPracticeFeedbackData>(swrKeys.groupPracticeFeedback(groupId), {} as GroupPracticeFeedbackData),
    { fallbackData: { groupId, entries: [], updatedAt: "" } }
  );

  const entries: GroupPracticeFeedbackEntry[] = useMemo(() => data?.entries ?? [], [data?.entries]);

  // 내부 persist 헬퍼
  const persist = useCallback(
    (nextEntries: GroupPracticeFeedbackEntry[]) => {
      const next: GroupPracticeFeedbackData = {
        groupId,
        entries: nextEntries,
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(swrKeys.groupPracticeFeedback(groupId), next);
      mutate(next, false);
    },
    [groupId, mutate]
  );

  // ────────────────────────────────────────────
  // CRUD
  // ────────────────────────────────────────────

  /** 피드백 추가 */
  const addEntry = useCallback(
    (
      params: Omit<GroupPracticeFeedbackEntry, "id" | "createdAt">
    ): GroupPracticeFeedbackEntry => {
      const newEntry: GroupPracticeFeedbackEntry = {
        ...params,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      const current = loadFromStorage<GroupPracticeFeedbackData>(swrKeys.groupPracticeFeedback(groupId), {} as GroupPracticeFeedbackData).entries;
      persist([newEntry, ...current]);
      return newEntry;
    },
    [groupId, persist]
  );

  /** 피드백 수정 */
  const updateEntry = useCallback(
    (
      entryId: string,
      patch: Partial<Omit<GroupPracticeFeedbackEntry, "id" | "createdAt">>
    ): void => {
      const current = loadFromStorage<GroupPracticeFeedbackData>(swrKeys.groupPracticeFeedback(groupId), {} as GroupPracticeFeedbackData).entries;
      const next = current.map((e) =>
        e.id === entryId ? { ...e, ...patch } : e
      );
      persist(next);
    },
    [groupId, persist]
  );

  /** 피드백 삭제 */
  const deleteEntry = useCallback(
    (entryId: string): void => {
      const current = loadFromStorage<GroupPracticeFeedbackData>(swrKeys.groupPracticeFeedback(groupId), {} as GroupPracticeFeedbackData).entries;
      persist(current.filter((e) => e.id !== entryId));
    },
    [groupId, persist]
  );

  // ────────────────────────────────────────────
  // 통계
  // ────────────────────────────────────────────

  const stats = useMemo(() => calcStats(entries), [entries]);

  // 날짜 목록 (최신순, 중복 제거)
  const uniqueDates = useMemo(() => {
    return [...new Set(entries.map((e) => e.practiceDate))].sort().reverse();
  }, [entries]);

  return {
    entries,
    loading: isLoading,
    refetch: () => mutate(),
    addEntry,
    updateEntry,
    deleteEntry,
    uniqueDates,
    totalEntries: stats.totalEntries,
    averageRating: stats.averageRating,
    recentEntries: stats.recentEntries,
    ratingTrend: stats.ratingTrend,
  };
}
