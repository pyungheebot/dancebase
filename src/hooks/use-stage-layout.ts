"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { StageLayoutPlan, StageLayoutItem, StageLayoutItemType } from "@/types";

// ============================================================
// localStorage 유틸
// ============================================================

function getStorageKey(groupId: string, projectId: string): string {
  return `dancebase:stage-layout:${groupId}:${projectId}`;
}

function loadPlans(groupId: string, projectId: string): StageLayoutPlan[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId, projectId));
    return raw ? (JSON.parse(raw) as StageLayoutPlan[]) : [];
  } catch {
    return [];
  }
}

function savePlans(
  groupId: string,
  projectId: string,
  plans: StageLayoutPlan[]
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    getStorageKey(groupId, projectId),
    JSON.stringify(plans)
  );
}

// ============================================================
// 훅
// ============================================================

export function useStageLayout(groupId: string, projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.stageLayout(groupId, projectId),
    async () => loadPlans(groupId, projectId)
  );

  const plans = data ?? [];

  // ── 플랜 추가 ──
  async function addPlan(
    input: Omit<StageLayoutPlan, "id" | "projectId" | "items" | "createdAt">
  ): Promise<StageLayoutPlan> {
    const newPlan: StageLayoutPlan = {
      ...input,
      id: crypto.randomUUID(),
      projectId,
      items: [],
      createdAt: new Date().toISOString(),
    };
    const updated = [...plans, newPlan];
    savePlans(groupId, projectId, updated);
    await mutate(updated, false);
    return newPlan;
  }

  // ── 플랜 수정 ──
  async function updatePlan(
    planId: string,
    changes: Partial<Omit<StageLayoutPlan, "id" | "projectId" | "items" | "createdAt">>
  ): Promise<void> {
    const updated = plans.map((p) =>
      p.id === planId ? { ...p, ...changes } : p
    );
    savePlans(groupId, projectId, updated);
    await mutate(updated, false);
  }

  // ── 플랜 삭제 ──
  async function deletePlan(planId: string): Promise<void> {
    const updated = plans.filter((p) => p.id !== planId);
    savePlans(groupId, projectId, updated);
    await mutate(updated, false);
  }

  // ── 아이템 추가 ──
  async function addItem(
    planId: string,
    input: Omit<StageLayoutItem, "id">
  ): Promise<void> {
    const newItem: StageLayoutItem = {
      ...input,
      id: crypto.randomUUID(),
    };
    const updated = plans.map((p) =>
      p.id === planId ? { ...p, items: [...p.items, newItem] } : p
    );
    savePlans(groupId, projectId, updated);
    await mutate(updated, false);
  }

  // ── 아이템 수정 ──
  async function updateItem(
    planId: string,
    itemId: string,
    changes: Partial<Omit<StageLayoutItem, "id">>
  ): Promise<void> {
    const updated = plans.map((p) =>
      p.id === planId
        ? {
            ...p,
            items: p.items.map((item) =>
              item.id === itemId ? { ...item, ...changes } : item
            ),
          }
        : p
    );
    savePlans(groupId, projectId, updated);
    await mutate(updated, false);
  }

  // ── 아이템 삭제 ──
  async function deleteItem(planId: string, itemId: string): Promise<void> {
    const updated = plans.map((p) =>
      p.id === planId
        ? { ...p, items: p.items.filter((item) => item.id !== itemId) }
        : p
    );
    savePlans(groupId, projectId, updated);
    await mutate(updated, false);
  }

  // ── 아이템 이동 ──
  async function moveItem(
    planId: string,
    itemId: string,
    x: number,
    y: number
  ): Promise<void> {
    await updateItem(planId, itemId, { x, y });
  }

  // ── 유형별 아이템 조회 ──
  function getItemsByType(
    planId: string,
    type: StageLayoutItemType
  ): StageLayoutItem[] {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return [];
    return plan.items.filter((item) => item.type === type);
  }

  // ── 통계 ──
  const totalPlans = plans.length;
  const totalItems = plans.reduce((sum, p) => sum + p.items.length, 0);

  const stats = {
    totalPlans,
    totalItems,
  };

  return {
    plans,
    loading: isLoading,
    refetch: () => mutate(),
    addPlan,
    updatePlan,
    deletePlan,
    addItem,
    updateItem,
    deleteItem,
    moveItem,
    getItemsByType,
    stats,
  };
}
