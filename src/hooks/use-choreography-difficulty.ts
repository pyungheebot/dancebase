"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  ChoreographyDifficultyEntry,
  DifficultyCategory,
  DifficultyRating,
} from "@/types";

// ============================================
// 상수
// ============================================

export const MAX_ENTRIES = 20;

export const CATEGORY_LABELS: Record<DifficultyCategory, string> = {
  speed: "속도",
  complexity: "동작 복잡도",
  stamina: "체력 요구",
  expression: "표현력 난도",
  sync: "싱크로율 요구",
};

export const ALL_CATEGORIES: DifficultyCategory[] = [
  "speed",
  "complexity",
  "stamina",
  "expression",
  "sync",
];

// ============================================
// localStorage 헬퍼
// ============================================

function storageKey(groupId: string, projectId: string): string {
  return `dancebase:choreo-difficulty:${groupId}:${projectId}`;
}

function loadEntries(
  groupId: string,
  projectId: string
): ChoreographyDifficultyEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(groupId, projectId));
    if (!raw) return [];
    return JSON.parse(raw) as ChoreographyDifficultyEntry[];
  } catch {
    return [];
  }
}

function saveEntries(
  groupId: string,
  projectId: string,
  entries: ChoreographyDifficultyEntry[]
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      storageKey(groupId, projectId),
      JSON.stringify(entries)
    );
  } catch {
    // 무시
  }
}

// ============================================
// 평균 점수 계산
// ============================================

function calcAverage(ratings: DifficultyRating[]): number {
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, r) => acc + r.score, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
}

// ============================================
// 훅
// ============================================

export function useChoreographyDifficulty(
  groupId: string,
  projectId: string
) {
  const [entries, setEntries] = useState<ChoreographyDifficultyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    if (!groupId || !projectId) {
      setLoading(false);
      return;
    }
    const data = loadEntries(groupId, projectId);
    setEntries(data);
    setLoading(false);
  }, [groupId, projectId]);

  useEffect(() => {
    reload();
  }, [reload]);

  /** 평가 추가 — 최대 20개 초과 시 false 반환 */
  const addEntry = useCallback(
    (payload: {
      songTitle: string;
      ratings: DifficultyRating[];
      ratedBy: string;
      comment: string;
    }): boolean => {
      if (entries.length >= MAX_ENTRIES) return false;

      const newEntry: ChoreographyDifficultyEntry = {
        id: crypto.randomUUID(),
        projectId,
        songTitle: payload.songTitle.trim(),
        ratings: payload.ratings,
        averageScore: calcAverage(payload.ratings),
        ratedBy: payload.ratedBy.trim(),
        comment: payload.comment.trim(),
        createdAt: new Date().toISOString(),
      };

      const updated = [newEntry, ...entries];
      saveEntries(groupId, projectId, updated);
      setEntries(updated);
      return true;
    },
    [entries, groupId, projectId]
  );

  /** 평가 수정 */
  const updateEntry = useCallback(
    (
      id: string,
      patch: Partial<
        Pick<
          ChoreographyDifficultyEntry,
          "songTitle" | "ratings" | "ratedBy" | "comment"
        >
      >
    ): void => {
      const updated = entries.map((e) => {
        if (e.id !== id) return e;
        const nextRatings = patch.ratings ?? e.ratings;
        return {
          ...e,
          ...patch,
          ratings: nextRatings,
          averageScore: calcAverage(nextRatings),
        };
      });
      saveEntries(groupId, projectId, updated);
      setEntries(updated);
    },
    [entries, groupId, projectId]
  );

  /** 평가 삭제 */
  const deleteEntry = useCallback(
    (id: string): void => {
      const updated = entries.filter((e) => e.id !== id);
      saveEntries(groupId, projectId, updated);
      setEntries(updated);
    },
    [entries, groupId, projectId]
  );

  /** 항목별 평균 통계 (전체 평가 엔트리 기준) */
  const categoryStats = useCallback((): Record<DifficultyCategory, number> => {
    const result = {} as Record<DifficultyCategory, number>;

    for (const cat of ALL_CATEGORIES) {
      const scores = entries
        .flatMap((e) => e.ratings)
        .filter((r) => r.category === cat)
        .map((r) => r.score);

      result[cat] =
        scores.length > 0
          ? Math.round(
              (scores.reduce((a, b) => a + b, 0) / scores.length) * 10
            ) / 10
          : 0;
    }

    return result;
  }, [entries]);

  /** 전체 평균 난도 */
  const overallAverage = useCallback((): number => {
    if (entries.length === 0) return 0;
    const sum = entries.reduce((acc, e) => acc + e.averageScore, 0);
    return Math.round((sum / entries.length) * 10) / 10;
  }, [entries]);

  const canAdd = entries.length < MAX_ENTRIES;

  return {
    entries,
    loading,
    canAdd,
    addEntry,
    updateEntry,
    deleteEntry,
    categoryStats,
    overallAverage,
    reload,
  };
}
