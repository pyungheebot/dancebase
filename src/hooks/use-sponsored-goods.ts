"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  SponsoredGoodsItem,
  SponsoredGoodsStatus,
  SponsoredGoodsDistribution,
} from "@/types";

// ============================================================
// localStorage 유틸
// ============================================================

function getStorageKey(groupId: string, projectId: string): string {
  return `dancebase:sponsored-goods:${groupId}:${projectId}`;
}

function loadItems(groupId: string, projectId: string): SponsoredGoodsItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId, projectId));
    return raw ? (JSON.parse(raw) as SponsoredGoodsItem[]) : [];
  } catch {
    return [];
  }
}

function saveItems(
  groupId: string,
  projectId: string,
  items: SponsoredGoodsItem[]
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    getStorageKey(groupId, projectId),
    JSON.stringify(items)
  );
}

// ============================================================
// 훅
// ============================================================

export function useSponsoredGoods(groupId: string, projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.sponsoredGoods(groupId, projectId),
    async () => loadItems(groupId, projectId)
  );

  const items = data ?? [];

  // ── 아이템 추가 ──
  async function addItem(
    input: Omit<SponsoredGoodsItem, "id" | "createdAt" | "distributions">
  ): Promise<void> {
    const newItem: SponsoredGoodsItem = {
      ...input,
      id: crypto.randomUUID(),
      distributions: [],
      createdAt: new Date().toISOString(),
    };
    const updated = [...items, newItem];
    saveItems(groupId, projectId, updated);
    await mutate(updated, false);
  }

  // ── 아이템 수정 ──
  async function updateItem(
    itemId: string,
    changes: Partial<Omit<SponsoredGoodsItem, "id" | "createdAt" | "distributions">>
  ): Promise<void> {
    const updated = items.map((item) =>
      item.id === itemId ? { ...item, ...changes } : item
    );
    saveItems(groupId, projectId, updated);
    await mutate(updated, false);
  }

  // ── 아이템 삭제 ──
  async function deleteItem(itemId: string): Promise<void> {
    const updated = items.filter((item) => item.id !== itemId);
    saveItems(groupId, projectId, updated);
    await mutate(updated, false);
  }

  // ── 상태 변경 ──
  async function updateStatus(
    itemId: string,
    status: SponsoredGoodsStatus
  ): Promise<void> {
    await updateItem(itemId, { status });
  }

  // ── 배분 추가 ──
  async function distribute(
    itemId: string,
    memberName: string,
    quantity: number
  ): Promise<boolean> {
    const item = items.find((i) => i.id === itemId);
    if (!item) return false;

    const remaining = getRemainingQuantity(itemId);
    if (quantity > remaining) return false;

    const newDist: SponsoredGoodsDistribution = {
      memberName,
      quantity,
      distributedAt: new Date().toISOString(),
    };

    const updatedDistributions = [...item.distributions, newDist];
    const totalDistributed = updatedDistributions.reduce(
      (sum, d) => sum + d.quantity,
      0
    );
    const newStatus: SponsoredGoodsStatus =
      totalDistributed >= item.quantity ? "distributed" : item.status;

    const updated = items.map((i) =>
      i.id === itemId
        ? { ...i, distributions: updatedDistributions, status: newStatus }
        : i
    );
    saveItems(groupId, projectId, updated);
    await mutate(updated, false);
    return true;
  }

  // ── 잔여 수량 계산 ──
  function getRemainingQuantity(itemId: string): number {
    const item = items.find((i) => i.id === itemId);
    if (!item) return 0;
    const distributed = item.distributions.reduce(
      (sum, d) => sum + d.quantity,
      0
    );
    return Math.max(0, item.quantity - distributed);
  }

  // ── 통계 ──
  const totalItems = items.length;
  const totalValue = items.reduce(
    (sum, i) => sum + (i.estimatedValue ?? 0),
    0
  );
  const receivedItems = items.filter(
    (i) => i.status === "received" || i.status === "distributed"
  ).length;
  const distributedItems = items.filter(
    (i) => i.status === "distributed"
  ).length;

  const stats = {
    totalItems,
    totalValue,
    receivedItems,
    distributedItems,
  };

  return {
    items,
    loading: isLoading,
    refetch: () => mutate(),
    addItem,
    updateItem,
    deleteItem,
    updateStatus,
    distribute,
    getRemainingQuantity,
    stats,
  };
}
