"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  GroupMentorMatch,
  GroupMentorSession,
  GroupMentorStatus,

} from "@/types";

// ============================================================
// localStorage 헬퍼
// ============================================================

function loadData(groupId: string): GroupMentorMatch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`dancebase:group-mentor:${groupId}`);
    if (!raw) return [];
    return JSON.parse(raw) as GroupMentorMatch[];
  } catch {
    return [];
  }
}

function saveData(groupId: string, data: GroupMentorMatch[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `dancebase:group-mentor:${groupId}`,
      JSON.stringify(data)
    );
  } catch {
    // 무시
  }
}

// ============================================================
// 통계 타입
// ============================================================

export type GroupMentorStats = {
  /** 총 매칭 수 */
  total: number;
  /** 진행 중 매칭 수 */
  active: number;
  /** 완료된 매칭 수 */
  completed: number;
  /** 중단된 매칭 수 */
  stopped: number;
  /** 총 세션 수 */
  totalSessions: number;
  /** 평균 평가 점수 */
  avgRating: number | null;
  /** 멘토별 통계 (총 세션 수, 평균 평가, 활성 매칭 수) */
  mentorStats: {
    mentorName: string;
    sessionCount: number;
    avgRating: number | null;
    activeMatches: number;
  }[];
};

// ============================================================
// 훅
// ============================================================

export function useGroupMentor(groupId: string) {
  const { data, mutate } = useSWR(
    groupId ? swrKeys.groupMentorMatches(groupId) : null,
    () => loadData(groupId),
    { fallbackData: [] }
  );

  const matches = data ?? [];

  function persist(next: GroupMentorMatch[]) {
    saveData(groupId, next);
    mutate(next, { revalidate: false });
  }

  // 매칭 추가
  function addMatch(
    input: Omit<GroupMentorMatch, "id" | "sessions" | "createdAt">
  ): GroupMentorMatch {
    const match: GroupMentorMatch = {
      id: crypto.randomUUID(),
      ...input,
      sessions: [],
      createdAt: new Date().toISOString(),
    };
    persist([...matches, match]);
    return match;
  }

  // 매칭 수정
  function updateMatch(
    id: string,
    updates: Partial<
      Omit<GroupMentorMatch, "id" | "sessions" | "createdAt">
    >
  ): boolean {
    const idx = matches.findIndex((m) => m.id === id);
    if (idx === -1) return false;
    const next = matches.map((m) => (m.id === id ? { ...m, ...updates } : m));
    persist(next);
    return true;
  }

  // 매칭 삭제
  function deleteMatch(id: string): boolean {
    const next = matches.filter((m) => m.id !== id);
    if (next.length === matches.length) return false;
    persist(next);
    return true;
  }

  // 상태 변경
  function updateStatus(id: string, status: GroupMentorStatus): boolean {
    return updateMatch(id, { status });
  }

  // 세션 추가
  function addSession(
    matchId: string,
    input: Omit<GroupMentorSession, "id" | "createdAt">
  ): GroupMentorSession | null {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return null;
    const session: GroupMentorSession = {
      id: crypto.randomUUID(),
      ...input,
      createdAt: new Date().toISOString(),
    };
    const next = matches.map((m) =>
      m.id === matchId
        ? { ...m, sessions: [...m.sessions, session] }
        : m
    );
    persist(next);
    return session;
  }

  // 세션 삭제
  function deleteSession(matchId: string, sessionId: string): boolean {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return false;
    const updated = match.sessions.filter((s) => s.id !== sessionId);
    if (updated.length === match.sessions.length) return false;
    const next = matches.map((m) =>
      m.id === matchId ? { ...m, sessions: updated } : m
    );
    persist(next);
    return true;
  }

  // 통계 계산
  const stats: GroupMentorStats = (() => {
    const total = matches.length;
    const active = matches.filter((m) => m.status === "진행중").length;
    const completed = matches.filter((m) => m.status === "완료").length;
    const stopped = matches.filter((m) => m.status === "중단").length;

    const allSessions = matches.flatMap((m) => m.sessions);
    const totalSessions = allSessions.length;
    const ratedSessions = allSessions.filter((s) => s.rating > 0);
    const avgRating =
      ratedSessions.length > 0
        ? Math.round(
            (ratedSessions.reduce((sum, s) => sum + s.rating, 0) /
              ratedSessions.length) *
              10
          ) / 10
        : null;

    // 멘토별 집계
    const mentorMap = new Map<
      string,
      { sessions: GroupMentorSession[]; activeMatches: number }
    >();
    for (const m of matches) {
      const prev = mentorMap.get(m.mentorName) ?? {
        sessions: [],
        activeMatches: 0,
      };
      mentorMap.set(m.mentorName, {
        sessions: [...prev.sessions, ...m.sessions],
        activeMatches:
          prev.activeMatches + (m.status === "진행중" ? 1 : 0),
      });
    }

    const mentorStats = Array.from(mentorMap.entries())
      .map(([mentorName, { sessions, activeMatches }]) => {
        const rated = sessions.filter((s) => s.rating > 0);
        return {
          mentorName,
          sessionCount: sessions.length,
          avgRating:
            rated.length > 0
              ? Math.round(
                  (rated.reduce((sum, s) => sum + s.rating, 0) /
                    rated.length) *
                    10
                ) / 10
              : null,
          activeMatches,
        };
      })
      .sort((a, b) => b.sessionCount - a.sessionCount);

    return {
      total,
      active,
      completed,
      stopped,
      totalSessions,
      avgRating,
      mentorStats,
    };
  })();

  return {
    matches,
    loading: false,
    addMatch,
    updateMatch,
    deleteMatch,
    updateStatus,
    addSession,
    deleteSession,
    stats,
    refetch: () => mutate(),
  };
}
