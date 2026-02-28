"use client";

import { useState, useEffect, useCallback } from "react";
import { swrKeys } from "@/lib/swr/keys";
import type {
  DressRehearsalSession,
  DressRehearsalIssue,
  DressRehearsalData,
  DressRehearsalCategory,
  DressRehearsalSeverity,
} from "@/types";

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(projectId: string): string {
  return swrKeys.dressRehearsal(projectId);
}

function loadData(projectId: string): DressRehearsalData {
  if (typeof window === "undefined") {
    return { projectId, sessions: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(storageKey(projectId));
    if (!raw) return { projectId, sessions: [], updatedAt: new Date().toISOString() };
    return JSON.parse(raw) as DressRehearsalData;
  } catch {
    return { projectId, sessions: [], updatedAt: new Date().toISOString() };
  }
}

function saveData(data: DressRehearsalData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(data.projectId), JSON.stringify(data));
  } catch {
    // 무시
  }
}

// ============================================================
// 통계 타입
// ============================================================

export type DressRehearsalStats = {
  /** 총 이슈 수 */
  totalIssues: number;
  /** 해결된 이슈 수 */
  resolvedIssues: number;
  /** 미해결 이슈 수 */
  unresolvedIssues: number;
  /** 해결율 (0-100) */
  resolveRate: number;
  /** 심각도별 분포 */
  severityDistribution: { severity: DressRehearsalSeverity; count: number }[];
  /** 카테고리별 분포 */
  categoryDistribution: { category: DressRehearsalCategory; count: number }[];
};

// ============================================================
// 훅
// ============================================================

export function useDressRehearsal(projectId: string) {
  const [sessions, setSessions] = useState<DressRehearsalSession[]>([]);
  const [loading, setLoading] = useState(true);

  // localStorage에서 데이터 불러오기
  const reload = useCallback(() => {
    if (!projectId) return;
    const data = loadData(projectId);
    setSessions(data.sessions);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    reload();
  }, [reload]);

  // 내부 저장 헬퍼
  const persist = useCallback(
    (updated: DressRehearsalSession[]) => {
      const data: DressRehearsalData = {
        projectId,
        sessions: updated,
        updatedAt: new Date().toISOString(),
      };
      saveData(data);
      setSessions(updated);
    },
    [projectId]
  );

  // ============================================================
  // 회차 관리
  // ============================================================

  /** 회차 추가 */
  const addSession = useCallback(
    (params: { date: string; time: string; venue: string }): DressRehearsalSession => {
      const now = new Date().toISOString();
      const newSession: DressRehearsalSession = {
        id: crypto.randomUUID(),
        date: params.date,
        time: params.time,
        venue: params.venue,
        issues: [],
        createdAt: now,
        updatedAt: now,
      };
      persist([...sessions, newSession]);
      return newSession;
    },
    [sessions, persist]
  );

  /** 회차 수정 */
  const updateSession = useCallback(
    (
      sessionId: string,
      params: Partial<Pick<DressRehearsalSession, "date" | "time" | "venue">>
    ): boolean => {
      const idx = sessions.findIndex((s) => s.id === sessionId);
      if (idx === -1) return false;
      const updated = sessions.map((s) =>
        s.id === sessionId
          ? { ...s, ...params, updatedAt: new Date().toISOString() }
          : s
      );
      persist(updated);
      return true;
    },
    [sessions, persist]
  );

  /** 회차 삭제 */
  const deleteSession = useCallback(
    (sessionId: string): boolean => {
      const exists = sessions.some((s) => s.id === sessionId);
      if (!exists) return false;
      persist(sessions.filter((s) => s.id !== sessionId));
      return true;
    },
    [sessions, persist]
  );

  // ============================================================
  // 이슈 관리
  // ============================================================

  /** 이슈 추가 */
  const addIssue = useCallback(
    (
      sessionId: string,
      params: {
        section: string;
        content: string;
        category: DressRehearsalCategory;
        severity: DressRehearsalSeverity;
        assignee?: string;
      }
    ): DressRehearsalIssue | null => {
      const session = sessions.find((s) => s.id === sessionId);
      if (!session) return null;

      const newIssue: DressRehearsalIssue = {
        id: crypto.randomUUID(),
        section: params.section,
        content: params.content,
        category: params.category,
        severity: params.severity,
        assignee: params.assignee,
        resolved: false,
      };

      const updated = sessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              issues: [...s.issues, newIssue],
              updatedAt: new Date().toISOString(),
            }
          : s
      );
      persist(updated);
      return newIssue;
    },
    [sessions, persist]
  );

  /** 이슈 수정 */
  const updateIssue = useCallback(
    (
      sessionId: string,
      issueId: string,
      params: Partial<Omit<DressRehearsalIssue, "id" | "resolved" | "resolvedAt">>
    ): boolean => {
      const session = sessions.find((s) => s.id === sessionId);
      if (!session) return false;
      const issueExists = session.issues.some((i) => i.id === issueId);
      if (!issueExists) return false;

      const updated = sessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              issues: s.issues.map((i) =>
                i.id === issueId ? { ...i, ...params } : i
              ),
              updatedAt: new Date().toISOString(),
            }
          : s
      );
      persist(updated);
      return true;
    },
    [sessions, persist]
  );

  /** 이슈 삭제 */
  const deleteIssue = useCallback(
    (sessionId: string, issueId: string): boolean => {
      const session = sessions.find((s) => s.id === sessionId);
      if (!session) return false;
      const issueExists = session.issues.some((i) => i.id === issueId);
      if (!issueExists) return false;

      const updated = sessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              issues: s.issues.filter((i) => i.id !== issueId),
              updatedAt: new Date().toISOString(),
            }
          : s
      );
      persist(updated);
      return true;
    },
    [sessions, persist]
  );

  /** 해결 상태 토글 */
  const toggleIssueResolved = useCallback(
    (sessionId: string, issueId: string): boolean => {
      const session = sessions.find((s) => s.id === sessionId);
      if (!session) return false;
      const issue = session.issues.find((i) => i.id === issueId);
      if (!issue) return false;

      const nowResolved = !issue.resolved;
      const updated = sessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              issues: s.issues.map((i) =>
                i.id === issueId
                  ? {
                      ...i,
                      resolved: nowResolved,
                      resolvedAt: nowResolved
                        ? new Date().toISOString()
                        : undefined,
                    }
                  : i
              ),
              updatedAt: new Date().toISOString(),
            }
          : s
      );
      persist(updated);
      return true;
    },
    [sessions, persist]
  );

  // ============================================================
  // 통계 계산
  // ============================================================

  const stats: DressRehearsalStats = (() => {
    const allIssues = sessions.flatMap((s) => s.issues);
    const totalIssues = allIssues.length;
    const resolvedIssues = allIssues.filter((i) => i.resolved).length;
    const unresolvedIssues = totalIssues - resolvedIssues;
    const resolveRate =
      totalIssues === 0
        ? 0
        : Math.round((resolvedIssues / totalIssues) * 100);

    const SEVERITIES: DressRehearsalSeverity[] = ["높음", "보통", "낮음"];
    const severityDistribution = SEVERITIES.map((severity) => ({
      severity,
      count: allIssues.filter((i) => i.severity === severity).length,
    })).filter((s) => s.count > 0);

    const CATEGORIES: DressRehearsalCategory[] = [
      "안무",
      "음악",
      "조명",
      "의상",
      "동선",
      "소품",
      "기타",
    ];
    const categoryDistribution = CATEGORIES.map((category) => ({
      category,
      count: allIssues.filter((i) => i.category === category).length,
    })).filter((c) => c.count > 0);

    return {
      totalIssues,
      resolvedIssues,
      unresolvedIssues,
      resolveRate,
      severityDistribution,
      categoryDistribution,
    };
  })();

  return {
    sessions,
    loading,
    stats,
    addSession,
    updateSession,
    deleteSession,
    addIssue,
    updateIssue,
    deleteIssue,
    toggleIssueResolved,
    refetch: reload,
  };
}
