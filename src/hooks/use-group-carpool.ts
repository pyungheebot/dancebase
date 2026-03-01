"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  CarPoolData,
  CarPoolItem,
  CarPoolPassenger,
  CarPoolStatus,
} from "@/types";

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(groupId: string): string {
  return `dancebase:group-carpool:${groupId}`;
}

// ============================================================
// 훅
// ============================================================

export function useGroupCarPool(groupId: string) {
  const { data, mutate, isLoading } = useSWR(
    groupId ? swrKeys.groupCarPool(groupId) : null,
    () => loadFromStorage<CarPoolData>(storageKey(groupId), {} as CarPoolData)
  );

  const current: CarPoolData = useMemo(() => data ?? {
    groupId,
    carpools: [],
    updatedAt: new Date().toISOString(),
  }, [data, groupId]);

  const persist = useCallback(
    (next: CarPoolData) => {
      saveToStorage(storageKey(groupId), next);
      mutate(next, false);
    },
    [groupId, mutate]
  );

  // ── 카풀 추가 ─────────────────────────────────────────────

  const addCarPool = useCallback(
    (
      partial: Omit<CarPoolItem, "id" | "createdAt" | "passengers" | "status">
    ): CarPoolItem => {
      const newItem: CarPoolItem = {
        id: crypto.randomUUID(),
        ...partial,
        status: "모집중",
        passengers: [],
        createdAt: new Date().toISOString(),
      };
      persist({
        ...current,
        carpools: [newItem, ...current.carpools],
        updatedAt: new Date().toISOString(),
      });
      return newItem;
    },
    [current, persist]
  );

  // ── 카풀 삭제 ─────────────────────────────────────────────

  const deleteCarPool = useCallback(
    (carpoolId: string): boolean => {
      const filtered = current.carpools.filter((c) => c.id !== carpoolId);
      if (filtered.length === current.carpools.length) return false;
      persist({ ...current, carpools: filtered, updatedAt: new Date().toISOString() });
      return true;
    },
    [current, persist]
  );

  // ── 상태 변경 ─────────────────────────────────────────────

  const updateStatus = useCallback(
    (carpoolId: string, status: CarPoolStatus): boolean => {
      const idx = current.carpools.findIndex((c) => c.id === carpoolId);
      if (idx === -1) return false;
      const next = [...current.carpools];
      next[idx] = { ...next[idx], status };
      persist({ ...current, carpools: next, updatedAt: new Date().toISOString() });
      return true;
    },
    [current, persist]
  );

  // ── 탑승자 추가 ───────────────────────────────────────────

  const addPassenger = useCallback(
    (carpoolId: string, name: string): boolean => {
      const idx = current.carpools.findIndex((c) => c.id === carpoolId);
      if (idx === -1) return false;
      const carpool = current.carpools[idx];
      if (carpool.passengers.length >= carpool.maxPassengers) return false;
      if (carpool.status !== "모집중") return false;

      const passenger: CarPoolPassenger = {
        id: crypto.randomUUID(),
        name: name.trim(),
        addedAt: new Date().toISOString(),
      };
      const next = [...current.carpools];
      next[idx] = {
        ...carpool,
        passengers: [...carpool.passengers, passenger],
      };
      // 자동 마감 처리
      if (next[idx].passengers.length >= next[idx].maxPassengers) {
        next[idx] = { ...next[idx], status: "마감" };
      }
      persist({ ...current, carpools: next, updatedAt: new Date().toISOString() });
      return true;
    },
    [current, persist]
  );

  // ── 탑승자 삭제 ───────────────────────────────────────────

  const removePassenger = useCallback(
    (carpoolId: string, passengerId: string): boolean => {
      const idx = current.carpools.findIndex((c) => c.id === carpoolId);
      if (idx === -1) return false;
      const carpool = current.carpools[idx];
      const filtered = carpool.passengers.filter((p) => p.id !== passengerId);
      if (filtered.length === carpool.passengers.length) return false;
      const next = [...current.carpools];
      next[idx] = { ...carpool, passengers: filtered };
      // 마감이었으면 다시 모집중으로 변경
      if (next[idx].status === "마감") {
        next[idx] = { ...next[idx], status: "모집중" };
      }
      persist({ ...current, carpools: next, updatedAt: new Date().toISOString() });
      return true;
    },
    [current, persist]
  );

  // ── 파생 데이터 ───────────────────────────────────────────

  /** 날짜순 정렬된 카풀 목록 */
  const sortedCarpools = [...current.carpools].sort(
    (a, b) =>
      new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
  );

  /** 모집중인 카풀만 */
  const openCarpools = sortedCarpools.filter((c) => c.status === "모집중");

  /** 잔여 좌석 계산 */
  const remainingSeats = (item: CarPoolItem): number =>
    Math.max(0, item.maxPassengers - item.passengers.length);

  /** 통계 */
  const stats = {
    total: current.carpools.length,
    open: openCarpools.length,
    totalPassengers: current.carpools.reduce(
      (sum, c) => sum + c.passengers.length,
      0
    ),
  };

  return {
    data: current,
    loading: isLoading,
    sortedCarpools,
    openCarpools,
    remainingSeats,
    stats,
    addCarPool,
    deleteCarPool,
    updateStatus,
    addPassenger,
    removePassenger,
    refetch: () => mutate(),
  };
}
