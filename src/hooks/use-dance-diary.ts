"use client";

import { useState, useEffect, useCallback } from "react";
import type { DanceDiaryEntry, DanceDiaryMood } from "@/types";

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(memberId: string): string {
  return `dancebase:dance-diary:${memberId}`;
}

function loadData(memberId: string): DanceDiaryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(memberId));
    if (!raw) return [];
    return JSON.parse(raw) as DanceDiaryEntry[];
  } catch {
    return [];
  }
}

function saveData(memberId: string, data: DanceDiaryEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(memberId), JSON.stringify(data));
  } catch {
    // 무시
  }
}

// ============================================================
// 통계 타입
// ============================================================

export type DanceDiaryStats = {
  totalEntries: number;
  averageRating: number;
  moodDistribution: Record<DanceDiaryMood, number>;
  totalPracticeHours: number;
  streakDays: number; // 연속 기록일
};

// ============================================================
// 연속 기록일 계산
// ============================================================

function calcStreakDays(entries: DanceDiaryEntry[]): number {
  if (entries.length === 0) return 0;

  const dateSet = new Set(entries.map((e) => e.date));
  const today = new Date();

  let streak = 0;
  let cursor = new Date(today);

  // 오늘 포함 여부 확인, 없으면 어제부터 시작
  const todayStr = cursor.toISOString().slice(0, 10);
  if (!dateSet.has(todayStr)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (true) {
    const dateStr = cursor.toISOString().slice(0, 10);
    if (!dateSet.has(dateStr)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

// ============================================================
// 훅
// ============================================================

export function useDanceDiary(memberId: string) {
  const [entries, setEntries] = useState<DanceDiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    if (!memberId) return;
    const data = loadData(memberId);
    // 날짜 내림차순 정렬
    data.sort((a, b) => b.date.localeCompare(a.date));
    setEntries(data);
    setLoading(false);
  }, [memberId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const persist = useCallback(
    (next: DanceDiaryEntry[]) => {
      const sorted = [...next].sort((a, b) => b.date.localeCompare(a.date));
      saveData(memberId, sorted);
      setEntries(sorted);
    },
    [memberId]
  );

  // 항목 추가
  const addEntry = useCallback(
    (
      input: Omit<DanceDiaryEntry, "id" | "createdAt">
    ): DanceDiaryEntry => {
      const entry: DanceDiaryEntry = {
        ...input,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      persist([...entries, entry]);
      return entry;
    },
    [entries, persist]
  );

  // 항목 수정
  const updateEntry = useCallback(
    (
      id: string,
      patch: Partial<Omit<DanceDiaryEntry, "id" | "createdAt">>
    ): boolean => {
      const idx = entries.findIndex((e) => e.id === id);
      if (idx === -1) return false;
      const next = entries.map((e) =>
        e.id === id ? { ...e, ...patch } : e
      );
      persist(next);
      return true;
    },
    [entries, persist]
  );

  // 항목 삭제
  const deleteEntry = useCallback(
    (id: string): boolean => {
      const next = entries.filter((e) => e.id !== id);
      if (next.length === entries.length) return false;
      persist(next);
      return true;
    },
    [entries, persist]
  );

  // 월별 조회
  const getEntriesByMonth = useCallback(
    (year: number, month: number): DanceDiaryEntry[] => {
      const prefix = `${year}-${String(month).padStart(2, "0")}`;
      return entries.filter((e) => e.date.startsWith(prefix));
    },
    [entries]
  );

  // 통계 계산
  const stats: DanceDiaryStats = (() => {
    const totalEntries = entries.length;
    const totalPracticeHours = entries.reduce(
      (s, e) => s + (e.practiceHours ?? 0),
      0
    );
    const averageRating =
      totalEntries > 0
        ? Math.round(
            (entries.reduce((s, e) => s + e.rating, 0) / totalEntries) * 10
          ) / 10
        : 0;

    const allMoods: DanceDiaryMood[] = [
      "great",
      "good",
      "neutral",
      "tired",
      "frustrated",
    ];
    const moodDistribution = allMoods.reduce(
      (acc, mood) => {
        acc[mood] = entries.filter((e) => e.mood === mood).length;
        return acc;
      },
      {} as Record<DanceDiaryMood, number>
    );

    const streakDays = calcStreakDays(entries);

    return {
      totalEntries,
      averageRating,
      moodDistribution,
      totalPracticeHours,
      streakDays,
    };
  })();

  return {
    entries,
    loading,
    addEntry,
    updateEntry,
    deleteEntry,
    getEntriesByMonth,
    stats,
    refetch: reload,
  };
}
