"use client";

import { useState, useCallback } from "react";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  PerfTicketTier,
  PerfTicketAllocation,
  PerfTicketData,

} from "@/types";

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(projectId: string): string {
  return swrKeys.performanceTicket(projectId);
}

// ============================================================
// 통계 타입
// ============================================================

export type PerfTicketTierSummary = {
  tier: PerfTicketTier;
  /** 확정 배분 수량 */
  confirmedQty: number;
  /** 예약 배분 수량 */
  reservedQty: number;
  /** 취소 배분 수량 */
  cancelledQty: number;
  /** 남은 수량 (totalQuantity - confirmed - reserved) */
  remainingQty: number;
  /** 등급별 매출 (confirmed * price) */
  revenue: number;
};

export type PerfTicketStats = {
  /** 총 티켓 수량 (모든 등급 합) */
  totalTickets: number;
  /** 확정+예약 배분 수량 */
  soldTickets: number;
  /** 확정 배분 수량 */
  confirmedTickets: number;
  /** 총 매출 (확정 기준) */
  revenue: number;
  /** 판매 목표 대비 진행률 (0-100, salesGoal 없으면 totalTickets 기준) */
  salesProgress: number;
  /** 등급별 요약 */
  tierSummary: PerfTicketTierSummary[];
};

// ============================================================
// 훅
// ============================================================

export function usePerformanceTicket(projectId: string) {
  const [tiers, setTiers] = useState<PerfTicketTier[]>(() => loadFromStorage<PerfTicketData>(storageKey(projectId), {} as PerfTicketData).tiers);
  const [allocations, setAllocations] = useState<PerfTicketAllocation[]>([]);
  const [salesGoal, setSalesGoal] = useState<number | null>(null);

  const reload = useCallback(() => {
    if (!projectId) return;
    const data = loadFromStorage<PerfTicketData>(storageKey(projectId), {} as PerfTicketData);
    setTiers(data.tiers);
    setAllocations(data.allocations);
    setSalesGoal(data.salesGoal);
  }, [projectId]);

  const persist = useCallback(
    (updated: {
      tiers?: PerfTicketTier[];
      allocations?: PerfTicketAllocation[];
      salesGoal?: number | null;
    }) => {
      const currentData = loadFromStorage<PerfTicketData>(storageKey(projectId), {} as PerfTicketData);
      const newData: PerfTicketData = {
        projectId,
        tiers: updated.tiers ?? currentData.tiers,
        allocations: updated.allocations ?? currentData.allocations,
        salesGoal:
          updated.salesGoal !== undefined
            ? updated.salesGoal
            : currentData.salesGoal,
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(storageKey(projectId), newData);
      if (updated.tiers !== undefined) setTiers(newData.tiers);
      if (updated.allocations !== undefined)
        setAllocations(newData.allocations);
      if (updated.salesGoal !== undefined) setSalesGoal(newData.salesGoal);
    },
    [projectId]
  );

  // ── 티켓 등급 CRUD ──────────────────────────────────────

  const addTier = useCallback(
    (params: Omit<PerfTicketTier, "id">): PerfTicketTier => {
      const newTier: PerfTicketTier = {
        id: crypto.randomUUID(),
        ...params,
      };
      persist({ tiers: [...tiers, newTier] });
      return newTier;
    },
    [tiers, persist]
  );

  const updateTier = useCallback(
    (tierId: string, params: Partial<Omit<PerfTicketTier, "id">>): boolean => {
      const idx = tiers.findIndex((t) => t.id === tierId);
      if (idx === -1) return false;
      const updated = tiers.map((t) =>
        t.id === tierId ? { ...t, ...params } : t
      );
      persist({ tiers: updated });
      return true;
    },
    [tiers, persist]
  );

  const deleteTier = useCallback(
    (tierId: string): boolean => {
      const exists = tiers.some((t) => t.id === tierId);
      if (!exists) return false;
      const updatedTiers = tiers.filter((t) => t.id !== tierId);
      // 해당 등급 배분도 삭제
      const updatedAllocations = allocations.filter(
        (a) => a.tierId !== tierId
      );
      persist({ tiers: updatedTiers, allocations: updatedAllocations });
      return true;
    },
    [tiers, allocations, persist]
  );

  // ── 티켓 배분 CRUD ──────────────────────────────────────

  const addAllocation = useCallback(
    (
      params: Omit<PerfTicketAllocation, "id" | "createdAt">
    ): PerfTicketAllocation => {
      const newAllocation: PerfTicketAllocation = {
        id: crypto.randomUUID(),
        ...params,
        createdAt: new Date().toISOString(),
      };
      persist({ allocations: [...allocations, newAllocation] });
      return newAllocation;
    },
    [allocations, persist]
  );

  const updateAllocation = useCallback(
    (
      allocationId: string,
      params: Partial<Omit<PerfTicketAllocation, "id" | "createdAt">>
    ): boolean => {
      const idx = allocations.findIndex((a) => a.id === allocationId);
      if (idx === -1) return false;
      const updated = allocations.map((a) =>
        a.id === allocationId ? { ...a, ...params } : a
      );
      persist({ allocations: updated });
      return true;
    },
    [allocations, persist]
  );

  const cancelAllocation = useCallback(
    (allocationId: string): boolean => {
      return updateAllocation(allocationId, { status: "cancelled" });
    },
    [updateAllocation]
  );

  const deleteAllocation = useCallback(
    (allocationId: string): boolean => {
      const exists = allocations.some((a) => a.id === allocationId);
      if (!exists) return false;
      persist({ allocations: allocations.filter((a) => a.id !== allocationId) });
      return true;
    },
    [allocations, persist]
  );

  // ── 판매 목표 설정 ──────────────────────────────────────

  const updateSalesGoal = useCallback(
    (goal: number | null) => {
      persist({ salesGoal: goal });
    },
    [persist]
  );

  // ── 통계 계산 ──────────────────────────────────────────

  const stats: PerfTicketStats = (() => {
    const totalTickets = tiers.reduce((acc, t) => acc + t.totalQuantity, 0);

    const tierSummary: PerfTicketTierSummary[] = tiers.map((tier) => {
      const tierAllocations = allocations.filter((a) => a.tierId === tier.id);
      const confirmedQty = tierAllocations
        .filter((a) => a.status === "confirmed")
        .reduce((acc, a) => acc + a.quantity, 0);
      const reservedQty = tierAllocations
        .filter((a) => a.status === "reserved")
        .reduce((acc, a) => acc + a.quantity, 0);
      const cancelledQty = tierAllocations
        .filter((a) => a.status === "cancelled")
        .reduce((acc, a) => acc + a.quantity, 0);
      const remainingQty = tier.totalQuantity - confirmedQty - reservedQty;
      const revenue = confirmedQty * tier.price;

      return {
        tier,
        confirmedQty,
        reservedQty,
        cancelledQty,
        remainingQty: Math.max(0, remainingQty),
        revenue,
      };
    });

    const soldTickets = tierSummary.reduce(
      (acc, s) => acc + s.confirmedQty + s.reservedQty,
      0
    );
    const confirmedTickets = tierSummary.reduce(
      (acc, s) => acc + s.confirmedQty,
      0
    );
    const revenue = tierSummary.reduce((acc, s) => acc + s.revenue, 0);

    const goalBase = salesGoal ?? totalTickets;
    const salesProgress =
      goalBase > 0 ? Math.min(100, Math.round((soldTickets / goalBase) * 100)) : 0;

    return {
      totalTickets,
      soldTickets,
      confirmedTickets,
      revenue,
      salesProgress,
      tierSummary,
    };
  })();

  return {
    tiers,
    allocations,
    salesGoal,
    loading: false,
    stats,
    // 등급
    addTier,
    updateTier,
    deleteTier,
    // 배분
    addAllocation,
    updateAllocation,
    cancelAllocation,
    deleteAllocation,
    // 목표
    updateSalesGoal,
    refetch: reload,
  };
}
