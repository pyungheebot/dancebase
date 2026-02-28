"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  EquipmentRentalItem,
  EquipmentRentalRecord,
  EquipmentRentalStatus,
} from "@/types";

const STORAGE_PREFIX = "dancebase:equipment-rental:";

function getStorageKey(groupId: string) {
  return `${STORAGE_PREFIX}${groupId}`;
}

function loadItems(groupId: string): EquipmentRentalItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as EquipmentRentalItem[];
  } catch {
    return [];
  }
}

function saveItems(groupId: string, items: EquipmentRentalItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(groupId), JSON.stringify(items));
}

function computeStatus(item: EquipmentRentalItem): EquipmentRentalStatus {
  if (item.status === "maintenance") return "maintenance";
  const today = new Date().toISOString().slice(0, 10);
  const activeRentals = item.rentals.filter((r) => !r.returnDate);
  const hasOverdue = activeRentals.some((r) => r.dueDate < today);
  if (hasOverdue) return "overdue";
  if (item.availableQuantity === 0) return "rented";
  return "available";
}

export function useEquipmentRental(groupId: string) {
  const { data, mutate } = useSWR(
    swrKeys.equipmentRental(groupId),
    () => loadItems(groupId),
    { fallbackData: [] }
  );

  const items: EquipmentRentalItem[] = data ?? [];

  // 아이템 추가
  async function addItem(
    payload: Omit<EquipmentRentalItem, "id" | "status" | "rentals" | "createdAt">
  ) {
    const newItem: EquipmentRentalItem = {
      ...payload,
      id: crypto.randomUUID(),
      status: "available",
      rentals: [],
      createdAt: new Date().toISOString(),
    };
    const next = [...items, newItem];
    saveItems(groupId, next);
    await mutate(next, false);
  }

  // 아이템 수정
  async function updateItem(
    itemId: string,
    payload: Partial<
      Omit<EquipmentRentalItem, "id" | "status" | "rentals" | "createdAt">
    >
  ) {
    const next = items.map((item) => {
      if (item.id !== itemId) return item;
      const updated = { ...item, ...payload };
      return { ...updated, status: computeStatus(updated) };
    });
    saveItems(groupId, next);
    await mutate(next, false);
  }

  // 아이템 삭제
  async function deleteItem(itemId: string) {
    const next = items.filter((item) => item.id !== itemId);
    saveItems(groupId, next);
    await mutate(next, false);
  }

  // 대여 처리
  async function rentItem(
    itemId: string,
    borrower: string,
    dueDate: string
  ) {
    const next = items.map((item) => {
      if (item.id !== itemId) return item;
      if (item.availableQuantity <= 0) return item;
      const newRental: EquipmentRentalRecord = {
        id: crypto.randomUUID(),
        borrower,
        borrowDate: new Date().toISOString().slice(0, 10),
        dueDate,
      };
      const updated: EquipmentRentalItem = {
        ...item,
        availableQuantity: item.availableQuantity - 1,
        rentals: [...item.rentals, newRental],
      };
      return { ...updated, status: computeStatus(updated) };
    });
    saveItems(groupId, next);
    await mutate(next, false);
  }

  // 반납 처리
  async function returnItem(
    itemId: string,
    rentalId: string,
    condition?: string
  ) {
    const next = items.map((item) => {
      if (item.id !== itemId) return item;
      const updatedRentals = item.rentals.map((r) => {
        if (r.id !== rentalId) return r;
        return {
          ...r,
          returnDate: new Date().toISOString().slice(0, 10),
          condition,
        };
      });
      const updated: EquipmentRentalItem = {
        ...item,
        availableQuantity: Math.min(
          item.availableQuantity + 1,
          item.totalQuantity
        ),
        rentals: updatedRentals,
      };
      return { ...updated, status: computeStatus(updated) };
    });
    saveItems(groupId, next);
    await mutate(next, false);
  }

  // 연체 목록 반환
  function getOverdueRentals(): {
    item: EquipmentRentalItem;
    rental: EquipmentRentalRecord;
  }[] {
    const today = new Date().toISOString().slice(0, 10);
    const result: { item: EquipmentRentalItem; rental: EquipmentRentalRecord }[] =
      [];
    for (const item of items) {
      for (const rental of item.rentals) {
        if (!rental.returnDate && rental.dueDate < today) {
          result.push({ item, rental });
        }
      }
    }
    return result;
  }

  // 통계
  const stats = {
    totalItems: items.length,
    availableItems: items.filter((i) => i.status === "available").length,
    rentedItems: items.filter((i) => i.status === "rented").length,
    overdueItems: items.filter((i) => i.status === "overdue").length,
  };

  return {
    items,
    loading: false,
    addItem,
    updateItem,
    deleteItem,
    rentItem,
    returnItem,
    getOverdueRentals,
    stats,
    refetch: () => mutate(),
  };
}
