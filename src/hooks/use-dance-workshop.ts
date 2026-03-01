"use client";

import { useCallback, useState } from "react";
import { swrKeys } from "@/lib/swr/keys";
import type {
  DanceWorkshopData,
  DanceWorkshopEntry,
  DanceWorkshopLevel,
} from "@/types";

// ============================================================
// 상수
// ============================================================

export const WORKSHOP_LEVEL_LABELS: Record<DanceWorkshopLevel, string> = {
  beginner: "입문",
  intermediate: "중급",
  advanced: "고급",
  all_levels: "전 레벨",
};

export const WORKSHOP_LEVEL_ORDER: DanceWorkshopLevel[] = [
  "beginner",
  "intermediate",
  "advanced",
  "all_levels",
];

export const WORKSHOP_LEVEL_COLORS: Record<
  DanceWorkshopLevel,
  { badge: string; text: string; bar: string }
> = {
  beginner: {
    badge: "bg-green-100 text-green-700 border-green-300",
    text: "text-green-600",
    bar: "bg-green-500",
  },
  intermediate: {
    badge: "bg-blue-100 text-blue-700 border-blue-300",
    text: "text-blue-600",
    bar: "bg-blue-500",
  },
  advanced: {
    badge: "bg-purple-100 text-purple-700 border-purple-300",
    text: "text-purple-600",
    bar: "bg-purple-500",
  },
  all_levels: {
    badge: "bg-gray-100 text-gray-700 border-gray-300",
    text: "text-gray-600",
    bar: "bg-gray-400",
  },
};

export const SUGGESTED_WORKSHOP_GENRES = [
  "힙합",
  "팝핀",
  "왁킹",
  "하우스",
  "락킹",
  "크럼프",
  "브레이킹",
  "보깅",
  "재즈",
  "케이팝",
  "컨템포러리",
  "왈츠",
  "탱고",
  "살사",
];

// ============================================================
// localStorage 헬퍼
// ============================================================

function getStorageKey(memberId: string): string {
  return swrKeys.danceWorkshop(memberId);
}

function loadData(memberId: string): DanceWorkshopData {
  if (typeof window === "undefined") return { entries: [] };
  try {
    const raw = localStorage.getItem(getStorageKey(memberId));
    if (!raw) return { entries: [] };
    return JSON.parse(raw) as DanceWorkshopData;
  } catch {
    return { entries: [] };
  }
}

function saveData(memberId: string, data: DanceWorkshopData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(memberId), JSON.stringify(data));
  } catch {
    // 저장 실패 시 무시
  }
}

// ============================================================
// 훅
// ============================================================

export function useDanceWorkshop(memberId: string) {
  const [entries, setEntries] = useState<DanceWorkshopEntry[]>(() => loadData(memberId).entries);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    if (!memberId) {
      setLoading(false);
      return;
    }
    const data = loadData(memberId);
    setEntries(data.entries);
  }, [memberId]);

  // 내부 persist 헬퍼
  const persist = useCallback(
    (nextEntries: DanceWorkshopEntry[]) => {
      saveData(memberId, { entries: nextEntries });
      setEntries(nextEntries);
    },
    [memberId]
  );

  // ────────────────────────────────────────────
  // 워크숍 CRUD
  // ────────────────────────────────────────────

  /** 워크숍 추가 */
  const addEntry = useCallback(
    (params: {
      workshopName: string;
      instructor: string;
      venue: string;
      date: string;
      genre: string;
      level: DanceWorkshopLevel;
      cost: number;
      rating: number;
      notes: string;
    }): DanceWorkshopEntry => {
      const now = new Date().toISOString();
      const newEntry: DanceWorkshopEntry = {
        id: crypto.randomUUID(),
        memberId,
        workshopName: params.workshopName.trim(),
        instructor: params.instructor.trim(),
        venue: params.venue.trim(),
        date: params.date,
        genre: params.genre.trim(),
        level: params.level,
        cost: params.cost,
        rating: params.rating,
        notes: params.notes.trim(),
        createdAt: now,
        updatedAt: now,
      };
      persist([newEntry, ...entries]);
      return newEntry;
    },
    [memberId, entries, persist]
  );

  /** 워크숍 수정 */
  const updateEntry = useCallback(
    (
      entryId: string,
      patch: Partial<
        Pick<
          DanceWorkshopEntry,
          | "workshopName"
          | "instructor"
          | "venue"
          | "date"
          | "genre"
          | "level"
          | "cost"
          | "rating"
          | "notes"
        >
      >
    ): void => {
      const next = entries.map((e) =>
        e.id === entryId
          ? { ...e, ...patch, updatedAt: new Date().toISOString() }
          : e
      );
      persist(next);
    },
    [entries, persist]
  );

  /** 워크숍 삭제 */
  const deleteEntry = useCallback(
    (entryId: string): void => {
      persist(entries.filter((e) => e.id !== entryId));
    },
    [entries, persist]
  );

  // ────────────────────────────────────────────
  // 필터 / 통계
  // ────────────────────────────────────────────

  /** 장르 목록 (중복 제거) */
  const genres = Array.from(new Set(entries.map((e) => e.genre))).filter(Boolean);

  /** 장르별 필터링 */
  const filterByGenre = useCallback(
    (genre: string): DanceWorkshopEntry[] => {
      if (!genre || genre === "all") return entries;
      return entries.filter((e) => e.genre === genre);
    },
    [entries]
  );

  /** 총 비용 */
  const totalCost = entries.reduce((sum, e) => sum + (e.cost || 0), 0);

  /** 평균 평가 */
  const avgRating =
    entries.length === 0
      ? 0
      : Math.round((entries.reduce((sum, e) => sum + e.rating, 0) / entries.length) * 10) / 10;

  /** 레벨별 카운트 */
  const levelStats = WORKSHOP_LEVEL_ORDER.reduce<Record<DanceWorkshopLevel, number>>(
    (acc, lv) => {
      acc[lv] = entries.filter((e) => e.level === lv).length;
      return acc;
    },
    {} as Record<DanceWorkshopLevel, number>
  );

  return {
    entries,
    loading,
    genres,
    totalCost,
    avgRating,
    levelStats,
    addEntry,
    updateEntry,
    deleteEntry,
    filterByGenre,
    refetch: reload,
  };
}
