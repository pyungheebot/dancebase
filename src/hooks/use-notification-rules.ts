"use client";

import { useState, useCallback, useMemo } from "react";
import type {
  NotificationRule,
  NotificationCondition,
  NotificationRuleAction,
} from "@/types";

// ============================================
// 상수
// ============================================

const STORAGE_KEY_PREFIX = "dancebase:notification-rules:";

// ============================================
// 기본 규칙 정의
// ============================================

function buildDefaultRules(groupId: string): NotificationRule[] {
  const now = new Date().toISOString();
  return [
    {
      id: "default-attendance-below",
      groupId,
      name: "출석률 70% 미만 경고",
      enabled: true,
      conditions: [{ type: "attendance_below", value: 70 }],
      action: "in-app" as NotificationRuleAction,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "default-schedule-upcoming",
      groupId,
      name: "3일 전 일정 알림",
      enabled: true,
      conditions: [{ type: "schedule_upcoming", value: 3 }],
      action: "in-app" as NotificationRuleAction,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "default-new-post",
      groupId,
      name: "새 게시글 알림",
      enabled: true,
      conditions: [{ type: "new_post" }],
      action: "in-app" as NotificationRuleAction,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

// ============================================
// localStorage 헬퍼
// ============================================

function getStorageKey(groupId: string): string {
  return `${STORAGE_KEY_PREFIX}${groupId}`;
}

function saveRulesToStorage(groupId: string, rules: NotificationRule[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(groupId), JSON.stringify(rules));
  } catch {
    // 무시
  }
}

// ============================================
// 훅
// ============================================

export function useNotificationRules(groupId: string) {
  const defaultRules = useMemo(() => buildDefaultRules(groupId), [groupId]);
  const [userRules, setUserRules] = useState<NotificationRule[]>([]);

  // 마운트 시 localStorage에서 사용자 규칙 로드

  // 기본 규칙 + 사용자 규칙 합산
  const allRules = useMemo(
    () => [...defaultRules, ...userRules],
    [defaultRules, userRules]
  );

  // ---- CRUD ----

  /** 새 규칙 추가 */
  const addRule = useCallback(
    (params: {
      name: string;
      conditions: NotificationCondition[];
      action?: NotificationRuleAction;
    }): NotificationRule => {
      const now = new Date().toISOString();
      const newRule: NotificationRule = {
        id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        groupId,
        name: params.name,
        enabled: true,
        conditions: params.conditions,
        action: params.action ?? "in-app",
        isDefault: false,
        createdAt: now,
        updatedAt: now,
      };
      setUserRules((prev) => {
        const updated = [...prev, newRule];
        saveRulesToStorage(groupId, updated);
        return updated;
      });
      return newRule;
    },
    [groupId]
  );

  /** 규칙 수정 (기본 규칙은 enabled 만 수정 가능) */
  const updateRule = useCallback(
    (
      id: string,
      updates: Partial<Pick<NotificationRule, "name" | "enabled" | "conditions" | "action">>
    ): boolean => {
      // 기본 규칙인지 확인
      const isDefaultRule = defaultRules.some((r) => r.id === id);

      if (isDefaultRule) {
        // 기본 규칙은 enabled 상태만 localStorage 오버라이드로 저장
        if (updates.enabled === undefined) return false;

        setUserRules((prev) => {
          // 이미 오버라이드 항목이 있으면 업데이트
          const existingIdx = prev.findIndex((r) => r.id === id);
          if (existingIdx !== -1) {
            const updated = [...prev];
            updated[existingIdx] = {
              ...updated[existingIdx],
              enabled: updates.enabled!,
              updatedAt: new Date().toISOString(),
            };
            saveRulesToStorage(groupId, updated);
            return updated;
          }
          // 없으면 기본 규칙 복사 후 오버라이드
          const base = defaultRules.find((r) => r.id === id)!;
          const override: NotificationRule = {
            ...base,
            enabled: updates.enabled!,
            updatedAt: new Date().toISOString(),
          };
          const updated = [...prev, override];
          saveRulesToStorage(groupId, updated);
          return updated;
        });
        return true;
      }

      // 사용자 규칙 수정
      setUserRules((prev) => {
        const idx = prev.findIndex((r) => r.id === id);
        if (idx === -1) return prev;
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        saveRulesToStorage(groupId, updated);
        return updated;
      });
      return true;
    },
    [groupId, defaultRules]
  );

  /** 규칙 삭제 (기본 규칙은 삭제 불가) */
  const deleteRule = useCallback(
    (id: string): boolean => {
      const isDefaultRule = defaultRules.some((r) => r.id === id);
      if (isDefaultRule) return false;

      setUserRules((prev) => {
        const updated = prev.filter((r) => r.id !== id);
        if (updated.length === prev.length) return prev;
        saveRulesToStorage(groupId, updated);
        return updated;
      });
      return true;
    },
    [groupId, defaultRules]
  );

  /** 규칙 활성화/비활성화 토글 */
  const toggleRule = useCallback(
    (id: string): void => {
      const rule = allRules.find((r) => r.id === id);
      if (!rule) return;
      updateRule(id, { enabled: !rule.enabled });
    },
    [allRules, updateRule]
  );

  return {
    rules: allRules,
    userRules,
    defaultRules,
    addRule,
    updateRule,
    deleteRule,
    toggleRule,
  };
}

// 타입 re-export
export type { NotificationRule, NotificationCondition, NotificationRuleAction };
