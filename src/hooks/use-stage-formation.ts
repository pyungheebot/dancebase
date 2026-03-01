"use client";

import { useState, useCallback } from "react";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  StageFormationPosition,
  StageFormationScene,
  StageFormationData,
} from "@/types";

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(projectId: string): string {
  return swrKeys.stageFormation(projectId);
}

// ============================================================
// 통계 타입
// ============================================================

export type StageFormationStats = {
  /** 총 씬 수 */
  totalScenes: number;
  /** 전체 포지션 수 (모든 씬 합산) */
  totalPositions: number;
  /** 씬당 평균 포지션 수 */
  averagePositionsPerScene: number;
};

// ============================================================
// 훅
// ============================================================

export function useStageFormation(projectId: string) {
  const [data, setData] = useState<StageFormationData>(() =>
    loadFromStorage<StageFormationData>(storageKey(projectId), {} as StageFormationData)
  );

  const reload = useCallback(() => {
    if (!projectId) return;
    const loaded = loadFromStorage<StageFormationData>(storageKey(projectId), {} as StageFormationData);
    setData(loaded);
  }, [projectId]);

  const persist = useCallback(
    (updated: StageFormationData) => {
      const next: StageFormationData = {
        ...updated,
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(storageKey(projectId), next);
      setData(next);
    },
    [projectId]
  );

  // ──────────────────────────────────────────
  // 씬 CRUD
  // ──────────────────────────────────────────

  const addScene = useCallback(
    (params: {
      name: string;
      description?: string;
      durationSec?: number | null;
    }): StageFormationScene => {
      const sorted = [...data.scenes].sort((a, b) => a.order - b.order);
      const maxOrder =
        sorted.length > 0 ? sorted[sorted.length - 1].order : 0;
      const newScene: StageFormationScene = {
        id: crypto.randomUUID(),
        name: params.name,
        description: params.description ?? "",
        positions: [],
        order: maxOrder + 1,
        durationSec: params.durationSec ?? null,
      };
      persist({ ...data, scenes: [...data.scenes, newScene] });
      return newScene;
    },
    [data, persist]
  );

  const updateScene = useCallback(
    (
      sceneId: string,
      params: Partial<Omit<StageFormationScene, "id" | "positions">>
    ): boolean => {
      const idx = data.scenes.findIndex((s) => s.id === sceneId);
      if (idx === -1) return false;
      const updated = data.scenes.map((s) =>
        s.id === sceneId ? { ...s, ...params } : s
      );
      persist({ ...data, scenes: updated });
      return true;
    },
    [data, persist]
  );

  const deleteScene = useCallback(
    (sceneId: string): boolean => {
      const exists = data.scenes.some((s) => s.id === sceneId);
      if (!exists) return false;
      const filtered = data.scenes
        .filter((s) => s.id !== sceneId)
        .sort((a, b) => a.order - b.order)
        .map((s, idx) => ({ ...s, order: idx + 1 }));
      persist({ ...data, scenes: filtered });
      return true;
    },
    [data, persist]
  );

  const reorderScenes = useCallback(
    (sceneId: string, direction: "up" | "down"): boolean => {
      const sorted = [...data.scenes].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((s) => s.id === sceneId);
      if (idx === -1) return false;
      if (direction === "up" && idx === 0) return false;
      if (direction === "down" && idx === sorted.length - 1) return false;

      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      const newSorted = [...sorted];
      const tempOrder = newSorted[idx].order;
      newSorted[idx] = { ...newSorted[idx], order: newSorted[swapIdx].order };
      newSorted[swapIdx] = { ...newSorted[swapIdx], order: tempOrder };

      persist({ ...data, scenes: newSorted });
      return true;
    },
    [data, persist]
  );

  // ──────────────────────────────────────────
  // 포지션 CRUD (특정 씬 내)
  // ──────────────────────────────────────────

  const addPosition = useCallback(
    (
      sceneId: string,
      params: {
        memberName: string;
        x: number;
        y: number;
        color: string;
      }
    ): StageFormationPosition | null => {
      const scene = data.scenes.find((s) => s.id === sceneId);
      if (!scene) return null;

      const newPos: StageFormationPosition = {
        id: crypto.randomUUID(),
        memberName: params.memberName,
        x: Math.min(100, Math.max(0, params.x)),
        y: Math.min(100, Math.max(0, params.y)),
        color: params.color,
      };

      const updatedScenes = data.scenes.map((s) =>
        s.id === sceneId
          ? { ...s, positions: [...s.positions, newPos] }
          : s
      );
      persist({ ...data, scenes: updatedScenes });
      return newPos;
    },
    [data, persist]
  );

  const updatePosition = useCallback(
    (
      sceneId: string,
      positionId: string,
      params: Partial<Omit<StageFormationPosition, "id">>
    ): boolean => {
      const scene = data.scenes.find((s) => s.id === sceneId);
      if (!scene) return false;
      const posIdx = scene.positions.findIndex((p) => p.id === positionId);
      if (posIdx === -1) return false;

      const updatedPositions = scene.positions.map((p) =>
        p.id === positionId
          ? {
              ...p,
              ...params,
              x:
                params.x !== undefined
                  ? Math.min(100, Math.max(0, params.x))
                  : p.x,
              y:
                params.y !== undefined
                  ? Math.min(100, Math.max(0, params.y))
                  : p.y,
            }
          : p
      );

      const updatedScenes = data.scenes.map((s) =>
        s.id === sceneId ? { ...s, positions: updatedPositions } : s
      );
      persist({ ...data, scenes: updatedScenes });
      return true;
    },
    [data, persist]
  );

  const removePosition = useCallback(
    (sceneId: string, positionId: string): boolean => {
      const scene = data.scenes.find((s) => s.id === sceneId);
      if (!scene) return false;
      const exists = scene.positions.some((p) => p.id === positionId);
      if (!exists) return false;

      const updatedScenes = data.scenes.map((s) =>
        s.id === sceneId
          ? { ...s, positions: s.positions.filter((p) => p.id !== positionId) }
          : s
      );
      persist({ ...data, scenes: updatedScenes });
      return true;
    },
    [data, persist]
  );

  // ──────────────────────────────────────────
  // 무대 설정
  // ──────────────────────────────────────────

  const setStageSize = useCallback(
    (stageWidth: number, stageDepth: number) => {
      persist({ ...data, stageWidth, stageDepth });
    },
    [data, persist]
  );

  const setNotes = useCallback(
    (notes: string) => {
      persist({ ...data, notes });
    },
    [data, persist]
  );

  // ──────────────────────────────────────────
  // 통계
  // ──────────────────────────────────────────

  const stats: StageFormationStats = (() => {
    const totalScenes = data.scenes.length;
    const totalPositions = data.scenes.reduce(
      (acc, s) => acc + s.positions.length,
      0
    );
    const averagePositionsPerScene =
      totalScenes === 0
        ? 0
        : Math.round((totalPositions / totalScenes) * 10) / 10;
    return { totalScenes, totalPositions, averagePositionsPerScene };
  })();

  const sortedScenes = [...data.scenes].sort((a, b) => a.order - b.order);

  return {
    scenes: sortedScenes,
    stageWidth: data.stageWidth,
    stageDepth: data.stageDepth,
    notes: data.notes,
    loading: false,
    stats,
    addScene,
    updateScene,
    deleteScene,
    reorderScenes,
    addPosition,
    updatePosition,
    removePosition,
    setStageSize,
    setNotes,
    refetch: reload,
  };
}
