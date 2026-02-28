"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  DressCodeSet,
  DressCodeGuideItem,
  DressCodeCategory,
} from "@/types";

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(groupId: string, projectId: string): string {
  return `dancebase:dress-code:${groupId}:${projectId}`;
}

function loadData(groupId: string, projectId: string): DressCodeSet[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(groupId, projectId));
    if (!raw) return [];
    return JSON.parse(raw) as DressCodeSet[];
  } catch {
    return [];
  }
}

function saveData(
  groupId: string,
  projectId: string,
  data: DressCodeSet[]
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId, projectId), JSON.stringify(data));
  } catch {
    // 무시
  }
}

// ============================================================
// 통계 타입
// ============================================================

export type DressCodeStats = {
  totalSets: number;
  totalGuides: number;
  overallReadiness: number; // 0-100 퍼센트
};

export type DressCodeMemberReadiness = {
  memberName: string;
  readyCount: number;
  totalCount: number;
  percentage: number;
};

// ============================================================
// 훅
// ============================================================

export function useDressCode(groupId: string, projectId: string) {
  const [sets, setSets] = useState<DressCodeSet[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    if (!groupId || !projectId) return;
    const data = loadData(groupId, projectId);
    setSets(data);
    setLoading(false);
  }, [groupId, projectId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const persist = useCallback(
    (next: DressCodeSet[]) => {
      saveData(groupId, projectId, next);
      setSets(next);
    },
    [groupId, projectId]
  );

  // ── 세트(공연) CRUD ──────────────────────────────────────

  const addSet = useCallback(
    (performanceName: string): DressCodeSet => {
      const newSet: DressCodeSet = {
        id: crypto.randomUUID(),
        projectId,
        performanceName,
        guides: [],
        memberStatuses: [],
        createdAt: new Date().toISOString(),
      };
      persist([...sets, newSet]);
      return newSet;
    },
    [sets, persist, projectId]
  );

  const updateSet = useCallback(
    (setId: string, partial: Partial<Pick<DressCodeSet, "performanceName">>): boolean => {
      const idx = sets.findIndex((s) => s.id === setId);
      if (idx === -1) return false;
      const next = [...sets];
      next[idx] = { ...next[idx], ...partial };
      persist(next);
      return true;
    },
    [sets, persist]
  );

  const deleteSet = useCallback(
    (setId: string): boolean => {
      const next = sets.filter((s) => s.id !== setId);
      if (next.length === sets.length) return false;
      persist(next);
      return true;
    },
    [sets, persist]
  );

  // ── 가이드 항목 CRUD ─────────────────────────────────────

  const addGuide = useCallback(
    (
      setId: string,
      guide: Omit<DressCodeGuideItem, "id">
    ): DressCodeGuideItem | null => {
      const idx = sets.findIndex((s) => s.id === setId);
      if (idx === -1) return null;

      const newGuide: DressCodeGuideItem = {
        id: crypto.randomUUID(),
        ...guide,
      };

      const next = [...sets];
      next[idx] = {
        ...next[idx],
        guides: [...next[idx].guides, newGuide],
      };
      persist(next);
      return newGuide;
    },
    [sets, persist]
  );

  const updateGuide = useCallback(
    (
      setId: string,
      guideId: string,
      partial: Partial<Omit<DressCodeGuideItem, "id">>
    ): boolean => {
      const setIdx = sets.findIndex((s) => s.id === setId);
      if (setIdx === -1) return false;

      const guideIdx = sets[setIdx].guides.findIndex((g) => g.id === guideId);
      if (guideIdx === -1) return false;

      const next = [...sets];
      const updatedGuides = [...next[setIdx].guides];
      updatedGuides[guideIdx] = { ...updatedGuides[guideIdx], ...partial };
      next[setIdx] = { ...next[setIdx], guides: updatedGuides };
      persist(next);
      return true;
    },
    [sets, persist]
  );

  const deleteGuide = useCallback(
    (setId: string, guideId: string): boolean => {
      const setIdx = sets.findIndex((s) => s.id === setId);
      if (setIdx === -1) return false;

      const filtered = sets[setIdx].guides.filter((g) => g.id !== guideId);
      if (filtered.length === sets[setIdx].guides.length) return false;

      // 해당 가이드와 연결된 멤버 상태도 제거
      const filteredStatuses = sets[setIdx].memberStatuses.filter(
        (ms) => ms.itemId !== guideId
      );

      const next = [...sets];
      next[setIdx] = {
        ...next[setIdx],
        guides: filtered,
        memberStatuses: filteredStatuses,
      };
      persist(next);
      return true;
    },
    [sets, persist]
  );

  // ── 멤버 준비 상태 토글 ──────────────────────────────────

  const toggleMemberReady = useCallback(
    (setId: string, memberName: string, itemId: string): boolean => {
      const setIdx = sets.findIndex((s) => s.id === setId);
      if (setIdx === -1) return false;

      const next = [...sets];
      const currentStatuses = [...next[setIdx].memberStatuses];
      const statusIdx = currentStatuses.findIndex(
        (ms) => ms.memberName === memberName && ms.itemId === itemId
      );

      if (statusIdx === -1) {
        // 없으면 준비 완료 상태로 추가
        currentStatuses.push({
          memberName,
          itemId,
          isReady: true,
        });
      } else {
        // 있으면 토글
        currentStatuses[statusIdx] = {
          ...currentStatuses[statusIdx],
          isReady: !currentStatuses[statusIdx].isReady,
        };
      }

      next[setIdx] = { ...next[setIdx], memberStatuses: currentStatuses };
      persist(next);
      return true;
    },
    [sets, persist]
  );

  // ── 멤버별 준비율 계산 ───────────────────────────────────

  const getMemberReadiness = useCallback(
    (setId: string, memberNames: string[]): DressCodeMemberReadiness[] => {
      const set = sets.find((s) => s.id === setId);
      if (!set || memberNames.length === 0) return [];

      const totalGuides = set.guides.length;
      if (totalGuides === 0) return [];

      return memberNames.map((memberName) => {
        const readyCount = set.memberStatuses.filter(
          (ms) => ms.memberName === memberName && ms.isReady
        ).length;
        return {
          memberName,
          readyCount,
          totalCount: totalGuides,
          percentage: Math.round((readyCount / totalGuides) * 100),
        };
      });
    },
    [sets]
  );

  // ── 카테고리별 한글 라벨 ─────────────────────────────────

  const getCategoryLabel = useCallback((category: DressCodeCategory): string => {
    const labels: Record<DressCodeCategory, string> = {
      outfit: "의상",
      hair: "헤어",
      makeup: "메이크업",
      accessories: "악세사리",
      shoes: "신발",
    };
    return labels[category];
  }, []);

  // ── 전체 통계 ────────────────────────────────────────────

  const stats: DressCodeStats = (() => {
    const totalSets = sets.length;
    const totalGuides = sets.reduce((sum, s) => sum + s.guides.length, 0);

    // 전체 준비율: (모든 세트의 isReady=true 수) / (세트 x 가이드 수의 합)
    // memberStatuses에서 isReady=true인 항목 / 총 예상 체크 수
    const totalReadyStatuses = sets.reduce(
      (sum, s) => sum + s.memberStatuses.filter((ms) => ms.isReady).length,
      0
    );
    const totalStatuses = sets.reduce(
      (sum, s) => sum + s.memberStatuses.length,
      0
    );

    const overallReadiness =
      totalStatuses === 0
        ? 0
        : Math.round((totalReadyStatuses / totalStatuses) * 100);

    return { totalSets, totalGuides, overallReadiness };
  })();

  return {
    sets,
    loading,
    addSet,
    updateSet,
    deleteSet,
    addGuide,
    updateGuide,
    deleteGuide,
    toggleMemberReady,
    getMemberReadiness,
    getCategoryLabel,
    stats,
    refetch: reload,
  };
}
