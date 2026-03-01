"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { LostFoundData, LostFoundItem, LostFoundStatus } from "@/types";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(groupId: string): string {
  return `dancebase:group-lost-found:${groupId}`;
}

// ============================================================
// 훅
// ============================================================

export function useGroupLostFound(groupId: string) {
  const { data, mutate, isLoading } = useSWR(
    groupId ? swrKeys.groupLostFound(groupId) : null,
    () => loadFromStorage<LostFoundData>(storageKey(groupId), {} as LostFoundData)
  );

  const current: LostFoundData = useMemo(() => data ?? {
    groupId,
    items: [],
    updatedAt: new Date().toISOString(),
  }, [data, groupId]);

  const persist = useCallback(
    (next: LostFoundData) => {
      saveToStorage(storageKey(groupId), next);
      mutate(next, false);
    },
    [groupId, mutate]
  );

  // ── 분실물 항목 추가 ──────────────────────────────────────

  const addItem = useCallback(
    (payload: {
      itemName: string;
      description: string;
      lostPlace: string;
      lostDate: string;
      reporterName: string;
      finderName: string;
    }): LostFoundItem => {
      const now = new Date().toISOString();
      const item: LostFoundItem = {
        id: crypto.randomUUID(),
        itemName: payload.itemName.trim(),
        description: payload.description.trim(),
        lostPlace: payload.lostPlace.trim(),
        lostDate: payload.lostDate,
        reporterName: payload.reporterName.trim(),
        status: "분실",
        finderName: payload.finderName.trim(),
        createdAt: now,
        updatedAt: now,
      };
      persist({
        ...current,
        items: [item, ...current.items],
        updatedAt: now,
      });
      return item;
    },
    [current, persist]
  );

  // ── 분실물 항목 수정 ──────────────────────────────────────

  const updateItem = useCallback(
    (
      itemId: string,
      patch: Partial<
        Pick<
          LostFoundItem,
          | "itemName"
          | "description"
          | "lostPlace"
          | "lostDate"
          | "reporterName"
          | "finderName"
          | "status"
        >
      >
    ): boolean => {
      const idx = current.items.findIndex((i) => i.id === itemId);
      if (idx === -1) return false;
      const now = new Date().toISOString();
      const updated = current.items.map((i) =>
        i.id === itemId ? { ...i, ...patch, updatedAt: now } : i
      );
      persist({ ...current, items: updated, updatedAt: now });
      return true;
    },
    [current, persist]
  );

  // ── 상태 인라인 변경 ──────────────────────────────────────

  const changeStatus = useCallback(
    (itemId: string, status: LostFoundStatus): boolean => {
      return updateItem(itemId, { status });
    },
    [updateItem]
  );

  // ── 분실물 항목 삭제 ──────────────────────────────────────

  const deleteItem = useCallback(
    (itemId: string): boolean => {
      const filtered = current.items.filter((i) => i.id !== itemId);
      if (filtered.length === current.items.length) return false;
      const now = new Date().toISOString();
      persist({ ...current, items: filtered, updatedAt: now });
      return true;
    },
    [current, persist]
  );

  // ── 통계 계산 ─────────────────────────────────────────────

  const total = current.items.length;
  const lostCount = current.items.filter((i) => i.status === "분실").length;
  const foundCount = current.items.filter((i) => i.status === "발견").length;
  const returnedCount = current.items.filter(
    (i) => i.status === "반환완료"
  ).length;
  const unresolvedCount = lostCount + foundCount;
  const returnRate =
    total > 0 ? Math.round((returnedCount / total) * 100) : 0;

  const stats = {
    total,
    lostCount,
    foundCount,
    returnedCount,
    unresolvedCount,
    returnRate,
    maxCount: Math.max(lostCount, foundCount, returnedCount, 1),
  };

  return {
    data: current,
    loading: isLoading,
    addItem,
    updateItem,
    changeStatus,
    deleteItem,
    stats,
    refetch: () => mutate(),
  };
}
