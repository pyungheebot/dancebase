"use client";

import { useState, useCallback } from "react";
import { saveToStorage } from "@/lib/local-storage";
import type {
  RoleAssignmentEntry,
  RoleAssignmentItem,
  RoleAssignmentStatus,
} from "@/types";

// ============================================
// 상수
// ============================================

const STORAGE_KEY_PREFIX = "role-assignment-";

export const ROLE_STATUS_LABELS: Record<RoleAssignmentStatus, string> = {
  active: "활성",
  expired: "만료",
};

export const ROLE_STATUS_COLORS: Record<RoleAssignmentStatus, string> = {
  active: "bg-green-100 text-green-700 border-green-200",
  expired: "bg-gray-100 text-gray-500 border-gray-200",
};

/** 미리 정의된 역할 이름 목록 (빠른 선택용) */
export const PRESET_ROLE_NAMES = [
  "리더",
  "서브리더",
  "총무",
  "회계",
  "홍보",
  "장비 담당",
  "일정 관리",
  "SNS 담당",
  "코스튬 담당",
  "음향 담당",
];

// ============================================
// localStorage 헬퍼
// ============================================

function getStorageKey(groupId: string): string {
  return `${STORAGE_KEY_PREFIX}${groupId}`;
}

function makeEmpty(groupId: string): RoleAssignmentEntry {
  return {
    id: crypto.randomUUID(),
    groupId,
    items: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ============================================
// 훅
// ============================================

export function useRoleAssignment(groupId: string) {
  const [entry, setEntry] = useState<RoleAssignmentEntry>(() =>
    makeEmpty(groupId)
  );

  // 상태 업데이트 + localStorage 동기화
  const updateEntry = useCallback(
    (updater: (prev: RoleAssignmentEntry) => RoleAssignmentEntry) => {
      setEntry((prev) => {
        const next = updater({ ...prev, updatedAt: new Date().toISOString() });
        saveToStorage(getStorageKey(groupId), next);
        return next;
      });
    },
    [groupId]
  );

  // ============================================
  // 역할 추가
  // ============================================

  const addItem = useCallback(
    (params: {
      roleName: string;
      description?: string;
      assignee: string;
      startDate: string;
      endDate?: string;
    }) => {
      const trimmedRole = params.roleName.trim();
      const trimmedAssignee = params.assignee.trim();
      if (!trimmedRole || !trimmedAssignee) return false;

      const now = new Date().toISOString();
      const newItem: RoleAssignmentItem = {
        id: crypto.randomUUID(),
        roleName: trimmedRole,
        description: params.description?.trim(),
        assignee: trimmedAssignee,
        startDate: params.startDate,
        endDate: params.endDate,
        status: "active",
        history: [],
        createdAt: now,
        updatedAt: now,
      };

      updateEntry((prev) => ({
        ...prev,
        items: [...prev.items, newItem],
      }));
      return true;
    },
    [updateEntry]
  );

  // ============================================
  // 역할 수정 (이름, 설명, 기간)
  // ============================================

  const updateItem = useCallback(
    (
      itemId: string,
      patch: Partial<
        Pick<
          RoleAssignmentItem,
          "roleName" | "description" | "startDate" | "endDate" | "status"
        >
      >
    ) => {
      updateEntry((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id === itemId
            ? { ...item, ...patch, updatedAt: new Date().toISOString() }
            : item
        ),
      }));
    },
    [updateEntry]
  );

  // ============================================
  // 담당자 변경 (이력 자동 기록)
  // ============================================

  const changeAssignee = useCallback(
    (
      itemId: string,
      nextAssignee: string,
      changedBy: string,
      note?: string
    ) => {
      const trimmed = nextAssignee.trim();
      if (!trimmed) return false;

      updateEntry((prev) => ({
        ...prev,
        items: prev.items.map((item) => {
          if (item.id !== itemId) return item;

          const historyItem = {
            id: crypto.randomUUID(),
            changedAt: new Date().toISOString(),
            changedBy: changedBy.trim() || "알 수 없음",
            prevAssignee: item.assignee,
            nextAssignee: trimmed,
            note: note?.trim(),
          };

          return {
            ...item,
            assignee: trimmed,
            history: [...item.history, historyItem],
            updatedAt: new Date().toISOString(),
          };
        }),
      }));
      return true;
    },
    [updateEntry]
  );

  // ============================================
  // 역할 삭제
  // ============================================

  const removeItem = useCallback(
    (itemId: string) => {
      updateEntry((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.id !== itemId),
      }));
    },
    [updateEntry]
  );

  // ============================================
  // 상태 토글 (활성 <-> 만료)
  // ============================================

  const toggleStatus = useCallback(
    (itemId: string) => {
      updateEntry((prev) => ({
        ...prev,
        items: prev.items.map((item) => {
          if (item.id !== itemId) return item;
          const next: RoleAssignmentStatus =
            item.status === "active" ? "expired" : "active";
          return { ...item, status: next, updatedAt: new Date().toISOString() };
        }),
      }));
    },
    [updateEntry]
  );

  // ============================================
  // 파생 데이터
  // ============================================

  const activeItems = entry.items.filter((i) => i.status === "active");
  const expiredItems = entry.items.filter((i) => i.status === "expired");

  return {
    entry,
    items: entry.items,
    activeItems,
    expiredItems,
    addItem,
    updateItem,
    changeAssignee,
    removeItem,
    toggleStatus,
  };
}
