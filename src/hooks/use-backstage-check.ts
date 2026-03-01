"use client";

import { useState, useCallback } from "react";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  BackstageCheckSession,
  BackstageCheckItem,
  BackstageCategory,
} from "@/types";

function getStorageKey(groupId: string, projectId: string): string {
  return `dancebase:backstage-check:${groupId}:${projectId}`;
}

function loadSessions(
  groupId: string,
  projectId: string
): BackstageCheckSession[] {
  return loadFromStorage<BackstageCheckSession[]>(
    getStorageKey(groupId, projectId),
    []
  );
}

function saveSessions(
  groupId: string,
  projectId: string,
  sessions: BackstageCheckSession[]
): void {
  saveToStorage(getStorageKey(groupId, projectId), sessions);
}

export function useBackstageCheck(groupId: string, projectId: string) {
  const [sessions, setSessions] = useState<BackstageCheckSession[]>(() =>
    loadSessions(groupId, projectId)
  );

  const persist = useCallback(
    (next: BackstageCheckSession[]) => {
      setSessions(next);
      saveSessions(groupId, projectId, next);
    },
    [groupId, projectId]
  );

  // 세션 생성
  const createSession = useCallback(
    (eventName: string, eventDate: string): boolean => {
      if (!eventName.trim() || !eventDate) return false;
      const newSession: BackstageCheckSession = {
        id: crypto.randomUUID(),
        eventName: eventName.trim(),
        eventDate,
        items: [],
        startedAt: new Date().toISOString(),
      };
      persist([...sessions, newSession]);
      return true;
    },
    [sessions, persist]
  );

  // 세션 삭제
  const deleteSession = useCallback(
    (sessionId: string): void => {
      persist(sessions.filter((s) => s.id !== sessionId));
    },
    [sessions, persist]
  );

  // 항목 추가
  const addItem = useCallback(
    (
      sessionId: string,
      category: BackstageCategory,
      title: string,
      description?: string,
      assignedTo?: string,
      priority: "high" | "medium" | "low" = "medium"
    ): boolean => {
      if (!title.trim()) return false;
      const session = sessions.find((s) => s.id === sessionId);
      if (!session) return false;

      const newItem: BackstageCheckItem = {
        id: crypto.randomUUID(),
        category,
        title: title.trim(),
        description: description?.trim() || undefined,
        assignedTo: assignedTo?.trim() || undefined,
        checked: false,
        priority,
        order: session.items.length,
        createdAt: new Date().toISOString(),
      };

      const updated = sessions.map((s) =>
        s.id === sessionId ? { ...s, items: [...s.items, newItem] } : s
      );
      persist(updated);
      return true;
    },
    [sessions, persist]
  );

  // 항목 제거
  const removeItem = useCallback(
    (sessionId: string, itemId: string): void => {
      const updated = sessions.map((s) =>
        s.id === sessionId
          ? { ...s, items: s.items.filter((item) => item.id !== itemId) }
          : s
      );
      persist(updated);
    },
    [sessions, persist]
  );

  // 체크 토글
  const toggleCheck = useCallback(
    (sessionId: string, itemId: string, checkedBy: string): void => {
      const updated = sessions.map((s) => {
        if (s.id !== sessionId) return s;
        const items = s.items.map((item) => {
          if (item.id !== itemId) return item;
          const nowChecked = !item.checked;
          return {
            ...item,
            checked: nowChecked,
            checkedAt: nowChecked ? new Date().toISOString() : undefined,
            checkedBy: nowChecked ? checkedBy : undefined,
          };
        });
        return { ...s, items };
      });
      persist(updated);
    },
    [sessions, persist]
  );

  // 세션 완료
  const completeSession = useCallback(
    (sessionId: string): boolean => {
      const session = sessions.find((s) => s.id === sessionId);
      if (!session) return false;
      if (session.items.length === 0) return false;
      const allChecked = session.items.every((item) => item.checked);
      if (!allChecked) return false;

      const updated = sessions.map((s) =>
        s.id === sessionId
          ? { ...s, completedAt: new Date().toISOString() }
          : s
      );
      persist(updated);
      return true;
    },
    [sessions, persist]
  );

  // 통계
  const totalSessions = sessions.length;
  const activeSession = sessions.find((s) => !s.completedAt) ?? null;
  const checkProgress = activeSession
    ? {
        checked: activeSession.items.filter((i) => i.checked).length,
        total: activeSession.items.length,
      }
    : { checked: 0, total: 0 };

  return {
    sessions,
    totalSessions,
    activeSession,
    checkProgress,
    createSession,
    deleteSession,
    addItem,
    removeItem,
    toggleCheck,
    completeSession,
  };
}
