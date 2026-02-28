"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  DanceConditionJournalEntry,
  DanceConditionJournalData,
  DanceConditionMood,
} from "@/types";

// ============================================================
// 상수
// ============================================================

export const MOOD_LABELS: Record<DanceConditionMood, string> = {
  great: "최고",
  good: "좋음",
  neutral: "보통",
  tired: "피곤",
  bad: "나쁨",
};

export const MOOD_EMOJI: Record<DanceConditionMood, string> = {
  great: "😄",
  good: "😊",
  neutral: "😐",
  tired: "😴",
  bad: "😞",
};

export const MOOD_COLOR: Record<DanceConditionMood, string> = {
  great: "bg-yellow-100 text-yellow-700 border-yellow-200",
  good: "bg-green-100 text-green-700 border-green-200",
  neutral: "bg-blue-100 text-blue-700 border-blue-200",
  tired: "bg-purple-100 text-purple-700 border-purple-200",
  bad: "bg-red-100 text-red-700 border-red-200",
};

export const MOOD_LIST: DanceConditionMood[] = [
  "great",
  "good",
  "neutral",
  "tired",
  "bad",
];

export const BODY_PART_OPTIONS = [
  { value: "neck", label: "목" },
  { value: "shoulder", label: "어깨" },
  { value: "back", label: "등" },
  { value: "waist", label: "허리" },
  { value: "hip", label: "고관절" },
  { value: "knee", label: "무릎" },
  { value: "ankle", label: "발목" },
  { value: "wrist", label: "손목" },
  { value: "elbow", label: "팔꿈치" },
  { value: "calf", label: "종아리" },
  { value: "thigh", label: "허벅지" },
  { value: "foot", label: "발" },
];

// ============================================================
// localStorage 헬퍼
// ============================================================

function makeEmpty(memberId: string): DanceConditionJournalData {
  return {
    memberId,
    entries: [],
    updatedAt: new Date().toISOString(),
  };
}

function loadData(memberId: string): DanceConditionJournalData {
  if (typeof window === "undefined") return makeEmpty(memberId);
  try {
    const key = swrKeys.danceConditionLog(memberId);
    const raw = localStorage.getItem(key);
    if (!raw) return makeEmpty(memberId);
    return JSON.parse(raw) as DanceConditionJournalData;
  } catch {
    return makeEmpty(memberId);
  }
}

function saveData(data: DanceConditionJournalData): void {
  const key = swrKeys.danceConditionLog(data.memberId);
  localStorage.setItem(key, JSON.stringify(data));
}

// ============================================================
// 날짜 유틸
// ============================================================

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ============================================================
// 통계 타입
// ============================================================

export type ConditionStats = {
  totalEntries: number;
  averageEnergy: number;
  moodDistribution: Record<DanceConditionMood, number>;
  weeklyTrend: WeeklyTrendItem[];
  bodyPartFrequency: BodyPartFrequencyItem[];
};

export type WeeklyTrendItem = {
  label: string; // 예: "2주 전", "1주 전", "이번 주"
  weekStart: string; // YYYY-MM-DD
  avgEnergy: number;
  count: number;
};

export type BodyPartFrequencyItem = {
  part: string;
  label: string;
  count: number;
};

// ============================================================
// 훅
// ============================================================

export function useDanceConditionLog(memberId: string) {
  const { data, mutate } = useSWR(
    swrKeys.danceConditionLog(memberId),
    () => loadData(memberId),
    {
      fallbackData: makeEmpty(memberId),
      revalidateOnFocus: false,
    }
  );

  const journalData = data ?? makeEmpty(memberId);

  // ──────────────────────────────────────────
  // CRUD
  // ──────────────────────────────────────────

  /** 기록 추가 */
  const addEntry = useCallback(
    (payload: Omit<DanceConditionJournalEntry, "id" | "createdAt">) => {
      const newEntry: DanceConditionJournalEntry = {
        ...payload,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      const next: DanceConditionJournalData = {
        ...journalData,
        entries: [newEntry, ...journalData.entries].sort((a, b) =>
          b.date.localeCompare(a.date)
        ),
        updatedAt: new Date().toISOString(),
      };
      saveData(next);
      mutate(next, false);
    },
    [journalData, mutate]
  );

  /** 기록 수정 */
  const updateEntry = useCallback(
    (
      entryId: string,
      patch: Partial<Omit<DanceConditionJournalEntry, "id" | "createdAt">>
    ) => {
      const next: DanceConditionJournalData = {
        ...journalData,
        entries: journalData.entries.map((e) =>
          e.id === entryId ? { ...e, ...patch } : e
        ),
        updatedAt: new Date().toISOString(),
      };
      saveData(next);
      mutate(next, false);
    },
    [journalData, mutate]
  );

  /** 기록 삭제 */
  const deleteEntry = useCallback(
    (entryId: string) => {
      const next: DanceConditionJournalData = {
        ...journalData,
        entries: journalData.entries.filter((e) => e.id !== entryId),
        updatedAt: new Date().toISOString(),
      };
      saveData(next);
      mutate(next, false);
    },
    [journalData, mutate]
  );

  // ──────────────────────────────────────────
  // 통계
  // ──────────────────────────────────────────

  const getStats = useCallback((): ConditionStats => {
    const entries = journalData.entries;
    const totalEntries = entries.length;

    // 평균 에너지
    const averageEnergy =
      totalEntries > 0
        ? Math.round(
            (entries.reduce((s, e) => s + e.energyLevel, 0) / totalEntries) *
              10
          ) / 10
        : 0;

    // 기분 분포
    const moodDistribution: Record<DanceConditionMood, number> = {
      great: 0,
      good: 0,
      neutral: 0,
      tired: 0,
      bad: 0,
    };
    for (const e of entries) {
      moodDistribution[e.mood] = (moodDistribution[e.mood] ?? 0) + 1;
    }

    // 주간 트렌드 (최근 4주)
    const today = new Date();
    const weeklyTrend: WeeklyTrendItem[] = [];
    for (let w = 3; w >= 0; w--) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() - w * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const wsStr = toDateStr(weekStart);
      const weStr = toDateStr(weekEnd);

      const weekEntries = entries.filter(
        (e) => e.date >= wsStr && e.date <= weStr
      );

      const label =
        w === 0
          ? "이번 주"
          : w === 1
          ? "1주 전"
          : w === 2
          ? "2주 전"
          : "3주 전";

      weeklyTrend.push({
        label,
        weekStart: wsStr,
        avgEnergy:
          weekEntries.length > 0
            ? Math.round(
                (weekEntries.reduce((s, e) => s + e.energyLevel, 0) /
                  weekEntries.length) *
                  10
              ) / 10
            : 0,
        count: weekEntries.length,
      });
    }

    // 통증 부위 빈도
    const partCounter: Record<string, number> = {};
    for (const e of entries) {
      for (const part of e.bodyParts) {
        partCounter[part] = (partCounter[part] ?? 0) + 1;
      }
    }
    const bodyPartFrequency: BodyPartFrequencyItem[] = Object.entries(
      partCounter
    )
      .map(([part, count]) => ({
        part,
        label:
          BODY_PART_OPTIONS.find((o) => o.value === part)?.label ?? part,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalEntries,
      averageEnergy,
      moodDistribution,
      weeklyTrend,
      bodyPartFrequency,
    };
  }, [journalData.entries]);

  // ──────────────────────────────────────────
  // 파생 데이터
  // ──────────────────────────────────────────

  const todayStr = toDateStr(new Date());
  const todayEntry =
    journalData.entries.find((e) => e.date === todayStr) ?? null;

  return {
    journalData,
    entries: journalData.entries,
    todayEntry,
    addEntry,
    updateEntry,
    deleteEntry,
    getStats,
    refetch: () => mutate(),
  };
}
