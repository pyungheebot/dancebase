"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { swrKeys } from "@/lib/swr/keys";
import type {
  GroupEquipmentData,
  GroupEquipmentItem,
  EquipmentLoanRecord,
  EquipmentCategory,
  GroupEquipmentCondition,
} from "@/types";

// ——————————————————————————————
// localStorage 헬퍼
// ——————————————————————————————

function loadData(groupId: string): GroupEquipmentData {
  if (typeof window === "undefined") {
    return { groupId, items: [], loans: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(`group-equipment-${groupId}`);
    if (!raw) return { groupId, items: [], loans: [], updatedAt: new Date().toISOString() };
    return JSON.parse(raw) as GroupEquipmentData;
  } catch {
    return { groupId, items: [], loans: [], updatedAt: new Date().toISOString() };
  }
}

function persistData(data: GroupEquipmentData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `group-equipment-${data.groupId}`,
      JSON.stringify({ ...data, updatedAt: new Date().toISOString() })
    );
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

// ——————————————————————————————
// 훅
// ——————————————————————————————

export type AddItemParams = {
  name: string;
  category: EquipmentCategory;
  quantity: number;
  condition: GroupEquipmentCondition;
  location: string | null;
  notes: string;
};

export type UpdateItemParams = Partial<Omit<GroupEquipmentItem, "id" | "createdAt">>;

export type BorrowItemParams = {
  equipmentId: string;
  borrowerName: string;
  quantity: number;
  notes: string;
};

export function useGroupEquipment(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.groupEquipment(groupId),
    () => loadData(groupId),
    { revalidateOnFocus: false }
  );

  const equipment: GroupEquipmentData = data ?? {
    groupId,
    items: [],
    loans: [],
    updatedAt: new Date().toISOString(),
  };

  // ——— 장비 추가 ———
  const addItem = useCallback(
    (params: AddItemParams) => {
      const current = loadData(groupId);
      const newItem: GroupEquipmentItem = {
        id: crypto.randomUUID(),
        name: params.name,
        category: params.category,
        quantity: params.quantity,
        condition: params.condition,
        location: params.location,
        notes: params.notes,
        createdAt: new Date().toISOString(),
      };
      const updated: GroupEquipmentData = {
        ...current,
        items: [newItem, ...current.items],
        updatedAt: new Date().toISOString(),
      };
      persistData(updated);
      mutate(updated, false);
    },
    [groupId, mutate]
  );

  // ——— 장비 수정 ———
  const updateItem = useCallback(
    (itemId: string, params: UpdateItemParams) => {
      const current = loadData(groupId);
      const updated: GroupEquipmentData = {
        ...current,
        items: current.items.map((item) =>
          item.id !== itemId ? item : { ...item, ...params }
        ),
        updatedAt: new Date().toISOString(),
      };
      persistData(updated);
      mutate(updated, false);
    },
    [groupId, mutate]
  );

  // ——— 장비 삭제 ———
  const deleteItem = useCallback(
    (itemId: string) => {
      const current = loadData(groupId);
      const updated: GroupEquipmentData = {
        ...current,
        items: current.items.filter((item) => item.id !== itemId),
        // 해당 장비의 대여 기록도 함께 제거
        loans: current.loans.filter((loan) => loan.equipmentId !== itemId),
        updatedAt: new Date().toISOString(),
      };
      persistData(updated);
      mutate(updated, false);
    },
    [groupId, mutate]
  );

  // ——— 장비 대여 ———
  const borrowItem = useCallback(
    (params: BorrowItemParams) => {
      const current = loadData(groupId);
      const newLoan: EquipmentLoanRecord = {
        id: crypto.randomUUID(),
        equipmentId: params.equipmentId,
        borrowerName: params.borrowerName,
        borrowedAt: new Date().toISOString(),
        returnedAt: null,
        quantity: params.quantity,
        notes: params.notes,
      };
      const updated: GroupEquipmentData = {
        ...current,
        loans: [newLoan, ...current.loans],
        updatedAt: new Date().toISOString(),
      };
      persistData(updated);
      mutate(updated, false);
    },
    [groupId, mutate]
  );

  // ——— 장비 반납 ———
  const returnItem = useCallback(
    (loanId: string) => {
      const current = loadData(groupId);
      const updated: GroupEquipmentData = {
        ...current,
        loans: current.loans.map((loan) =>
          loan.id !== loanId
            ? loan
            : { ...loan, returnedAt: new Date().toISOString() }
        ),
        updatedAt: new Date().toISOString(),
      };
      persistData(updated);
      mutate(updated, false);
    },
    [groupId, mutate]
  );

  // ——— 대여 기록 삭제 ———
  const deleteLoan = useCallback(
    (loanId: string) => {
      const current = loadData(groupId);
      const updated: GroupEquipmentData = {
        ...current,
        loans: current.loans.filter((loan) => loan.id !== loanId),
        updatedAt: new Date().toISOString(),
      };
      persistData(updated);
      mutate(updated, false);
    },
    [groupId, mutate]
  );

  // ——————————————————————————————
  // 통계 계산
  // ——————————————————————————————

  const items = equipment.items;
  const loans = equipment.loans;

  // 전체 장비 종류 수
  const totalItems = items.length;

  // 현재 대여 중인 기록 수 (미반납)
  const activeLoans = loans.filter((loan) => loan.returnedAt === null);
  const onLoanCount = activeLoans.length;

  // 카테고리별 장비 수
  const categoryBreakdown: Record<EquipmentCategory, number> = {
    audio: 0,
    lighting: 0,
    costume: 0,
    prop: 0,
    other: 0,
  };
  for (const item of items) {
    categoryBreakdown[item.category] = (categoryBreakdown[item.category] ?? 0) + 1;
  }

  // 상태별 장비 수
  const conditionSummary: Record<GroupEquipmentCondition, number> = {
    good: 0,
    fair: 0,
    poor: 0,
    broken: 0,
  };
  for (const item of items) {
    conditionSummary[item.condition] = (conditionSummary[item.condition] ?? 0) + 1;
  }

  return {
    equipment,
    loading: isLoading,
    refetch: () => mutate(),
    // CRUD
    addItem,
    updateItem,
    deleteItem,
    // 대여/반납
    borrowItem,
    returnItem,
    deleteLoan,
    // 통계
    totalItems,
    onLoanCount,
    activeLoans,
    categoryBreakdown,
    conditionSummary,
  };
}
