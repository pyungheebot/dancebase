"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { swrKeys } from "@/lib/swr/keys";
import type { MentalWellnessEntry } from "@/types";

// ============================================
// localStorage 키
// ============================================

function storageKey(memberId: string): string {
  return `dancebase:mental-wellness:${memberId}`;
}

// ============================================
// localStorage 헬퍼
// ============================================

function loadEntries(memberId: string): MentalWellnessEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(memberId));
    if (!raw) return [];
    return JSON.parse(raw) as MentalWellnessEntry[];
  } catch {
    return [];
  }
}

function saveEntries(
  memberId: string,
  entries: MentalWellnessEntry[]
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(memberId), JSON.stringify(entries));
  } catch {
    // localStorage 쓰기 실패 시 무시
  }
}

// ============================================
// 통계 계산
// ============================================

export type MoodDistribution = {
  great: number;
  good: number;
  okay: number;
  low: number;
  struggling: number;
};

export type MentalWellnessStats = {
  totalEntries: number;
  averageConfidence: number | null;
  averageStress: number | null;
  averageMotivation: number | null;
  averageAnxiety: number | null;
  moodDistribution: MoodDistribution;
};

function computeStats(entries: MentalWellnessEntry[]): MentalWellnessStats {
  const totalEntries = entries.length;

  const moodDistribution: MoodDistribution = {
    great: 0,
    good: 0,
    okay: 0,
    low: 0,
    struggling: 0,
  };

  if (totalEntries === 0) {
    return {
      totalEntries: 0,
      averageConfidence: null,
      averageStress: null,
      averageMotivation: null,
      averageAnxiety: null,
      moodDistribution,
    };
  }

  let sumConfidence = 0;
  let sumStress = 0;
  let sumMotivation = 0;
  let sumAnxiety = 0;

  for (const e of entries) {
    sumConfidence += e.confidence;
    sumStress += e.stress;
    sumMotivation += e.motivation;
    sumAnxiety += e.anxiety;
    moodDistribution[e.overallMood]++;
  }

  const round1 = (v: number) => Math.round(v * 10) / 10;

  return {
    totalEntries,
    averageConfidence: round1(sumConfidence / totalEntries),
    averageStress: round1(sumStress / totalEntries),
    averageMotivation: round1(sumMotivation / totalEntries),
    averageAnxiety: round1(sumAnxiety / totalEntries),
    moodDistribution,
  };
}

// ============================================
// 훅 반환 타입
// ============================================

type UseMentalWellnessReturn = {
  entries: MentalWellnessEntry[];
  loading: boolean;
  stats: MentalWellnessStats;
  addEntry: (entry: Omit<MentalWellnessEntry, "id" | "createdAt">) => void;
  updateEntry: (
    id: string,
    updates: Partial<Omit<MentalWellnessEntry, "id" | "createdAt">>
  ) => boolean;
  deleteEntry: (id: string) => boolean;
  getByMonth: (year: number, month: number) => MentalWellnessEntry[];
  refetch: () => void;
};

// ============================================
// 훅
// ============================================

export function useMentalWellness(memberId: string): UseMentalWellnessReturn {
  const {
    data: entries = [],
    isLoading,
    mutate,
  } = useSWR(
    memberId ? swrKeys.mentalWellness(memberId) : null,
    () => loadEntries(memberId),
    { revalidateOnFocus: false }
  );

  const stats = computeStats(entries);

  // 기록 추가
  const addEntry = useCallback(
    (entry: Omit<MentalWellnessEntry, "id" | "createdAt">) => {
      const newEntry: MentalWellnessEntry = {
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
      updates: Partial<Omit<MentalWellnessEntry, "id" | "createdAt">>
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

  // 특정 연월의 기록 반환
  const getByMonth = useCallback(
    (year: number, month: number): MentalWellnessEntry[] => {
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
    getByMonth,
    refetch: () => mutate(),
  };
}
