"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  TechRequirementItem,
  TechRequirementCategory,
  TechRequirementPriority,
} from "@/types";

// ============================================================
// localStorage 유틸
// ============================================================

function getStorageKey(groupId: string, projectId: string): string {
  return `dancebase:tech-requirements:${groupId}:${projectId}`;
}

function loadItems(groupId: string, projectId: string): TechRequirementItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId, projectId));
    return raw ? (JSON.parse(raw) as TechRequirementItem[]) : [];
  } catch {
    return [];
  }
}

function saveItems(
  groupId: string,
  projectId: string,
  items: TechRequirementItem[]
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

export function useTechRequirements(groupId: string, projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.techRequirements(groupId, projectId),
    async () => loadItems(groupId, projectId)
  );

  const items = data ?? [];

  // ── 아이템 추가 ──
  async function addItem(
    input: Omit<TechRequirementItem, "id" | "createdAt">
  ): Promise<void> {
    const newItem: TechRequirementItem = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...items, newItem];
    saveItems(groupId, projectId, updated);
    await mutate(updated, false);
  }

  // ── 아이템 수정 ──
  async function updateItem(
    itemId: string,
    changes: Partial<Omit<TechRequirementItem, "id" | "createdAt">>
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

  // ── 가용 여부 토글 ──
  async function toggleAvailable(itemId: string): Promise<void> {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    await updateItem(itemId, { isAvailable: !item.isAvailable });
  }

  // ── 카테고리별 조회 ──
  function getByCategory(category: TechRequirementCategory): TechRequirementItem[] {
    return items.filter((i) => i.category === category);
  }

  // ── 우선순위별 조회 ──
  function getByPriority(priority: TechRequirementPriority): TechRequirementItem[] {
    return items.filter((i) => i.priority === priority);
  }

  // ── 미확보 장비 조회 ──
  function getUnavailable(): TechRequirementItem[] {
    return items.filter((i) => !i.isAvailable);
  }

  // ── 통계 ──
  const totalItems = items.length;
  const availableItems = items.filter((i) => i.isAvailable).length;
  const unavailableItems = totalItems - availableItems;
  const totalEstimatedCost = items.reduce(
    (sum, i) => sum + (i.estimatedCost ?? 0),
    0
  );

  const categoryBreakdown: Record<TechRequirementCategory, number> = {
    sound: 0,
    lighting: 0,
    video: 0,
    stage: 0,
    power: 0,
    communication: 0,
    other: 0,
  };
  items.forEach((i) => {
    categoryBreakdown[i.category] += 1;
  });

  const stats = {
    totalItems,
    availableItems,
    unavailableItems,
    totalEstimatedCost,
    categoryBreakdown,
  };

  return {
    items,
    loading: isLoading,
    refetch: () => mutate(),
    addItem,
    updateItem,
    deleteItem,
    toggleAvailable,
    getByCategory,
    getByPriority,
    getUnavailable,
    stats,
  };
}
