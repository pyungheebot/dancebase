"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  AttendanceForecastSession,
  AttendanceForecastResponse,
  AttendanceForecastIntent,
} from "@/types";

// ─── localStorage 키 ──────────────────────────────────────────

const storageKey = (groupId: string) =>
  `dancebase:attendance-forecast:${groupId}`;

function loadSessions(groupId: string): AttendanceForecastSession[] {
  const parsed = loadFromStorage<unknown>(storageKey(groupId), []);
  // 기존 AttendanceForecastData 형태이면 무시하고 빈 배열 반환
  if (!Array.isArray(parsed)) return [];
  return parsed as AttendanceForecastSession[];
}

function saveSessions(groupId: string, sessions: AttendanceForecastSession[]) {
  saveToStorage(storageKey(groupId), sessions);
}

// ─── 유틸: 날짜 비교 ──────────────────────────────────────────

function isUpcoming(date: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(date) >= today;
}

// ─── 훅 ──────────────────────────────────────────────────────

export function useAttendanceForecastSessions(groupId: string) {
  const { data, mutate } = useSWR(
    swrKeys.attendanceForecast(groupId),
    () => loadSessions(groupId),
    { fallbackData: [] }
  );

  const sessions: AttendanceForecastSession[] = data ?? [];

  // ─── 세션 CRUD ────────────────────────────────────────────

  async function addSession(
    payload: Omit<AttendanceForecastSession, "id" | "responses" | "createdAt">
  ): Promise<string | null> {
    const newSession: AttendanceForecastSession = {
      ...payload,
      id: crypto.randomUUID(),
      responses: [],
      createdAt: new Date().toISOString(),
    };
    const updated = [...sessions, newSession].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    saveSessions(groupId, updated);
    await mutate(updated, false);
    return newSession.id;
  }

  async function updateSession(
    sessionId: string,
    patch: Partial<
      Pick<AttendanceForecastSession, "date" | "time" | "title" | "location">
    >
  ) {
    const updated = sessions.map((s) =>
      s.id === sessionId ? { ...s, ...patch } : s
    );
    saveSessions(groupId, updated);
    await mutate(updated, false);
  }

  async function deleteSession(sessionId: string) {
    const updated = sessions.filter((s) => s.id !== sessionId);
    saveSessions(groupId, updated);
    await mutate(updated, false);
  }

  // ─── 응답 처리 ────────────────────────────────────────────

  async function respond(
    sessionId: string,
    memberName: string,
    intent: AttendanceForecastIntent,
    reason?: string
  ) {
    const updated = sessions.map((s) => {
      if (s.id !== sessionId) return s;

      const newResponse: AttendanceForecastResponse = {
        memberName,
        intent,
        reason: reason?.trim() || undefined,
        respondedAt: new Date().toISOString(),
      };

      const existing = s.responses.find((r) => r.memberName === memberName);
      const responses = existing
        ? s.responses.map((r) =>
            r.memberName === memberName ? newResponse : r
          )
        : [...s.responses, newResponse];

      return { ...s, responses };
    });
    saveSessions(groupId, updated);
    await mutate(updated, false);
  }

  // ─── 세션 통계 ────────────────────────────────────────────

  function getSessionStats(sessionId: string) {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return { yes: 0, maybe: 0, no: 0, pending: 0, total: 0 };

    const yes = session.responses.filter((r) => r.intent === "yes").length;
    const maybe = session.responses.filter((r) => r.intent === "maybe").length;
    const no = session.responses.filter((r) => r.intent === "no").length;
    const pending = session.responses.filter((r) => r.intent === "pending").length;
    const responded = yes + maybe + no + pending;

    return { yes, maybe, no, pending, total: responded };
  }

  // ─── 전체 통계 ────────────────────────────────────────────

  const totalSessions = sessions.length;
  const upcomingSessions = sessions.filter((s) => isUpcoming(s.date)).length;

  const averageYesRate = (() => {
    const withResponses = sessions.filter(
      (s) => s.responses.filter((r) => r.intent !== "pending").length > 0
    );
    if (withResponses.length === 0) return 0;
    const total = withResponses.reduce((sum, s) => {
      const responded = s.responses.filter((r) => r.intent !== "pending").length;
      if (responded === 0) return sum;
      const yes = s.responses.filter((r) => r.intent === "yes").length;
      return sum + yes / responded;
    }, 0);
    return Math.round((total / withResponses.length) * 100);
  })();

  const stats = { totalSessions, upcomingSessions, averageYesRate };

  return {
    sessions,
    addSession,
    updateSession,
    deleteSession,
    respond,
    getSessionStats,
    stats,
    refetch: () => mutate(),
  };
}
