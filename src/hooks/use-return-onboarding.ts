"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type {
  OnboardingCheckItem,
  OnboardingCheckItemCategory,
  MemberOnboardingSession,
} from "@/types";

// ============================================
// 스토리지 구조
// ============================================

type ReturnOnboardingStore = {
  checkItems: OnboardingCheckItem[];
  sessions: MemberOnboardingSession[];
};

const STORAGE_PREFIX = "dancebase:return-onboarding:";

function getStorageKey(groupId: string): string {
  return `${STORAGE_PREFIX}${groupId}`;
}

function saveStore(groupId: string, store: ReturnOnboardingStore): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(groupId), JSON.stringify(store));
  } catch {
    // localStorage 용량 초과 등의 경우 무시
  }
}

// ============================================
// 훅
// ============================================

export function useReturnOnboarding(groupId: string) {
  const [checkItems, setCheckItems] = useState<OnboardingCheckItem[]>([]);
  const [sessions, setSessions] = useState<MemberOnboardingSession[]>([]);

  // 저장 + 상태 업데이트 헬퍼
  const persist = useCallback(
    (
      newItems: OnboardingCheckItem[],
      newSessions: MemberOnboardingSession[]
    ) => {
      saveStore(groupId, { checkItems: newItems, sessions: newSessions });
      setCheckItems(newItems);
      setSessions(newSessions);
    },
    [groupId]
  );

  // ----------------------------------------
  // 체크 항목 관리
  // ----------------------------------------

  const addCheckItem = useCallback(
    (
      category: OnboardingCheckItemCategory,
      title: string,
      description: string
    ): boolean => {
      if (!title.trim()) {
        toast.error(TOAST.ITEM_TITLE_REQUIRED);
        return false;
      }
      const now = new Date().toISOString();
      const newItem: OnboardingCheckItem = {
        id: crypto.randomUUID(),
        category,
        title: title.trim(),
        description: description.trim(),
        createdAt: now,
      };
      const updated = [...checkItems, newItem];
      persist(updated, sessions);
      toast.success(TOAST.EQUIPMENT.CHECK_ADDED);
      return true;
    },
    [checkItems, sessions, persist]
  );

  const deleteCheckItem = useCallback(
    (itemId: string): void => {
      const updated = checkItems.filter((item) => item.id !== itemId);
      persist(updated, sessions);
      toast.success(TOAST.EQUIPMENT.CHECK_DELETED);
    },
    [checkItems, sessions, persist]
  );

  // ----------------------------------------
  // 세션 관리
  // ----------------------------------------

  const startSession = useCallback(
    (memberName: string): boolean => {
      if (!memberName.trim()) {
        toast.error(TOAST.MEMBER.NAME_SELECT_REQUIRED);
        return false;
      }
      // 이미 진행 중인 세션이 있으면 중복 방지
      const existing = sessions.find(
        (s) => s.memberName === memberName && !s.completedAt
      );
      if (existing) {
        toast.error(`${memberName}의 진행 중인 세션이 이미 있습니다.`);
        return false;
      }
      const now = new Date().toISOString();
      const newSession: MemberOnboardingSession = {
        id: crypto.randomUUID(),
        memberName: memberName.trim(),
        startDate: now,
        items: checkItems.map((item) => ({
          itemId: item.id,
          checked: false,
        })),
        notes: "",
        createdAt: now,
      };
      const updated = [...sessions, newSession];
      persist(checkItems, updated);
      toast.success(`${memberName}의 복귀 온보딩 세션이 시작되었습니다.`);
      return true;
    },
    [checkItems, sessions, persist]
  );

  const toggleItem = useCallback(
    (sessionId: string, itemId: string): void => {
      const updated = sessions.map((session) => {
        if (session.id !== sessionId) return session;
        const now = new Date().toISOString();
        const updatedItems = session.items.map((item) => {
          if (item.itemId !== itemId) return item;
          if (item.checked) {
            return { ...item, checked: false, checkedAt: undefined };
          }
          return { ...item, checked: true, checkedAt: now };
        });
        return { ...session, items: updatedItems };
      });
      persist(checkItems, updated);
    },
    [checkItems, sessions, persist]
  );

  const completeSession = useCallback(
    (sessionId: string): boolean => {
      const session = sessions.find((s) => s.id === sessionId);
      if (!session) {
        toast.error(TOAST.SESSION.NOT_FOUND);
        return false;
      }
      const allChecked = session.items.every((item) => item.checked);
      if (!allChecked) {
        toast.error(TOAST.EQUIPMENT.ALL_CHECK_REQUIRED);
        return false;
      }
      const now = new Date().toISOString();
      const updated = sessions.map((s) =>
        s.id === sessionId ? { ...s, completedAt: now } : s
      );
      persist(checkItems, updated);
      toast.success(`${session.memberName}의 복귀 온보딩이 완료되었습니다.`);
      return true;
    },
    [checkItems, sessions, persist]
  );

  const deleteSession = useCallback(
    (sessionId: string): void => {
      const updated = sessions.filter((s) => s.id !== sessionId);
      persist(checkItems, updated);
      toast.success(TOAST.SESSION.DELETED);
    },
    [checkItems, sessions, persist]
  );

  const updateSessionNotes = useCallback(
    (sessionId: string, notes: string): void => {
      const updated = sessions.map((s) =>
        s.id === sessionId ? { ...s, notes } : s
      );
      persist(checkItems, updated);
    },
    [checkItems, sessions, persist]
  );

  // ----------------------------------------
  // 조회 헬퍼
  // ----------------------------------------

  const getActiveSession = useCallback(
    (memberName: string): MemberOnboardingSession | undefined => {
      return sessions.find(
        (s) => s.memberName === memberName && !s.completedAt
      );
    },
    [sessions]
  );

  // ----------------------------------------
  // 통계
  // ----------------------------------------

  const totalSessions = sessions.length;
  const activeSessions = sessions.filter((s) => !s.completedAt).length;
  const completedSessions = sessions.filter((s) => !!s.completedAt);
  const averageCompletionRate =
    sessions.length > 0
      ? Math.round(
          (sessions.reduce((acc, session) => {
            if (session.items.length === 0) return acc;
            const rate =
              session.items.filter((i) => i.checked).length /
              session.items.length;
            return acc + rate;
          }, 0) /
            sessions.length) *
            100
        )
      : 0;

  return {
    checkItems,
    sessions,
    loading: false,
    addCheckItem,
    deleteCheckItem,
    startSession,
    toggleItem,
    completeSession,
    deleteSession,
    updateSessionNotes,
    getActiveSession,
    totalSessions,
    activeSessions,
    completedSessions: completedSessions.length,
    averageCompletionRate,
  };
}
