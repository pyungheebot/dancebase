"use client";

import { useState, useEffect, useCallback } from "react";
import type { CostumeItem, CostumeAssignment, CostumeStore, CostumeStatus } from "@/types";

// ============================================
// 상수
// ============================================

export const COSTUME_CATEGORIES = ["상의", "하의", "신발", "악세서리", "소품", "기타"] as const;
export const COSTUME_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "FREE"] as const;

export const COSTUME_STATUS_LABELS: Record<CostumeStatus, string> = {
  planned: "준비 예정",
  ordered: "주문 완료",
  arrived: "입고 완료",
  distributed: "배포 완료",
  returned: "반납 완료",
};

// ============================================
// localStorage 헬퍼
// ============================================

function storageKey(groupId: string, projectId: string): string {
  return `dancebase:costumes:${groupId}:${projectId}`;
}

function loadStore(groupId: string, projectId: string): CostumeStore {
  if (typeof window === "undefined") {
    return { items: [], assignments: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(storageKey(groupId, projectId));
    if (!raw) return { items: [], assignments: [], updatedAt: new Date().toISOString() };
    return JSON.parse(raw) as CostumeStore;
  } catch {
    return { items: [], assignments: [], updatedAt: new Date().toISOString() };
  }
}

function saveStore(groupId: string, projectId: string, store: CostumeStore): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      storageKey(groupId, projectId),
      JSON.stringify({ ...store, updatedAt: new Date().toISOString() })
    );
  } catch {
    // 무시
  }
}

// ============================================
// 훅
// ============================================

export function useCostumeManagement(groupId: string, projectId: string) {
  const [store, setStore] = useState<CostumeStore>({
    items: [],
    assignments: [],
    updatedAt: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    if (!groupId || !projectId) {
      setLoading(false);
      return;
    }
    const data = loadStore(groupId, projectId);
    setStore(data);
    setLoading(false);
  }, [groupId, projectId]);

  useEffect(() => {
    reload();
  }, [reload]);

  // 저장 헬퍼
  const persist = useCallback(
    (next: CostumeStore) => {
      saveStore(groupId, projectId, next);
      setStore(next);
    },
    [groupId, projectId]
  );

  // ============================================
  // 의상 추가
  // ============================================
  const addItem = useCallback(
    (payload: {
      name: string;
      category: string;
      color: string;
      totalQuantity: number;
      status: CostumeStatus;
      note: string;
    }): boolean => {
      if (!payload.name.trim()) return false;

      const newItem: CostumeItem = {
        id: crypto.randomUUID(),
        name: payload.name.trim(),
        category: payload.category,
        color: payload.color.trim(),
        totalQuantity: payload.totalQuantity,
        availableQuantity: payload.totalQuantity,
        status: payload.status,
        note: payload.note.trim(),
        createdAt: new Date().toISOString(),
      };

      const next: CostumeStore = {
        ...store,
        items: [newItem, ...store.items],
      };
      persist(next);
      return true;
    },
    [store, persist]
  );

  // ============================================
  // 의상 수정
  // ============================================
  const updateItem = useCallback(
    (
      id: string,
      patch: Partial<Pick<CostumeItem, "name" | "category" | "color" | "totalQuantity" | "status" | "note">>
    ): void => {
      const next: CostumeStore = {
        ...store,
        items: store.items.map((item) => {
          if (item.id !== id) return item;
          // totalQuantity 변경 시 availableQuantity 재계산
          const assignedCount = store.assignments.filter(
            (a) => a.costumeId === id && !a.returned
          ).length;
          const newTotal = patch.totalQuantity ?? item.totalQuantity;
          const newAvailable = Math.max(0, newTotal - assignedCount);
          return {
            ...item,
            ...patch,
            availableQuantity: patch.totalQuantity !== undefined ? newAvailable : item.availableQuantity,
          };
        }),
      };
      persist(next);
    },
    [store, persist]
  );

  // ============================================
  // 의상 삭제
  // ============================================
  const deleteItem = useCallback(
    (id: string): void => {
      const next: CostumeStore = {
        ...store,
        items: store.items.filter((item) => item.id !== id),
        assignments: store.assignments.filter((a) => a.costumeId !== id),
      };
      persist(next);
    },
    [store, persist]
  );

  // ============================================
  // 멤버 배정
  // ============================================
  const assignMember = useCallback(
    (payload: {
      costumeId: string;
      memberId: string;
      memberName: string;
      size: string;
    }): boolean => {
      const item = store.items.find((i) => i.id === payload.costumeId);
      if (!item) return false;

      // 이미 배정된 경우 중복 방지
      const alreadyAssigned = store.assignments.some(
        (a) =>
          a.costumeId === payload.costumeId &&
          a.memberId === payload.memberId &&
          !a.returned
      );
      if (alreadyAssigned) return false;

      // 재고 부족
      if (item.availableQuantity <= 0) return false;

      const newAssignment: CostumeAssignment = {
        costumeId: payload.costumeId,
        memberId: payload.memberId,
        memberName: payload.memberName.trim(),
        size: payload.size,
        returned: false,
      };

      const next: CostumeStore = {
        ...store,
        items: store.items.map((i) =>
          i.id === payload.costumeId
            ? { ...i, availableQuantity: i.availableQuantity - 1 }
            : i
        ),
        assignments: [...store.assignments, newAssignment],
      };
      persist(next);
      return true;
    },
    [store, persist]
  );

  // ============================================
  // 배정 해제
  // ============================================
  const unassignMember = useCallback(
    (costumeId: string, memberId: string): void => {
      const next: CostumeStore = {
        ...store,
        items: store.items.map((i) =>
          i.id === costumeId
            ? { ...i, availableQuantity: i.availableQuantity + 1 }
            : i
        ),
        assignments: store.assignments.filter(
          (a) => !(a.costumeId === costumeId && a.memberId === memberId)
        ),
      };
      persist(next);
    },
    [store, persist]
  );

  // ============================================
  // 반납 처리
  // ============================================
  const markReturned = useCallback(
    (costumeId: string, memberId: string, returned: boolean): void => {
      const next: CostumeStore = {
        ...store,
        items: store.items.map((i) => {
          if (i.id !== costumeId) return i;
          // 반납 시 availableQuantity 증가, 반납 취소 시 감소
          const delta = returned ? 1 : -1;
          return { ...i, availableQuantity: Math.max(0, i.availableQuantity + delta) };
        }),
        assignments: store.assignments.map((a) =>
          a.costumeId === costumeId && a.memberId === memberId
            ? { ...a, returned }
            : a
        ),
      };
      persist(next);
    },
    [store, persist]
  );

  // ============================================
  // 통계
  // ============================================
  const totalItems = store.items.length;
  const totalAssignments = store.assignments.length;
  const returnedCount = store.assignments.filter((a) => a.returned).length;
  const pendingReturnCount = store.assignments.filter((a) => !a.returned).length;

  const itemsByStatus = (status: CostumeStatus) =>
    store.items.filter((i) => i.status === status);

  const assignmentsForItem = (costumeId: string) =>
    store.assignments.filter((a) => a.costumeId === costumeId);

  return {
    items: store.items,
    assignments: store.assignments,
    loading,
    // 통계
    totalItems,
    totalAssignments,
    returnedCount,
    pendingReturnCount,
    // 헬퍼
    itemsByStatus,
    assignmentsForItem,
    // CRUD
    addItem,
    updateItem,
    deleteItem,
    assignMember,
    unassignMember,
    markReturned,
    reload,
  };
}
