"use client";

import { useCallback, useState } from "react";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  BackstageLogData,
  BackstageLogSession,
  BackstageLogEntry,
  BackstageLogCategory,
} from "@/types";

// ============================================================
// localStorage 헬퍼
// ============================================================

function getStorageKey(projectId: string): string {
  return swrKeys.backstageLog(projectId);
}

// ============================================================
// 훅
// ============================================================

export function useBackstageLog(projectId: string) {
  const [sessions, setSessions] = useState<BackstageLogSession[]>(() =>
    projectId ? loadFromStorage<BackstageLogData>(getStorageKey(projectId), {} as BackstageLogData).sessions : []
  );

  const reload = useCallback(() => {
    setSessions(projectId ? loadFromStorage<BackstageLogData>(getStorageKey(projectId), {} as BackstageLogData).sessions : []);
  }, [projectId]);

  // 내부 persist 헬퍼
  const persist = useCallback(
    (nextSessions: BackstageLogSession[]) => {
      const now = new Date().toISOString();
      saveToStorage(getStorageKey(projectId), { projectId, sessions: nextSessions, updatedAt: now });
      setSessions(nextSessions);
    },
    [projectId]
  );

  // ────────────────────────────────────────────
  // 세션 CRUD
  // ────────────────────────────────────────────

  /** 세션 생성 */
  const createSession = useCallback(
    (params: { showName: string; showDate: string }): BackstageLogSession => {
      const now = new Date().toISOString();
      // 기존 활성 세션을 모두 종료
      const closedSessions = sessions.map((s) =>
        s.isActive ? { ...s, isActive: false } : s
      );
      const newSession: BackstageLogSession = {
        id: crypto.randomUUID(),
        showName: params.showName.trim(),
        showDate: params.showDate,
        entries: [],
        isActive: true,
        createdAt: now,
      };
      persist([...closedSessions, newSession]);
      return newSession;
    },
    [sessions, persist]
  );

  /** 세션 종료 */
  const endSession = useCallback(
    (sessionId: string): void => {
      const next = sessions.map((s) =>
        s.id === sessionId ? { ...s, isActive: false } : s
      );
      persist(next);
    },
    [sessions, persist]
  );

  /** 세션 삭제 */
  const deleteSession = useCallback(
    (sessionId: string): void => {
      persist(sessions.filter((s) => s.id !== sessionId));
    },
    [sessions, persist]
  );

  // ────────────────────────────────────────────
  // 로그 항목 CRUD
  // ────────────────────────────────────────────

  /** 로그 항목 추가 */
  const addEntry = useCallback(
    (
      sessionId: string,
      params: {
        senderName: string;
        message: string;
        category: BackstageLogCategory;
      }
    ): BackstageLogEntry | null => {
      const session = sessions.find((s) => s.id === sessionId);
      if (!session) return null;

      const now = new Date().toISOString();
      const newEntry: BackstageLogEntry = {
        id: crypto.randomUUID(),
        senderName: params.senderName.trim(),
        message: params.message.trim(),
        category: params.category,
        timestamp: now,
        isResolved: false,
        resolvedBy: null,
      };

      const next = sessions.map((s) =>
        s.id === sessionId
          ? { ...s, entries: [...s.entries, newEntry] }
          : s
      );
      persist(next);
      return newEntry;
    },
    [sessions, persist]
  );

  /** 로그 항목 해결 처리 */
  const resolveEntry = useCallback(
    (sessionId: string, entryId: string, resolvedBy: string): void => {
      const next = sessions.map((s) => {
        if (s.id !== sessionId) return s;
        return {
          ...s,
          entries: s.entries.map((e) =>
            e.id === entryId
              ? { ...e, isResolved: true, resolvedBy: resolvedBy.trim() }
              : e
          ),
        };
      });
      persist(next);
    },
    [sessions, persist]
  );

  /** 로그 항목 삭제 */
  const deleteEntry = useCallback(
    (sessionId: string, entryId: string): void => {
      const next = sessions.map((s) => {
        if (s.id !== sessionId) return s;
        return {
          ...s,
          entries: s.entries.filter((e) => e.id !== entryId),
        };
      });
      persist(next);
    },
    [sessions, persist]
  );

  // ────────────────────────────────────────────
  // 조회 헬퍼
  // ────────────────────────────────────────────

  /** 세션의 항목 목록 반환 */
  const getSessionEntries = useCallback(
    (sessionId: string): BackstageLogEntry[] => {
      const session = sessions.find((s) => s.id === sessionId);
      return session ? session.entries : [];
    },
    [sessions]
  );

  // ────────────────────────────────────────────
  // 통계
  // ────────────────────────────────────────────

  const allEntries = sessions.flatMap((s) => s.entries);

  /** 전체 세션 수 */
  const totalSessions = sessions.length;

  /** 전체 항목 수 */
  const totalEntries = allEntries.length;

  /** 미해결 항목 수 */
  const unresolvedCount = allEntries.filter((e) => !e.isResolved).length;

  /** 카테고리별 분포 */
  const categoryBreakdown: {
    category: BackstageLogCategory;
    count: number;
    percent: number;
  }[] = (() => {
    const categoryMap = new Map<BackstageLogCategory, number>();
    allEntries.forEach((e) => {
      categoryMap.set(e.category, (categoryMap.get(e.category) ?? 0) + 1);
    });
    const total = allEntries.length || 1;
    return Array.from(categoryMap.entries())
      .map(([category, count]) => ({
        category,
        count,
        percent: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  })();

  return {
    sessions,
    loading: false,
    // 세션 CRUD
    createSession,
    endSession,
    deleteSession,
    // 항목 CRUD
    addEntry,
    resolveEntry,
    deleteEntry,
    // 조회
    getSessionEntries,
    // 통계
    totalSessions,
    totalEntries,
    unresolvedCount,
    categoryBreakdown,
    refetch: reload,
  };
}
