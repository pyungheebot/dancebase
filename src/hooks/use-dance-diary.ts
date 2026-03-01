"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { DiaryCardData, DiaryCardEntry, DiaryCardEmotion } from "@/types";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";

// ─── 로컬스토리지 헬퍼 ──────────────────────────────────────────────────────────

function loadDiaryData(memberId: string): DiaryCardData {
  return loadFromStorage<DiaryCardData>(
    `dance-diary-${memberId}`,
    { memberId, entries: [], updatedAt: new Date().toISOString() }
  );
}

function saveDiaryData(data: DiaryCardData): void {
  saveToStorage(`dance-diary-${data.memberId}`, data);
}

function generateId(): string {
  return `diary-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── 훅 ─────────────────────────────────────────────────────────────────────────

export function useDanceDiary(memberId: string) {
  const { data, isLoading, mutate } = useSWR(
    memberId ? swrKeys.danceDiary(memberId) : null,
    () => loadDiaryData(memberId),
    { revalidateOnFocus: false }
  );

  const entries = useMemo(() => data?.entries ?? [], [data?.entries]);

  // 최신순 정렬된 항목
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // 감정별 필터
  const getEntriesByEmotion = useCallback(
    (emotion: DiaryCardEmotion | "all") => {
      if (emotion === "all") return sortedEntries;
      return sortedEntries.filter((e) => e.emotion === emotion);
    },
    [sortedEntries]
  );

  // 일기 추가
  const addEntry = useCallback(
    (
      input: Omit<DiaryCardEntry, "id" | "memberId" | "createdAt" | "updatedAt">
    ): DiaryCardEntry => {
      const now = new Date().toISOString();
      const newEntry: DiaryCardEntry = {
        ...input,
        id: generateId(),
        memberId,
        createdAt: now,
        updatedAt: now,
      };
      const current = loadDiaryData(memberId);
      const updated: DiaryCardData = {
        ...current,
        entries: [...current.entries, newEntry],
        updatedAt: now,
      };
      saveDiaryData(updated);
      mutate(updated);
      return newEntry;
    },
    [memberId, mutate]
  );

  // 일기 수정
  const updateEntry = useCallback(
    (
      id: string,
      patch: Partial<Omit<DiaryCardEntry, "id" | "memberId" | "createdAt">>
    ): void => {
      const now = new Date().toISOString();
      const current = loadDiaryData(memberId);
      const updated: DiaryCardData = {
        ...current,
        entries: current.entries.map((e) =>
          e.id === id ? { ...e, ...patch, updatedAt: now } : e
        ),
        updatedAt: now,
      };
      saveDiaryData(updated);
      mutate(updated);
    },
    [memberId, mutate]
  );

  // 일기 삭제
  const deleteEntry = useCallback(
    (id: string): void => {
      const now = new Date().toISOString();
      const current = loadDiaryData(memberId);
      const updated: DiaryCardData = {
        ...current,
        entries: current.entries.filter((e) => e.id !== id),
        updatedAt: now,
      };
      saveDiaryData(updated);
      mutate(updated);
    },
    [memberId, mutate]
  );

  // 월별 히트맵 데이터: { [YYYY-MM-DD]: true }
  const getMonthHeatmap = useCallback(
    (year: number, month: number): Record<string, boolean> => {
      const result: Record<string, boolean> = {};
      entries.forEach((e) => {
        const d = new Date(e.date);
        if (d.getFullYear() === year && d.getMonth() + 1 === month) {
          result[e.date] = true;
        }
      });
      return result;
    },
    [entries]
  );

  // 감정 통계: 감정별 카운트
  const getEmotionStats = useCallback((): Record<DiaryCardEmotion, number> => {
    const stats: Record<DiaryCardEmotion, number> = {
      happy: 0,
      neutral: 0,
      sad: 0,
      passionate: 0,
      frustrated: 0,
    };
    entries.forEach((e) => {
      stats[e.emotion] = (stats[e.emotion] ?? 0) + 1;
    });
    return stats;
  }, [entries]);

  // 최근 30일 일별 평균 컨디션
  const getConditionTrend = useCallback((): { date: string; avg: number }[] => {
    const today = new Date();
    const result: { date: string; avg: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayEntries = entries.filter((e) => e.date === dateStr);
      if (dayEntries.length > 0) {
        const avg =
          dayEntries.reduce((sum, e) => sum + e.condition, 0) / dayEntries.length;
        result.push({ date: dateStr, avg: Math.round(avg * 10) / 10 });
      } else {
        result.push({ date: dateStr, avg: 0 });
      }
    }
    return result;
  }, [entries]);

  // 연속 작성 스트릭 계산
  const getStreak = useCallback((): number => {
    if (entries.length === 0) return 0;
    const writtenDates = new Set(entries.map((e) => e.date));
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      if (writtenDates.has(dateStr)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [entries]);

  return {
    entries: sortedEntries,
    loading: isLoading,
    refetch: () => mutate(),
    addEntry,
    updateEntry,
    deleteEntry,
    getEntriesByEmotion,
    getMonthHeatmap,
    getEmotionStats,
    getConditionTrend,
    getStreak,
  };
}
