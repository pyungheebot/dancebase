"use client";

import { useState, useCallback } from "react";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  StageRiskItem,
  StageRiskData,
  StageRiskCategory,
  StageRiskLevel,
  StageRiskResponseStatus,
} from "@/types";

// ============================================================
// 리스크 점수 → 레벨 계산
// ============================================================

export function calcRiskLevel(score: number): StageRiskLevel {
  if (score <= 4) return "low";
  if (score <= 9) return "medium";
  if (score <= 15) return "high";
  return "critical";
}

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(projectId: string): string {
  return swrKeys.stageRiskAssessment(projectId);
}

// ============================================================
// 통계 타입
// ============================================================

export type StageRiskStats = {
  /** 총 리스크 수 */
  total: number;
  /** 레벨별 분포 */
  levelDistribution: { level: StageRiskLevel; count: number }[];
  /** 미대응(pending) 수 */
  pendingCount: number;
  /** 대응중(in_progress) 수 */
  inProgressCount: number;
  /** 완료(done) 수 */
  doneCount: number;
  /** 평균 리스크 점수 */
  avgScore: number;
  /** 최고 위험 항목 */
  topRiskItem: StageRiskItem | null;
};

// ============================================================
// 훅
// ============================================================

export function useStageRisk(projectId: string) {
  const [items, setItems] = useState<StageRiskItem[]>(() => loadFromStorage<StageRiskData>(storageKey(projectId), {} as StageRiskData).items);

  const reload = useCallback(() => {
    if (!projectId) return;
    const data = loadFromStorage<StageRiskData>(storageKey(projectId), {} as StageRiskData);
    setItems(data.items);
  }, [projectId]);

  const persist = useCallback(
    (updated: StageRiskItem[]) => {
      const data: StageRiskData = {
        projectId,
        items: updated,
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(storageKey(projectId), data);
      setItems(updated);
    },
    [projectId]
  );

  // 리스크 항목 추가
  const addItem = useCallback(
    (params: {
      title: string;
      category: StageRiskCategory;
      likelihood: number;
      impact: number;
      mitigation: string;
      responseStatus: StageRiskResponseStatus;
    }): StageRiskItem => {
      const score = params.likelihood * params.impact;
      const level = calcRiskLevel(score);
      const now = new Date().toISOString();
      const newItem: StageRiskItem = {
        id: crypto.randomUUID(),
        title: params.title,
        category: params.category,
        likelihood: params.likelihood,
        impact: params.impact,
        score,
        level,
        mitigation: params.mitigation,
        responseStatus: params.responseStatus,
        createdAt: now,
        updatedAt: now,
      };
      persist([...items, newItem]);
      return newItem;
    },
    [items, persist]
  );

  // 리스크 항목 수정
  const updateItem = useCallback(
    (
      itemId: string,
      params: Partial<
        Omit<StageRiskItem, "id" | "score" | "level" | "createdAt">
      >
    ): boolean => {
      const idx = items.findIndex((i) => i.id === itemId);
      if (idx === -1) return false;

      const existing = items[idx];
      const likelihood = params.likelihood ?? existing.likelihood;
      const impact = params.impact ?? existing.impact;
      const score = likelihood * impact;
      const level = calcRiskLevel(score);

      const updated = items.map((i) =>
        i.id === itemId
          ? {
              ...i,
              ...params,
              likelihood,
              impact,
              score,
              level,
              updatedAt: new Date().toISOString(),
            }
          : i
      );
      persist(updated);
      return true;
    },
    [items, persist]
  );

  // 리스크 항목 삭제
  const deleteItem = useCallback(
    (itemId: string): boolean => {
      const exists = items.some((i) => i.id === itemId);
      if (!exists) return false;
      persist(items.filter((i) => i.id !== itemId));
      return true;
    },
    [items, persist]
  );

  // 대응 상태 변경
  const updateResponseStatus = useCallback(
    (itemId: string, status: StageRiskResponseStatus): boolean => {
      return updateItem(itemId, { responseStatus: status });
    },
    [updateItem]
  );

  // 통계 계산
  const stats: StageRiskStats = (() => {
    const LEVELS: StageRiskLevel[] = ["low", "medium", "high", "critical"];

    if (items.length === 0) {
      return {
        total: 0,
        levelDistribution: [],
        pendingCount: 0,
        inProgressCount: 0,
        doneCount: 0,
        avgScore: 0,
        topRiskItem: null,
      };
    }

    const levelDistribution = LEVELS.map((level) => ({
      level,
      count: items.filter((i) => i.level === level).length,
    })).filter((l) => l.count > 0);

    const pendingCount = items.filter(
      (i) => i.responseStatus === "pending"
    ).length;
    const inProgressCount = items.filter(
      (i) => i.responseStatus === "in_progress"
    ).length;
    const doneCount = items.filter((i) => i.responseStatus === "done").length;

    const avgScore =
      Math.round(
        (items.reduce((acc, i) => acc + i.score, 0) / items.length) * 10
      ) / 10;

    const topRiskItem = items.reduce(
      (top, i) => (i.score > (top?.score ?? 0) ? i : top),
      null as StageRiskItem | null
    );

    return {
      total: items.length,
      levelDistribution,
      pendingCount,
      inProgressCount,
      doneCount,
      avgScore,
      topRiskItem,
    };
  })();

  return {
    items,
    loading: false,
    stats,
    addItem,
    updateItem,
    deleteItem,
    updateResponseStatus,
    refetch: reload,
  };
}
