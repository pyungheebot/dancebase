"use client";

import { useCallback, useState } from "react";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  DanceClassLogData,
  DanceClassLogEntry,
  DanceClassLogLevel,
  DanceClassLogSource,
} from "@/types";

// ============================================================
// 상수
// ============================================================

export const CLASS_LOG_LEVEL_LABELS: Record<DanceClassLogLevel, string> = {
  beginner: "입문",
  intermediate: "중급",
  advanced: "고급",
  all_levels: "전 레벨",
};

export const CLASS_LOG_LEVEL_ORDER: DanceClassLogLevel[] = [
  "beginner",
  "intermediate",
  "advanced",
  "all_levels",
];

export const CLASS_LOG_LEVEL_COLORS: Record<
  DanceClassLogLevel,
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

export const CLASS_LOG_SOURCE_LABELS: Record<DanceClassLogSource, string> = {
  internal: "그룹 내부",
  external: "외부 수강",
};

export const CLASS_LOG_SOURCE_COLORS: Record<
  DanceClassLogSource,
  { badge: string; text: string }
> = {
  internal: {
    badge: "bg-cyan-100 text-cyan-700 border-cyan-300",
    text: "text-cyan-600",
  },
  external: {
    badge: "bg-orange-100 text-orange-700 border-orange-300",
    text: "text-orange-600",
  },
};

export const SUGGESTED_CLASS_GENRES: string[] = [
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
  "살사",
  "왈츠",
  "탱고",
  "스윙",
];

// ============================================================
// localStorage 헬퍼
// ============================================================

function getStorageKey(memberId: string): string {
  return swrKeys.danceClassLog(memberId);
}

function makeEmpty(memberId: string): DanceClassLogData {
  return {
    memberId,
    entries: [],
    updatedAt: new Date().toISOString(),
  };
}

// ============================================================
// 통계 타입
// ============================================================

export type DanceClassLogStats = {
  total: number;
  totalDurationMin: number;
  avgRating: number;
  byGenre: Record<string, number>;
  byLevel: Record<DanceClassLogLevel, number>;
  bySource: Record<DanceClassLogSource, number>;
  /** 최근 30일 수업 수 */
  recentMonthCount: number;
  /** 등록된 강사 목록 */
  instructors: string[];
  /** 등록된 장르 목록 */
  genres: string[];
};

// ============================================================
// 훅
// ============================================================

export function useDanceClassLog(memberId: string) {
  const [data, setData] = useState<DanceClassLogData>(() =>
    makeEmpty(memberId)
  );

  // 상태 업데이트 + localStorage 동기화
  const updateData = useCallback(
    (updater: (prev: DanceClassLogData) => DanceClassLogData) => {
      setData((prev) => {
        const next = updater({ ...prev, updatedAt: new Date().toISOString() });
        saveToStorage(getStorageKey(memberId), next);
        return next;
      });
    },
    [memberId]
  );

  // ──────────────────────────────────────────
  // CRUD
  // ──────────────────────────────────────────

  /** 수업 기록 추가 */
  const addEntry = useCallback(
    (
      payload: Omit<DanceClassLogEntry, "id" | "createdAt" | "updatedAt">
    ): DanceClassLogEntry => {
      const now = new Date().toISOString();
      const newEntry: DanceClassLogEntry = {
        ...payload,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };
      updateData((prev) => ({
        ...prev,
        entries: [newEntry, ...prev.entries].sort((a, b) =>
          b.date.localeCompare(a.date)
        ),
      }));
      return newEntry;
    },
    [updateData]
  );

  /** 수업 기록 수정 */
  const updateEntry = useCallback(
    (
      entryId: string,
      patch: Partial<Omit<DanceClassLogEntry, "id" | "createdAt" | "memberId">>
    ) => {
      updateData((prev) => ({
        ...prev,
        entries: prev.entries
          .map((e) =>
            e.id === entryId
              ? { ...e, ...patch, updatedAt: new Date().toISOString() }
              : e
          )
          .sort((a, b) => b.date.localeCompare(a.date)),
      }));
    },
    [updateData]
  );

  /** 수업 기록 삭제 */
  const deleteEntry = useCallback(
    (entryId: string) => {
      updateData((prev) => ({
        ...prev,
        entries: prev.entries.filter((e) => e.id !== entryId),
      }));
    },
    [updateData]
  );

  // ──────────────────────────────────────────
  // 필터
  // ──────────────────────────────────────────

  /** 장르별 필터 */
  const getByGenre = useCallback(
    (genre: string): DanceClassLogEntry[] => {
      if (!genre || genre === "all") return data.entries;
      return data.entries.filter((e) => e.genre === genre);
    },
    [data.entries]
  );

  /** 강사별 필터 */
  const getByInstructor = useCallback(
    (instructor: string): DanceClassLogEntry[] => {
      if (!instructor || instructor === "all") return data.entries;
      return data.entries.filter((e) => e.instructor === instructor);
    },
    [data.entries]
  );

  /** 출처별 필터 */
  const getBySource = useCallback(
    (source: DanceClassLogSource | "all"): DanceClassLogEntry[] => {
      if (source === "all") return data.entries;
      return data.entries.filter((e) => e.source === source);
    },
    [data.entries]
  );

  /** 레벨별 필터 */
  const getByLevel = useCallback(
    (level: DanceClassLogLevel | "all"): DanceClassLogEntry[] => {
      if (level === "all") return data.entries;
      return data.entries.filter((e) => e.level === level);
    },
    [data.entries]
  );

  /** 월별 수업 수 (YYYY-MM 형식) */
  const getMonthlyCount = useCallback(
    (yearMonth: string): number =>
      data.entries.filter((e) => e.date.startsWith(yearMonth)).length,
    [data.entries]
  );

  // ──────────────────────────────────────────
  // 통계
  // ──────────────────────────────────────────

  const getStats = useCallback((): DanceClassLogStats => {
    const entries = data.entries;
    const total = entries.length;

    const totalDurationMin = entries.reduce(
      (sum, e) => sum + (e.durationMin ?? 0),
      0
    );

    const avgRating =
      total === 0
        ? 0
        : Math.round(
            (entries.reduce((sum, e) => sum + e.selfRating, 0) / total) * 10
          ) / 10;

    // 장르별 카운트
    const byGenre: Record<string, number> = {};
    entries.forEach((e) => {
      byGenre[e.genre] = (byGenre[e.genre] ?? 0) + 1;
    });

    // 레벨별 카운트
    const byLevel = CLASS_LOG_LEVEL_ORDER.reduce<
      Record<DanceClassLogLevel, number>
    >((acc, lv) => {
      acc[lv] = entries.filter((e) => e.level === lv).length;
      return acc;
    }, {} as Record<DanceClassLogLevel, number>);

    // 출처별 카운트
    const bySource: Record<DanceClassLogSource, number> = {
      internal: entries.filter((e) => e.source === "internal").length,
      external: entries.filter((e) => e.source === "external").length,
    };

    // 최근 30일
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoff = thirtyDaysAgo.toISOString().slice(0, 10);
    const recentMonthCount = entries.filter((e) => e.date >= cutoff).length;

    // 강사 목록 (중복 제거)
    const instructors = Array.from(
      new Set(entries.map((e) => e.instructor).filter(Boolean))
    ).sort();

    // 장르 목록 (중복 제거)
    const genres = Array.from(
      new Set(entries.map((e) => e.genre).filter(Boolean))
    ).sort();

    return {
      total,
      totalDurationMin,
      avgRating,
      byGenre,
      byLevel,
      bySource,
      recentMonthCount,
      instructors,
      genres,
    };
  }, [data.entries]);

  return {
    data,
    entries: data.entries,
    loading: false,
    addEntry,
    updateEntry,
    deleteEntry,
    getByGenre,
    getByInstructor,
    getBySource,
    getByLevel,
    getMonthlyCount,
    getStats,
    refetch: () => setData(loadFromStorage<DanceClassLogData>(getStorageKey(memberId), {} as DanceClassLogData)),
  };
}
