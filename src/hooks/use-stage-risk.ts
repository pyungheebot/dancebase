"use client";

import { useState, useEffect, useCallback } from "react";
import type { StageRiskItem, StageRiskMitigation, StageRiskLevel, StageRiskCategory } from "@/types";

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(groupId: string, projectId: string): string {
  return `dancebase:stage-risk:${groupId}:${projectId}`;
}

function loadData(groupId: string, projectId: string): StageRiskItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(groupId, projectId));
    if (!raw) return [];
    return JSON.parse(raw) as StageRiskItem[];
  } catch {
    return [];
  }
}

function saveData(
  groupId: string,
  projectId: string,
  data: StageRiskItem[]
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

export type StageRiskStats = {
  totalRisks: number;
  unresolvedRisks: number;
  criticalRisks: number;
  mitigationCompletionRate: number;
};

// ============================================================
// 훅
// ============================================================

export function useStageRisk(groupId: string, projectId: string) {
  const [risks, setRisks] = useState<StageRiskItem[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    if (!groupId || !projectId) return;
    const data = loadData(groupId, projectId);
    setRisks(data);
    setLoading(false);
  }, [groupId, projectId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const persist = useCallback(
    (next: StageRiskItem[]) => {
      saveData(groupId, projectId, next);
      setRisks(next);
    },
    [groupId, projectId]
  );

  // ── 리스크 CRUD ───────────────────────────────────────────

  const addRisk = useCallback(
    (
      partial: Omit<StageRiskItem, "id" | "mitigations" | "isResolved" | "createdAt">
    ): StageRiskItem => {
      const newRisk: StageRiskItem = {
        id: crypto.randomUUID(),
        mitigations: [],
        isResolved: false,
        createdAt: new Date().toISOString(),
        ...partial,
      };
      const next = [...risks, newRisk];
      persist(next);
      return newRisk;
    },
    [risks, persist]
  );

  const updateRisk = useCallback(
    (
      riskId: string,
      partial: Partial<Omit<StageRiskItem, "id" | "mitigations" | "createdAt">>
    ): boolean => {
      const idx = risks.findIndex((r) => r.id === riskId);
      if (idx === -1) return false;
      const next = [...risks];
      next[idx] = { ...next[idx], ...partial };
      persist(next);
      return true;
    },
    [risks, persist]
  );

  const deleteRisk = useCallback(
    (riskId: string): boolean => {
      const next = risks.filter((r) => r.id !== riskId);
      if (next.length === risks.length) return false;
      persist(next);
      return true;
    },
    [risks, persist]
  );

  const toggleResolved = useCallback(
    (riskId: string): boolean => {
      const idx = risks.findIndex((r) => r.id === riskId);
      if (idx === -1) return false;
      const next = [...risks];
      next[idx] = { ...next[idx], isResolved: !next[idx].isResolved };
      persist(next);
      return true;
    },
    [risks, persist]
  );

  // ── 대응 조치 CRUD ────────────────────────────────────────

  const addMitigation = useCallback(
    (
      riskId: string,
      partial: Omit<StageRiskMitigation, "id" | "isCompleted">
    ): StageRiskMitigation | null => {
      const riskIdx = risks.findIndex((r) => r.id === riskId);
      if (riskIdx === -1) return null;

      const newMitigation: StageRiskMitigation = {
        id: crypto.randomUUID(),
        isCompleted: false,
        ...partial,
      };

      const next = [...risks];
      next[riskIdx] = {
        ...next[riskIdx],
        mitigations: [...next[riskIdx].mitigations, newMitigation],
      };
      persist(next);
      return newMitigation;
    },
    [risks, persist]
  );

  const updateMitigation = useCallback(
    (
      riskId: string,
      mitigationId: string,
      partial: Partial<Omit<StageRiskMitigation, "id">>
    ): boolean => {
      const riskIdx = risks.findIndex((r) => r.id === riskId);
      if (riskIdx === -1) return false;

      const mitIdx = risks[riskIdx].mitigations.findIndex((m) => m.id === mitigationId);
      if (mitIdx === -1) return false;

      const next = [...risks];
      const updatedMitigations = [...next[riskIdx].mitigations];
      updatedMitigations[mitIdx] = { ...updatedMitigations[mitIdx], ...partial };
      next[riskIdx] = { ...next[riskIdx], mitigations: updatedMitigations };
      persist(next);
      return true;
    },
    [risks, persist]
  );

  const deleteMitigation = useCallback(
    (riskId: string, mitigationId: string): boolean => {
      const riskIdx = risks.findIndex((r) => r.id === riskId);
      if (riskIdx === -1) return false;

      const filtered = risks[riskIdx].mitigations.filter((m) => m.id !== mitigationId);
      if (filtered.length === risks[riskIdx].mitigations.length) return false;

      const next = [...risks];
      next[riskIdx] = { ...next[riskIdx], mitigations: filtered };
      persist(next);
      return true;
    },
    [risks, persist]
  );

  const toggleMitigation = useCallback(
    (riskId: string, mitigationId: string): boolean => {
      const riskIdx = risks.findIndex((r) => r.id === riskId);
      if (riskIdx === -1) return false;

      const mitIdx = risks[riskIdx].mitigations.findIndex((m) => m.id === mitigationId);
      if (mitIdx === -1) return false;

      const next = [...risks];
      const updatedMitigations = [...next[riskIdx].mitigations];
      updatedMitigations[mitIdx] = {
        ...updatedMitigations[mitIdx],
        isCompleted: !updatedMitigations[mitIdx].isCompleted,
      };
      next[riskIdx] = { ...next[riskIdx], mitigations: updatedMitigations };
      persist(next);
      return true;
    },
    [risks, persist]
  );

  // ── 통계 ──────────────────────────────────────────────────

  const stats: StageRiskStats = (() => {
    const totalRisks = risks.length;
    const unresolvedRisks = risks.filter((r) => !r.isResolved).length;
    const criticalRisks = risks.filter((r) => r.level === "critical" && !r.isResolved).length;

    const allMitigations = risks.flatMap((r) => r.mitigations);
    const completedMitigations = allMitigations.filter((m) => m.isCompleted).length;
    const mitigationCompletionRate =
      allMitigations.length === 0
        ? 0
        : Math.round((completedMitigations / allMitigations.length) * 100);

    return { totalRisks, unresolvedRisks, criticalRisks, mitigationCompletionRate };
  })();

  return {
    risks,
    loading,
    addRisk,
    updateRisk,
    deleteRisk,
    toggleResolved,
    addMitigation,
    updateMitigation,
    deleteMitigation,
    toggleMitigation,
    stats,
    refetch: reload,
  };
}
