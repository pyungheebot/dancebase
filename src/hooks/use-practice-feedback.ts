"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { PracticeFeedbackEntry, PracticeFeedbackMood } from "@/types";

// ============================================
// localStorage 유틸
// ============================================

function storageKey(groupId: string): string {
  return `dancebase:practice-feedback:${groupId}`;
}

function loadEntries(groupId: string): PracticeFeedbackEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as PracticeFeedbackEntry[];
  } catch {
    return [];
  }
}

function saveEntries(groupId: string, entries: PracticeFeedbackEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId), JSON.stringify(entries));
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

// ============================================
// 훅
// ============================================

export function usePracticeFeedback(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.practiceFeedback(groupId),
    () => loadEntries(groupId),
    { fallbackData: [] }
  );

  const entries = useMemo(() => data ?? [], [data]);

  // 피드백 추가
  const addFeedback = useCallback(
    (params: {
      memberName: string;
      date: string;
      mood: PracticeFeedbackMood;
      energyLevel: number;
      focusLevel: number;
      enjoymentLevel: number;
      learnedToday?: string;
      wantToImprove?: string;
      generalComment?: string;
    }): boolean => {
      const current = loadEntries(groupId);
      const newEntry: PracticeFeedbackEntry = {
        id: crypto.randomUUID(),
        memberName: params.memberName,
        date: params.date,
        mood: params.mood,
        energyLevel: params.energyLevel,
        focusLevel: params.focusLevel,
        enjoymentLevel: params.enjoymentLevel,
        learnedToday: params.learnedToday,
        wantToImprove: params.wantToImprove,
        generalComment: params.generalComment,
        createdAt: new Date().toISOString(),
      };
      const updated = [newEntry, ...current];
      saveEntries(groupId, updated);
      mutate(updated, false);
      return true;
    },
    [groupId, mutate]
  );

  // 피드백 삭제
  const deleteFeedback = useCallback(
    (id: string): void => {
      const current = loadEntries(groupId);
      const updated = current.filter((e) => e.id !== id);
      saveEntries(groupId, updated);
      mutate(updated, false);
    },
    [groupId, mutate]
  );

  // 날짜별 필터
  const getByDate = useCallback(
    (date: string): PracticeFeedbackEntry[] => {
      return entries.filter((e) => e.date === date);
    },
    [entries]
  );

  // 멤버별 필터
  const getByMember = useCallback(
    (memberName: string): PracticeFeedbackEntry[] => {
      return entries.filter((e) => e.memberName === memberName);
    },
    [entries]
  );

  // 통계 계산
  const totalFeedbacks = entries.length;

  const averageEnergy =
    totalFeedbacks > 0
      ? entries.reduce((sum, e) => sum + e.energyLevel, 0) / totalFeedbacks
      : 0;

  const averageFocus =
    totalFeedbacks > 0
      ? entries.reduce((sum, e) => sum + e.focusLevel, 0) / totalFeedbacks
      : 0;

  const averageEnjoyment =
    totalFeedbacks > 0
      ? entries.reduce((sum, e) => sum + e.enjoymentLevel, 0) / totalFeedbacks
      : 0;

  const moodDistribution: Record<PracticeFeedbackMood, number> = {
    great: 0,
    good: 0,
    okay: 0,
    tired: 0,
    frustrated: 0,
  };
  for (const e of entries) {
    moodDistribution[e.mood] = (moodDistribution[e.mood] ?? 0) + 1;
  }

  return {
    entries,
    loading: isLoading,
    refetch: () => mutate(),
    addFeedback,
    deleteFeedback,
    getByDate,
    getByMember,
    totalFeedbacks,
    averageEnergy,
    averageFocus,
    averageEnjoyment,
    moodDistribution,
  };
}
