"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { TicketConfig, TicketReservation, TicketTier } from "@/types";

// ============================================
// localStorage 유틸리티
// ============================================

function getStorageKey(groupId: string, projectId: string): string {
  return `dancebase:tickets:${groupId}:${projectId}`;
}

function loadData(groupId: string, projectId: string): TicketConfig[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId, projectId));
    return raw ? (JSON.parse(raw) as TicketConfig[]) : [];
  } catch {
    return [];
  }
}

function persistData(
  groupId: string,
  projectId: string,
  data: TicketConfig[]
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      getStorageKey(groupId, projectId),
      JSON.stringify(data)
    );
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

// ============================================
// 통계 유틸리티
// ============================================

export type TierStat = {
  tier: TicketTier;
  price: number;
  capacity: number;
  sold: number;
  remaining: number;
  revenue: number;
};

function calcTierStats(config: TicketConfig): TierStat[] {
  return config.tiers.map(({ tier, price, capacity }) => {
    const sold = config.reservations
      .filter((r) => r.tier === tier)
      .reduce((sum, r) => sum + r.quantity, 0);
    return {
      tier,
      price,
      capacity,
      sold,
      remaining: Math.max(0, capacity - sold),
      revenue: config.reservations
        .filter((r) => r.tier === tier && r.isPaid)
        .reduce((sum, r) => sum + r.totalPrice, 0),
    };
  });
}

// ============================================
// 훅
// ============================================

export function useTicketManagement(groupId: string, projectId: string) {
  const key = swrKeys.ticketManagement(groupId, projectId);

  const { data, mutate } = useSWR<TicketConfig[]>(key, () =>
    loadData(groupId, projectId)
  );

  const configs: TicketConfig[] = data ?? [];

  /** 내부 상태 + localStorage 동기 업데이트 */
  const update = useCallback(
    (next: TicketConfig[]) => {
      persistData(groupId, projectId, next);
      mutate(next, false);
    },
    [groupId, projectId, mutate]
  );

  // ============================================
  // TicketConfig CRUD
  // ============================================

  /** 티켓 설정(공연) 추가 */
  const addConfig = useCallback(
    (
      input: Omit<TicketConfig, "id" | "reservations" | "createdAt">
    ) => {
      const newConfig: TicketConfig = {
        ...input,
        id: crypto.randomUUID(),
        reservations: [],
        createdAt: new Date().toISOString(),
      };
      update([...configs, newConfig]);
    },
    [configs, update]
  );

  /** 티켓 설정(공연) 삭제 */
  const deleteConfig = useCallback(
    (configId: string) => {
      update(configs.filter((c) => c.id !== configId));
    },
    [configs, update]
  );

  // ============================================
  // 예약 CRUD
  // ============================================

  /** 예약 추가 */
  const addReservation = useCallback(
    (
      configId: string,
      input: Omit<TicketReservation, "id" | "isPaid" | "reservedAt">
    ) => {
      const newReservation: TicketReservation = {
        ...input,
        id: crypto.randomUUID(),
        isPaid: false,
        reservedAt: new Date().toISOString(),
      };
      const next = configs.map((c) => {
        if (c.id !== configId) return c;
        return { ...c, reservations: [...c.reservations, newReservation] };
      });
      update(next);
    },
    [configs, update]
  );

  /** 예약 삭제 */
  const deleteReservation = useCallback(
    (configId: string, reservationId: string) => {
      const next = configs.map((c) => {
        if (c.id !== configId) return c;
        return {
          ...c,
          reservations: c.reservations.filter((r) => r.id !== reservationId),
        };
      });
      update(next);
    },
    [configs, update]
  );

  /** 결제 여부 토글 */
  const togglePaid = useCallback(
    (configId: string, reservationId: string) => {
      const next = configs.map((c) => {
        if (c.id !== configId) return c;
        return {
          ...c,
          reservations: c.reservations.map((r) =>
            r.id === reservationId ? { ...r, isPaid: !r.isPaid } : r
          ),
        };
      });
      update(next);
    },
    [configs, update]
  );

  // ============================================
  // 통계
  // ============================================

  /** 전체 판매 수량 */
  const totalSold = configs.reduce(
    (sum, c) => sum + c.reservations.reduce((s, r) => s + r.quantity, 0),
    0
  );

  /** 전체 수입 (결제 완료 건만) */
  const totalRevenue = configs.reduce(
    (sum, c) =>
      sum +
      c.reservations
        .filter((r) => r.isPaid)
        .reduce((s, r) => s + r.totalPrice, 0),
    0
  );

  /** 설정별 티어 통계 */
  const getTierStats = useCallback(
    (configId: string): TierStat[] => {
      const config = configs.find((c) => c.id === configId);
      if (!config) return [];
      return calcTierStats(config);
    },
    [configs]
  );

  return {
    configs,
    addConfig,
    deleteConfig,
    addReservation,
    deleteReservation,
    togglePaid,
    totalSold,
    totalRevenue,
    getTierStats,
    refetch: () => mutate(),
  };
}
