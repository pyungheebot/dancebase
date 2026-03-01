"use client";

import { useState, useCallback } from "react";
import { saveToStorage } from "@/lib/local-storage";
import type {
  AttendanceExcuseEntry,
  AttendanceExcuseItem,
  AttendanceExcuseType,
  AttendanceExcuseReason,
  AttendanceExcuseStatus,
} from "@/types";

// ============================================
// 상수
// ============================================

const STORAGE_KEY_PREFIX = "attendance-excuse-";

export const EXCUSE_TYPE_LABELS: Record<AttendanceExcuseType, string> = {
  absent: "불참",
  late: "지각",
  early_leave: "조퇴",
};

export const EXCUSE_TYPE_COLORS: Record<AttendanceExcuseType, string> = {
  absent: "bg-red-100 text-red-700 border-red-200",
  late: "bg-orange-100 text-orange-700 border-orange-200",
  early_leave: "bg-yellow-100 text-yellow-700 border-yellow-200",
};

export const EXCUSE_REASON_LABELS: Record<AttendanceExcuseReason, string> = {
  health: "건강",
  study: "학업",
  work: "직장",
  family: "가정",
  other: "기타",
};

export const EXCUSE_STATUS_LABELS: Record<AttendanceExcuseStatus, string> = {
  pending: "검토중",
  approved: "승인",
  rejected: "반려",
};

export const EXCUSE_STATUS_COLORS: Record<AttendanceExcuseStatus, string> = {
  pending: "bg-blue-100 text-blue-700 border-blue-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-gray-100 text-gray-600 border-gray-200",
};

export const ALL_EXCUSE_TYPES: AttendanceExcuseType[] = [
  "absent",
  "late",
  "early_leave",
];

export const ALL_EXCUSE_REASONS: AttendanceExcuseReason[] = [
  "health",
  "study",
  "work",
  "family",
  "other",
];

export const ALL_EXCUSE_STATUSES: AttendanceExcuseStatus[] = [
  "pending",
  "approved",
  "rejected",
];

// ============================================
// localStorage 헬퍼
// ============================================

function getStorageKey(groupId: string): string {
  return `${STORAGE_KEY_PREFIX}${groupId}`;
}

function makeEmpty(groupId: string): AttendanceExcuseEntry {
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

export function useAttendanceExcuse(groupId: string) {
  const [entry, setEntry] = useState<AttendanceExcuseEntry>(() =>
    makeEmpty(groupId)
  );

  // 상태 업데이트 + localStorage 동기화
  const updateEntry = useCallback(
    (updater: (prev: AttendanceExcuseEntry) => AttendanceExcuseEntry) => {
      setEntry((prev) => {
        const next = updater({ ...prev, updatedAt: new Date().toISOString() });
        saveToStorage(getStorageKey(entry.groupId), next);
        return next;
      });
    },
    []
  );

  // ============================================
  // 사유서 제출
  // ============================================

  /** 사유서 새로 제출 */
  const submitExcuse = useCallback(
    (
      memberName: string,
      date: string,
      type: AttendanceExcuseType,
      reason: AttendanceExcuseReason,
      detail: string
    ) => {
      const trimmedName = memberName.trim();
      const trimmedDetail = detail.trim();
      if (!trimmedName || !date || !trimmedDetail) return;

      const newItem: AttendanceExcuseItem = {
        id: crypto.randomUUID(),
        memberName: trimmedName,
        date,
        type,
        reason,
        detail: trimmedDetail,
        status: "pending",
        submittedAt: new Date().toISOString(),
      };

      updateEntry((prev) => ({
        ...prev,
        items: [newItem, ...prev.items],
      }));
    },
    [updateEntry]
  );

  // ============================================
  // 사유서 삭제
  // ============================================

  /** 사유서 삭제 */
  const removeExcuse = useCallback(
    (itemId: string) => {
      updateEntry((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.id !== itemId),
      }));
    },
    [updateEntry]
  );

  // ============================================
  // 승인 / 반려
  // ============================================

  /** 사유서 승인 */
  const approveExcuse = useCallback(
    (itemId: string, approverName: string) => {
      const trimmed = approverName.trim();
      updateEntry((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                status: "approved" as const,
                approverName: trimmed || "관리자",
                approvedAt: new Date().toISOString(),
              }
            : item
        ),
      }));
    },
    [updateEntry]
  );

  /** 사유서 반려 */
  const rejectExcuse = useCallback(
    (itemId: string, approverName: string) => {
      const trimmed = approverName.trim();
      updateEntry((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                status: "rejected" as const,
                approverName: trimmed || "관리자",
                approvedAt: new Date().toISOString(),
              }
            : item
        ),
      }));
    },
    [updateEntry]
  );

  // ============================================
  // 파생 데이터
  // ============================================

  const pendingItems = entry.items.filter((i) => i.status === "pending");
  const approvedItems = entry.items.filter((i) => i.status === "approved");
  const rejectedItems = entry.items.filter((i) => i.status === "rejected");

  /** 멤버 이름별 필터 */
  const getByMember = useCallback(
    (memberName: string) =>
      entry.items.filter((i) =>
        i.memberName.toLowerCase().includes(memberName.toLowerCase())
      ),
    [entry.items]
  );

  /** 상태별 필터 */
  const getByStatus = useCallback(
    (status: AttendanceExcuseStatus) =>
      entry.items.filter((i) => i.status === status),
    [entry.items]
  );

  return {
    entry,
    items: entry.items,
    pendingItems,
    approvedItems,
    rejectedItems,
    submitExcuse,
    removeExcuse,
    approveExcuse,
    rejectExcuse,
    getByMember,
    getByStatus,
  };
}
