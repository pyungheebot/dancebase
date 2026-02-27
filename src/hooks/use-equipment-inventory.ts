"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { EquipmentItem, EquipmentCheckout, EquipmentCondition } from "@/types";

// ─── localStorage 헬퍼 ────────────────────────────────────────

function loadData(groupId: string): {
  items: EquipmentItem[];
  checkouts: EquipmentCheckout[];
} {
  if (typeof window === "undefined") return { items: [], checkouts: [] };
  try {
    const raw = localStorage.getItem(`dancebase:equipment:${groupId}`);
    if (!raw) return { items: [], checkouts: [] };
    return JSON.parse(raw);
  } catch {
    return { items: [], checkouts: [] };
  }
}

function saveData(
  groupId: string,
  data: { items: EquipmentItem[]; checkouts: EquipmentCheckout[] }
) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`dancebase:equipment:${groupId}`, JSON.stringify(data));
}

// ─── 오늘 날짜 (YYYY-MM-DD) ─────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── 연체 여부 판별 ──────────────────────────────────────────

function isOverdue(checkout: EquipmentCheckout): boolean {
  if (checkout.returnedAt) return false;
  return checkout.expectedReturn < todayStr();
}

// ─── 훅 ─────────────────────────────────────────────────────

export function useEquipmentInventory(groupId: string) {
  const key = swrKeys.equipmentInventory(groupId);

  const { data, mutate } = useSWR(key, () => loadData(groupId), {
    revalidateOnFocus: false,
  });

  const items = data?.items ?? [];
  const checkouts = data?.checkouts ?? [];

  // ── 장비 CRUD ─────────────────────────────────────────────

  function addItem(
    input: Omit<EquipmentItem, "id" | "createdAt" | "lastCheckedAt">
  ): boolean {
    try {
      const stored = loadData(groupId);
      const newItem: EquipmentItem = {
        ...input,
        id: crypto.randomUUID(),
        lastCheckedAt: todayStr(),
        createdAt: new Date().toISOString(),
      };
      stored.items = [...stored.items, newItem];
      saveData(groupId, stored);
      mutate(stored, false);
      return true;
    } catch {
      return false;
    }
  }

  function updateItem(
    id: string,
    patch: Partial<Omit<EquipmentItem, "id" | "createdAt">>
  ): boolean {
    try {
      const stored = loadData(groupId);
      const idx = stored.items.findIndex((i) => i.id === id);
      if (idx === -1) return false;
      stored.items[idx] = { ...stored.items[idx], ...patch };
      saveData(groupId, stored);
      mutate(stored, false);
      return true;
    } catch {
      return false;
    }
  }

  function deleteItem(id: string): boolean {
    try {
      const stored = loadData(groupId);
      stored.items = stored.items.filter((i) => i.id !== id);
      // 해당 장비의 대여 기록도 함께 삭제
      stored.checkouts = stored.checkouts.filter((c) => c.equipmentId !== id);
      saveData(groupId, stored);
      mutate(stored, false);
      return true;
    } catch {
      return false;
    }
  }

  // ── 대여/반납 ──────────────────────────────────────────────

  function checkout(
    equipmentId: string,
    borrowerName: string,
    expectedReturn: string,
    note: string = ""
  ): { ok: boolean; error?: string } {
    try {
      const stored = loadData(groupId);
      const item = stored.items.find((i) => i.id === equipmentId);
      if (!item) return { ok: false, error: "장비를 찾을 수 없습니다." };

      // 현재 미반납 대여 수 확인
      const activeCount = stored.checkouts.filter(
        (c) => c.equipmentId === equipmentId && !c.returnedAt
      ).length;

      if (activeCount >= item.quantity) {
        return {
          ok: false,
          error: `대여 가능한 수량(${item.quantity}개)을 초과했습니다.`,
        };
      }

      const newCheckout: EquipmentCheckout = {
        id: crypto.randomUUID(),
        equipmentId,
        borrowerName,
        borrowedAt: new Date().toISOString(),
        expectedReturn,
        note,
      };
      stored.checkouts = [...stored.checkouts, newCheckout];
      saveData(groupId, stored);
      mutate(stored, false);
      return { ok: true };
    } catch {
      return { ok: false, error: "대여 처리 중 오류가 발생했습니다." };
    }
  }

  function returnCheckout(checkoutId: string): boolean {
    try {
      const stored = loadData(groupId);
      const idx = stored.checkouts.findIndex((c) => c.id === checkoutId);
      if (idx === -1) return false;
      stored.checkouts[idx] = {
        ...stored.checkouts[idx],
        returnedAt: new Date().toISOString(),
      };
      saveData(groupId, stored);
      mutate(stored, false);
      return true;
    } catch {
      return false;
    }
  }

  // ── 필터 유틸 ─────────────────────────────────────────────

  function getItemsByCategory(category: string): EquipmentItem[] {
    return items.filter((i) => i.category === category);
  }

  function getItemsByCondition(condition: EquipmentCondition): EquipmentItem[] {
    return items.filter((i) => i.condition === condition);
  }

  function getActiveCheckouts(): EquipmentCheckout[] {
    return checkouts.filter((c) => !c.returnedAt);
  }

  function getOverdueCheckouts(): EquipmentCheckout[] {
    return checkouts.filter(isOverdue);
  }

  function getCheckoutsForItem(equipmentId: string): EquipmentCheckout[] {
    return checkouts.filter((c) => c.equipmentId === equipmentId);
  }

  // ── 통계 ──────────────────────────────────────────────────

  const totalItems = items.length;
  const activeCheckoutCount = getActiveCheckouts().length;
  const overdueCount = getOverdueCheckouts().length;

  const conditionDistribution: Record<EquipmentCondition, number> = {
    excellent: 0,
    good: 0,
    fair: 0,
    poor: 0,
    broken: 0,
  };
  for (const item of items) {
    conditionDistribution[item.condition]++;
  }

  const goodCount =
    conditionDistribution.excellent + conditionDistribution.good;
  const goodRate = totalItems > 0 ? Math.round((goodCount / totalItems) * 100) : 0;

  // 카테고리 목록 (중복 제거)
  const categories = Array.from(new Set(items.map((i) => i.category)));

  return {
    items,
    checkouts,
    // 장비 CRUD
    addItem,
    updateItem,
    deleteItem,
    // 대여/반납
    checkout,
    returnCheckout,
    // 필터
    getItemsByCategory,
    getItemsByCondition,
    getActiveCheckouts,
    getOverdueCheckouts,
    getCheckoutsForItem,
    isOverdue,
    // 통계
    totalItems,
    activeCheckoutCount,
    overdueCount,
    conditionDistribution,
    goodRate,
    categories,
    // SWR
    refetch: () => mutate(),
  };
}
