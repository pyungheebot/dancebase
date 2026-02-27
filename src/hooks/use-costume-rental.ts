"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  CostumeRentalItem,
  CostumeRentalItemStatus,
  CostumeRentalRecord,
} from "@/types";

// ============================================
// 데이터 구조
// ============================================

type CostumeRentalData = {
  items: CostumeRentalItem[];
  records: CostumeRentalRecord[];
};

// ============================================
// localStorage 키
// ============================================

const LS_KEY = (groupId: string, projectId: string) =>
  `dancebase:costume-rental:${groupId}:${projectId}`;

// ============================================
// localStorage 헬퍼
// ============================================

function loadData(
  groupId: string,
  projectId: string
): CostumeRentalData {
  if (typeof window === "undefined") return { items: [], records: [] };
  try {
    const raw = localStorage.getItem(LS_KEY(groupId, projectId));
    return raw
      ? (JSON.parse(raw) as CostumeRentalData)
      : { items: [], records: [] };
  } catch {
    return { items: [], records: [] };
  }
}

function saveData(
  groupId: string,
  projectId: string,
  data: CostumeRentalData
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY(groupId, projectId), JSON.stringify(data));
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

// ============================================
// ID 생성 헬퍼
// ============================================

function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ============================================
// 훅
// ============================================

export function useCostumeRental(groupId: string, projectId: string) {
  const swrKey =
    groupId && projectId
      ? swrKeys.costumeRental(groupId, projectId)
      : null;

  const { data, mutate } = useSWR(
    swrKey,
    () => loadData(groupId, projectId),
    { revalidateOnFocus: false }
  );

  const stored: CostumeRentalData = data ?? { items: [], records: [] };

  // ── 아이템 추가 ──────────────────────────────────────────────

  function addItem(
    name: string,
    category: CostumeRentalItem["category"],
    size: string
  ): void {
    const newItem: CostumeRentalItem = {
      id: genId("item"),
      name: name.trim(),
      category,
      size: size.trim(),
      status: "available",
      createdAt: new Date().toISOString(),
    };
    const updated: CostumeRentalData = {
      ...stored,
      items: [...stored.items, newItem],
    };
    saveData(groupId, projectId, updated);
    mutate(updated, false);
  }

  // ── 대여 처리 ────────────────────────────────────────────────

  function rentItem(
    itemId: string,
    renterName: string,
    dueDate: string
  ): void {
    const now = new Date().toISOString();
    const newRecord: CostumeRentalRecord = {
      id: genId("record"),
      itemId,
      renterName: renterName.trim(),
      rentedAt: now,
    };
    const updated: CostumeRentalData = {
      items: stored.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              status: "rented" as CostumeRentalItemStatus,
              currentRenter: renterName.trim(),
              rentedAt: now,
              dueDate,
            }
          : item
      ),
      records: [...stored.records, newRecord],
    };
    saveData(groupId, projectId, updated);
    mutate(updated, false);
  }

  // ── 반납 처리 ────────────────────────────────────────────────

  function returnItem(
    itemId: string,
    condition: CostumeRentalRecord["condition"],
    notes?: string
  ): void {
    const now = new Date().toISOString();
    const newStatus: CostumeRentalItemStatus =
      condition === "good"
        ? "available"
        : condition === "damaged"
        ? "damaged"
        : "lost";

    const updated: CostumeRentalData = {
      items: stored.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              status: newStatus,
              currentRenter: undefined,
              rentedAt: undefined,
              dueDate: undefined,
            }
          : item
      ),
      records: stored.records.map((record) => {
        if (record.itemId !== itemId || record.returnedAt) return record;
        // 가장 최근 미반납 기록에 반납 정보 기록
        return {
          ...record,
          returnedAt: now,
          condition,
          notes: notes?.trim(),
        };
      }),
    };
    saveData(groupId, projectId, updated);
    mutate(updated, false);
  }

  // ── 아이템 삭제 ──────────────────────────────────────────────

  function deleteItem(itemId: string): void {
    const updated: CostumeRentalData = {
      items: stored.items.filter((item) => item.id !== itemId),
      records: stored.records.filter((record) => record.itemId !== itemId),
    };
    saveData(groupId, projectId, updated);
    mutate(updated, false);
  }

  // ── 통계 ────────────────────────────────────────────────────

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalItems = stored.items.length;
  const availableCount = stored.items.filter(
    (item) => item.status === "available"
  ).length;
  const rentedCount = stored.items.filter(
    (item) => item.status === "rented"
  ).length;
  const overdueCount = stored.items.filter((item) => {
    if (item.status !== "rented" || !item.dueDate) return false;
    const due = new Date(item.dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  }).length;

  return {
    items: stored.items,
    records: stored.records,
    loading: data === undefined,
    // 액션
    addItem,
    rentItem,
    returnItem,
    deleteItem,
    // 통계
    totalItems,
    availableCount,
    rentedCount,
    overdueCount,
    refetch: () => mutate(),
  };
}
