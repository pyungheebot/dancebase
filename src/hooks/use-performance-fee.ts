"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  PerformanceFeeData,
  PerformanceFeeEntry,
  PerformanceFeeRole,
  PerformanceFeeStatus,
  PerformanceFeeAdjustment,
  PerformanceFeeAdjustmentType,
} from "@/types";

// ============================================
// localStorage 유틸
// ============================================

function storageKey(groupId: string, projectId: string): string {
  return `dancebase:performance-fee:${groupId}:${projectId}`;
}

function loadData(groupId: string, projectId: string): PerformanceFeeData {
  if (typeof window === "undefined") {
    return { groupId, projectId, entries: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(storageKey(groupId, projectId));
    if (!raw) {
      return { groupId, projectId, entries: [], updatedAt: new Date().toISOString() };
    }
    return JSON.parse(raw) as PerformanceFeeData;
  } catch {
    return { groupId, projectId, entries: [], updatedAt: new Date().toISOString() };
  }
}

function saveData(data: PerformanceFeeData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      storageKey(data.groupId, data.projectId),
      JSON.stringify(data)
    );
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

// ============================================
// 최종 금액 계산 유틸
// ============================================

function calcFinalAmount(
  baseFee: number,
  adjustments: PerformanceFeeAdjustment[]
): number {
  const total = adjustments.reduce((sum, adj) => sum + adj.amount, 0);
  return baseFee + total;
}

// ============================================
// 훅
// ============================================

export function usePerformanceFee(groupId: string, projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.performanceFee(groupId, projectId),
    () => loadData(groupId, projectId),
    {
      fallbackData: {
        groupId,
        projectId,
        entries: [],
        updatedAt: new Date().toISOString(),
      },
    }
  );

  const entries: PerformanceFeeEntry[] = data?.entries ?? [];

  // 멤버 추가
  const addEntry = useCallback(
    (params: {
      memberName: string;
      role: PerformanceFeeRole;
      baseFee: number;
      notes?: string;
    }): PerformanceFeeEntry => {
      const current = loadData(groupId, projectId);
      const now = new Date().toISOString();
      const newEntry: PerformanceFeeEntry = {
        id: crypto.randomUUID(),
        memberName: params.memberName,
        role: params.role,
        baseFee: params.baseFee,
        adjustments: [],
        finalAmount: params.baseFee,
        status: "pending",
        notes: params.notes?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };
      const updated: PerformanceFeeData = {
        ...current,
        entries: [newEntry, ...current.entries],
        updatedAt: now,
      };
      saveData(updated);
      mutate(updated, false);
      return newEntry;
    },
    [groupId, projectId, mutate]
  );

  // 멤버 정보 수정
  const updateEntry = useCallback(
    (
      entryId: string,
      params: Partial<{
        memberName: string;
        role: PerformanceFeeRole;
        baseFee: number;
        notes: string;
      }>
    ): boolean => {
      const current = loadData(groupId, projectId);
      const idx = current.entries.findIndex((e) => e.id === entryId);
      if (idx === -1) return false;

      const existing = current.entries[idx];
      const updatedEntry: PerformanceFeeEntry = {
        ...existing,
        ...params,
        finalAmount: calcFinalAmount(
          params.baseFee ?? existing.baseFee,
          existing.adjustments
        ),
        updatedAt: new Date().toISOString(),
      };

      const updatedEntries = [...current.entries];
      updatedEntries[idx] = updatedEntry;

      const updated: PerformanceFeeData = {
        ...current,
        entries: updatedEntries,
        updatedAt: new Date().toISOString(),
      };
      saveData(updated);
      mutate(updated, false);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // 멤버 삭제
  const deleteEntry = useCallback(
    (entryId: string): boolean => {
      const current = loadData(groupId, projectId);
      const exists = current.entries.some((e) => e.id === entryId);
      if (!exists) return false;

      const updated: PerformanceFeeData = {
        ...current,
        entries: current.entries.filter((e) => e.id !== entryId),
        updatedAt: new Date().toISOString(),
      };
      saveData(updated);
      mutate(updated, false);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // 수당/공제 항목 추가
  const addAdjustment = useCallback(
    (
      entryId: string,
      params: {
        type: PerformanceFeeAdjustmentType;
        label: string;
        amount: number;
      }
    ): boolean => {
      const current = loadData(groupId, projectId);
      const idx = current.entries.findIndex((e) => e.id === entryId);
      if (idx === -1) return false;

      const newAdj: PerformanceFeeAdjustment = {
        id: crypto.randomUUID(),
        type: params.type,
        label: params.label,
        amount: params.amount,
      };

      const existing = current.entries[idx];
      const updatedAdjustments = [...existing.adjustments, newAdj];
      const updatedEntry: PerformanceFeeEntry = {
        ...existing,
        adjustments: updatedAdjustments,
        finalAmount: calcFinalAmount(existing.baseFee, updatedAdjustments),
        updatedAt: new Date().toISOString(),
      };

      const updatedEntries = [...current.entries];
      updatedEntries[idx] = updatedEntry;

      const updated: PerformanceFeeData = {
        ...current,
        entries: updatedEntries,
        updatedAt: new Date().toISOString(),
      };
      saveData(updated);
      mutate(updated, false);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // 수당/공제 항목 삭제
  const deleteAdjustment = useCallback(
    (entryId: string, adjustmentId: string): boolean => {
      const current = loadData(groupId, projectId);
      const idx = current.entries.findIndex((e) => e.id === entryId);
      if (idx === -1) return false;

      const existing = current.entries[idx];
      const updatedAdjustments = existing.adjustments.filter(
        (a) => a.id !== adjustmentId
      );
      const updatedEntry: PerformanceFeeEntry = {
        ...existing,
        adjustments: updatedAdjustments,
        finalAmount: calcFinalAmount(existing.baseFee, updatedAdjustments),
        updatedAt: new Date().toISOString(),
      };

      const updatedEntries = [...current.entries];
      updatedEntries[idx] = updatedEntry;

      const updated: PerformanceFeeData = {
        ...current,
        entries: updatedEntries,
        updatedAt: new Date().toISOString(),
      };
      saveData(updated);
      mutate(updated, false);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // 정산 완료 처리
  const settleEntry = useCallback(
    (entryId: string, settledAt?: string): boolean => {
      const current = loadData(groupId, projectId);
      const idx = current.entries.findIndex((e) => e.id === entryId);
      if (idx === -1) return false;

      const existing = current.entries[idx];
      const updatedEntry: PerformanceFeeEntry = {
        ...existing,
        status: "settled" as PerformanceFeeStatus,
        settledAt: settledAt ?? new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString(),
      };

      const updatedEntries = [...current.entries];
      updatedEntries[idx] = updatedEntry;

      const updated: PerformanceFeeData = {
        ...current,
        entries: updatedEntries,
        updatedAt: new Date().toISOString(),
      };
      saveData(updated);
      mutate(updated, false);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // 정산 취소 (미정산 상태로 되돌리기)
  const unsettleEntry = useCallback(
    (entryId: string): boolean => {
      const current = loadData(groupId, projectId);
      const idx = current.entries.findIndex((e) => e.id === entryId);
      if (idx === -1) return false;

      const existing = current.entries[idx];
      const { settledAt: _removed, ...rest } = existing;
      const updatedEntry: PerformanceFeeEntry = {
        ...rest,
        status: "pending" as PerformanceFeeStatus,
        updatedAt: new Date().toISOString(),
      };

      const updatedEntries = [...current.entries];
      updatedEntries[idx] = updatedEntry;

      const updated: PerformanceFeeData = {
        ...current,
        entries: updatedEntries,
        updatedAt: new Date().toISOString(),
      };
      saveData(updated);
      mutate(updated, false);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // 통계 계산
  const stats = (() => {
    const totalCount = entries.length;
    const settledCount = entries.filter((e) => e.status === "settled").length;
    const pendingCount = totalCount - settledCount;
    const totalAmount = entries.reduce((s, e) => s + e.finalAmount, 0);
    const settledAmount = entries
      .filter((e) => e.status === "settled")
      .reduce((s, e) => s + e.finalAmount, 0);
    const pendingAmount = totalAmount - settledAmount;
    return { totalCount, settledCount, pendingCount, totalAmount, settledAmount, pendingAmount };
  })();

  return {
    entries,
    loading: isLoading,
    refetch: () => mutate(),
    addEntry,
    updateEntry,
    deleteEntry,
    addAdjustment,
    deleteAdjustment,
    settleEntry,
    unsettleEntry,
    stats,
  };
}
