"use client";

import useSWR from "swr";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  MonthlyHighlight,
  MonthlyHighlightData,
  HighlightCategory,
} from "@/types";

// ============================================================
// localStorage 유틸리티
// ============================================================

function storageKey(groupId: string): string {
  return `dancebase:monthly-highlights:${groupId}`;
}

// ============================================================
// 통계 계산
// ============================================================

export type HighlightStats = {
  /** 이번 달 하이라이트 수 */
  thisMonthCount: number;
  /** 전체 하이라이트 수 */
  totalCount: number;
  /** 가장 많이 선정된 멤버 (이름, 횟수) */
  topMembers: Array<{ name: string; count: number }>;
  /** 카테고리별 분포 */
  categoryBreakdown: Partial<Record<HighlightCategory, number>>;
};

function computeStats(
  highlights: MonthlyHighlight[],
  currentYearMonth: string
): HighlightStats {
  const thisMonthHighlights = highlights.filter(
    (h) => h.yearMonth === currentYearMonth
  );

  // 멤버별 선정 횟수 집계 (전체 기간)
  const memberCount: Record<string, number> = {};
  for (const h of highlights) {
    for (const name of h.relatedMembers) {
      memberCount[name] = (memberCount[name] ?? 0) + 1;
    }
  }
  const topMembers = Object.entries(memberCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 카테고리별 분포 (전체 기간)
  const categoryBreakdown: Partial<Record<HighlightCategory, number>> = {};
  for (const h of highlights) {
    categoryBreakdown[h.category] =
      (categoryBreakdown[h.category] ?? 0) + 1;
  }

  return {
    thisMonthCount: thisMonthHighlights.length,
    totalCount: highlights.length,
    topMembers,
    categoryBreakdown,
  };
}

// ============================================================
// 훅
// ============================================================

export function useMonthlyHighlight(groupId: string) {
  const { data, mutate } = useSWR(
    groupId ? swrKeys.monthlyHighlights(groupId) : null,
    () => loadFromStorage<MonthlyHighlightData>(storageKey(groupId), {} as MonthlyHighlightData),
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  const highlights: MonthlyHighlight[] = useMemo(() => data?.highlights ?? [], [data?.highlights]);

  // 하이라이트 추가
  const addHighlight = useCallback(
    (input: {
      yearMonth: string;
      title: string;
      category: HighlightCategory;
      description: string;
      relatedMembers: string[];
      photoUrl?: string;
    }): boolean => {
      const current = loadFromStorage<MonthlyHighlightData>(storageKey(groupId), {} as MonthlyHighlightData);
      const newItem: MonthlyHighlight = {
        id: `hl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        yearMonth: input.yearMonth,
        title: input.title.trim(),
        category: input.category,
        description: input.description.trim(),
        relatedMembers: input.relatedMembers.filter((m) => m.trim() !== ""),
        photoUrl: input.photoUrl?.trim() || undefined,
        likes: [],
        createdAt: new Date().toISOString(),
      };
      const updated: MonthlyHighlightData = {
        groupId,
        highlights: [newItem, ...current.highlights],
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(storageKey(groupId), updated);
      mutate(updated, false);
      toast.success("하이라이트가 등록되었습니다.");
      return true;
    },
    [groupId, mutate]
  );

  // 하이라이트 삭제
  const deleteHighlight = useCallback(
    (id: string): void => {
      const current = loadFromStorage<MonthlyHighlightData>(storageKey(groupId), {} as MonthlyHighlightData);
      const updated: MonthlyHighlightData = {
        ...current,
        highlights: current.highlights.filter((h) => h.id !== id),
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(storageKey(groupId), updated);
      mutate(updated, false);
      toast.success("하이라이트가 삭제되었습니다.");
    },
    [groupId, mutate]
  );

  // 좋아요 토글
  const toggleLike = useCallback(
    (id: string, memberName: string): void => {
      if (!memberName.trim()) return;
      const current = loadFromStorage<MonthlyHighlightData>(storageKey(groupId), {} as MonthlyHighlightData);
      const updated: MonthlyHighlightData = {
        ...current,
        highlights: current.highlights.map((h) => {
          if (h.id !== id) return h;
          const alreadyLiked = h.likes.includes(memberName);
          return {
            ...h,
            likes: alreadyLiked
              ? h.likes.filter((l) => l !== memberName)
              : [...h.likes, memberName],
          };
        }),
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(storageKey(groupId), updated);
      mutate(updated, false);
    },
    [groupId, mutate]
  );

  // 월별 필터링
  const getHighlightsByMonth = useCallback(
    (yearMonth: string): MonthlyHighlight[] => {
      return highlights
        .filter((h) => h.yearMonth === yearMonth)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    },
    [highlights]
  );

  // 사용 가능한 월 목록 (중복 제거, 최신순)
  const availableMonths: string[] = Array.from(
    new Set(highlights.map((h) => h.yearMonth))
  ).sort((a, b) => b.localeCompare(a));

  // 통계
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const stats = computeStats(highlights, currentYearMonth);

  return {
    highlights,
    availableMonths,
    stats,
    addHighlight,
    deleteHighlight,
    toggleLike,
    getHighlightsByMonth,
    refetch: () => mutate(),
  };
}
