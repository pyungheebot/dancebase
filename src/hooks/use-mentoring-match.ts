"use client";

import { useState, useCallback } from "react";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  MentoringMatchPair,
  MentoringMatchStatus,
  MentoringSessionRecord,
} from "@/types";

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(groupId: string): string {
  return `dancebase:mentoring-match:${groupId}`;
}

// ============================================================
// 통계 타입
// ============================================================

export type MentoringMatchStats = {
  totalPairs: number;
  activePairs: number;
  completedPairs: number;
  pausedPairs: number;
  totalSessions: number;
  avgSessionsPerPair: number;
  topMentors: { mentorName: string; sessionCount: number }[];
};

// ============================================================
// 훅
// ============================================================

export function useMentoringMatch(groupId: string) {
  const [pairs, setPairs] = useState<MentoringMatchPair[]>(() => loadFromStorage<MentoringMatchPair[]>(storageKey(groupId), []));

  const reload = useCallback(() => {
    if (!groupId) return;
    const data = loadFromStorage<MentoringMatchPair[]>(storageKey(groupId), []);
    setPairs(data);
  }, [groupId]);

  const persist = useCallback(
    (next: MentoringMatchPair[]) => {
      saveToStorage(storageKey(groupId), next);
      setPairs(next);
    },
    [groupId]
  );

  // 페어 추가
  const addPair = useCallback(
    (
      mentorName: string,
      menteeName: string,
      skillFocus: string[],
      goals: string[],
      startDate: string
    ): MentoringMatchPair => {
      const pair: MentoringMatchPair = {
        id: crypto.randomUUID(),
        mentorName,
        menteeName,
        skillFocus,
        status: "active",
        sessions: [],
        startDate,
        goals,
        createdAt: new Date().toISOString(),
      };
      persist([...pairs, pair]);
      return pair;
    },
    [pairs, persist]
  );

  // 페어 수정
  const updatePair = useCallback(
    (id: string, updates: Partial<Omit<MentoringMatchPair, "id" | "createdAt" | "sessions">>): boolean => {
      const next = pairs.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      );
      if (next.every((p, i) => p === pairs[i])) return false;
      persist(next);
      return true;
    },
    [pairs, persist]
  );

  // 페어 삭제
  const deletePair = useCallback(
    (id: string): boolean => {
      const next = pairs.filter((p) => p.id !== id);
      if (next.length === pairs.length) return false;
      persist(next);
      return true;
    },
    [pairs, persist]
  );

  // 세션 추가
  const addSession = useCallback(
    (
      pairId: string,
      session: Omit<MentoringSessionRecord, "id">
    ): MentoringSessionRecord | null => {
      const pair = pairs.find((p) => p.id === pairId);
      if (!pair) return null;
      const newSession: MentoringSessionRecord = {
        id: crypto.randomUUID(),
        ...session,
      };
      const next = pairs.map((p) =>
        p.id === pairId
          ? { ...p, sessions: [...p.sessions, newSession] }
          : p
      );
      persist(next);
      return newSession;
    },
    [pairs, persist]
  );

  // 세션 삭제
  const deleteSession = useCallback(
    (pairId: string, sessionId: string): boolean => {
      const pair = pairs.find((p) => p.id === pairId);
      if (!pair) return false;
      const updatedSessions = pair.sessions.filter((s) => s.id !== sessionId);
      if (updatedSessions.length === pair.sessions.length) return false;
      const next = pairs.map((p) =>
        p.id === pairId ? { ...p, sessions: updatedSessions } : p
      );
      persist(next);
      return true;
    },
    [pairs, persist]
  );

  // 상태 변경
  const updateStatus = useCallback(
    (pairId: string, status: MentoringMatchStatus): boolean => {
      return updatePair(pairId, { status });
    },
    [updatePair]
  );

  // 통계
  const stats: MentoringMatchStats = (() => {
    const totalPairs = pairs.length;
    const activePairs = pairs.filter((p) => p.status === "active").length;
    const completedPairs = pairs.filter((p) => p.status === "completed").length;
    const pausedPairs = pairs.filter((p) => p.status === "paused").length;
    const totalSessions = pairs.reduce((sum, p) => sum + p.sessions.length, 0);
    const avgSessionsPerPair =
      totalPairs > 0
        ? Math.round((totalSessions / totalPairs) * 10) / 10
        : 0;

    // 멘토별 세션 수 집계
    const mentorMap = new Map<string, number>();
    for (const pair of pairs) {
      const prev = mentorMap.get(pair.mentorName) ?? 0;
      mentorMap.set(pair.mentorName, prev + pair.sessions.length);
    }
    const topMentors = Array.from(mentorMap.entries())
      .map(([mentorName, sessionCount]) => ({ mentorName, sessionCount }))
      .sort((a, b) => b.sessionCount - a.sessionCount)
      .slice(0, 3);

    return {
      totalPairs,
      activePairs,
      completedPairs,
      pausedPairs,
      totalSessions,
      avgSessionsPerPair,
      topMentors,
    };
  })();

  return {
    pairs,
    loading: false,
    addPair,
    updatePair,
    deletePair,
    addSession,
    deleteSession,
    updateStatus,
    stats,
    refetch: reload,
  };
}
