"use client";

import { useState, useCallback } from "react";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";

// ============================================================
// 알림 카테고리 타입
// ============================================================

export type NotificationCategory =
  | "schedule"
  | "attendance"
  | "finance"
  | "board"
  | "member";

export type NotificationPreferences = Record<NotificationCategory, boolean>;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  schedule: true,
  attendance: true,
  finance: true,
  board: true,
  member: true,
};

export const NOTIFICATION_CATEGORIES: {
  key: NotificationCategory;
  label: string;
  description: string;
}[] = [
  {
    key: "schedule",
    label: "일정 알림",
    description: "새 일정, 일정 변경, 리마인더",
  },
  {
    key: "attendance",
    label: "출석 알림",
    description: "출석 체크 시작, 출석 결과",
  },
  {
    key: "finance",
    label: "회비 알림",
    description: "납부 요청, 정산 완료",
  },
  {
    key: "board",
    label: "게시판 알림",
    description: "새 게시글, 댓글, 좋아요",
  },
  {
    key: "member",
    label: "멤버 알림",
    description: "신규 가입, 역할 변경",
  },
];

// ============================================================
// localStorage 키 생성
// ============================================================

function buildStorageKey(groupId: string, userId: string): string {
  return `notification-prefs-${groupId}-${userId}`;
}

// ============================================================
// 훅
// ============================================================

export function useNotificationPreferences(
  groupId: string,
  userId: string | null | undefined
) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    () => {
      if (!groupId || !userId) return { ...DEFAULT_NOTIFICATION_PREFERENCES };
      return loadFromStorage<NotificationPreferences>(buildStorageKey(groupId, userId), { ...DEFAULT_NOTIFICATION_PREFERENCES });
    }
  );

  // userId가 늦게 로드되는 경우 대비: userId 확정 후 다시 로드

  const toggle = useCallback(
    (category: NotificationCategory) => {
      if (!groupId || !userId) return;
      setPreferences((prev) => {
        const next = { ...prev, [category]: !prev[category] };
        saveToStorage(buildStorageKey(groupId, userId), next);
        return next;
      });
    },
    [groupId, userId]
  );

  const enableAll = useCallback(() => {
    if (!groupId || !userId) return;
    const next: NotificationPreferences = {
      schedule: true,
      attendance: true,
      finance: true,
      board: true,
      member: true,
    };
    saveToStorage(buildStorageKey(groupId, userId), next);
    setPreferences(next);
  }, [groupId, userId]);

  const disableAll = useCallback(() => {
    if (!groupId || !userId) return;
    const next: NotificationPreferences = {
      schedule: false,
      attendance: false,
      finance: false,
      board: false,
      member: false,
    };
    saveToStorage(buildStorageKey(groupId, userId), next);
    setPreferences(next);
  }, [groupId, userId]);

  const isAllEnabled = Object.values(preferences).every(Boolean);
  const isAllDisabled = Object.values(preferences).every((v) => !v);

  return {
    preferences,
    toggle,
    enableAll,
    disableAll,
    isAllEnabled,
    isAllDisabled,
  };
}
