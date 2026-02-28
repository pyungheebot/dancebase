"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  PracticeCheckinSession,
  PracticeCheckinRecord,
  PracticeCheckinStatus,
} from "@/types";

// ============================================
// localStorage 스토리지 타입
// ============================================

type CheckinStore = {
  sessions: PracticeCheckinSession[];
  records: PracticeCheckinRecord[];
};

// ============================================
// localStorage 유틸
// ============================================

function storageKey(groupId: string): string {
  return `dancebase:practice-checkin:${groupId}`;
}

function loadStore(groupId: string): CheckinStore {
  if (typeof window === "undefined") return { sessions: [], records: [] };
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) return { sessions: [], records: [] };
    return JSON.parse(raw) as CheckinStore;
  } catch {
    return { sessions: [], records: [] };
  }
}

function saveStore(groupId: string, store: CheckinStore): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId), JSON.stringify(store));
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

// ============================================
// 지각 분수 계산
// ============================================

function calcLateMinutes(
  startTime: string,
  checkinTime: string
): number {
  // startTime, checkinTime 은 "HH:MM" 형식
  const [sh, sm] = startTime.split(":").map(Number);
  const [ch, cm] = checkinTime.split(":").map(Number);
  const startTotal = sh * 60 + sm;
  const checkinTotal = ch * 60 + cm;
  const diff = checkinTotal - startTotal;
  return diff > 0 ? diff : 0;
}

// ============================================
// 훅
// ============================================

export function usePracticeCheckin(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.practiceCheckin(groupId) : null,
    () => loadStore(groupId),
    { fallbackData: { sessions: [], records: [] } }
  );

  const store = data ?? { sessions: [], records: [] };

  // ─── 내부 저장 헬퍼 ───────────────────────────────────
  const persist = useCallback(
    (next: CheckinStore) => {
      saveStore(groupId, next);
      mutate(next, false);
    },
    [groupId, mutate]
  );

  // ─── 세션 생성 ─────────────────────────────────────────
  const createSession = useCallback(
    (date: string, title: string, startTime: string): PracticeCheckinSession => {
      const current = loadStore(groupId);
      // 기존 활성 세션이 있으면 비활성화
      const updatedSessions = current.sessions.map((s) =>
        s.isActive ? { ...s, isActive: false } : s
      );
      const newSession: PracticeCheckinSession = {
        id: crypto.randomUUID(),
        date,
        title,
        startTime,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      const next: CheckinStore = {
        sessions: [newSession, ...updatedSessions],
        records: current.records,
      };
      persist(next);
      return newSession;
    },
    [groupId, persist]
  );

  // ─── 세션 종료 ─────────────────────────────────────────
  const endSession = useCallback(
    (sessionId: string): void => {
      const current = loadStore(groupId);
      const endTime = new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const updatedSessions = current.sessions.map((s) =>
        s.id === sessionId ? { ...s, isActive: false, endTime } : s
      );
      persist({ sessions: updatedSessions, records: current.records });
    },
    [groupId, persist]
  );

  // ─── 세션 삭제 ─────────────────────────────────────────
  const deleteSession = useCallback(
    (sessionId: string): void => {
      const current = loadStore(groupId);
      const next: CheckinStore = {
        sessions: current.sessions.filter((s) => s.id !== sessionId),
        records: current.records.filter((r) => r.sessionId !== sessionId),
      };
      persist(next);
    },
    [groupId, persist]
  );

  // ─── 체크인 ────────────────────────────────────────────
  const checkin = useCallback(
    (sessionId: string, memberName: string): void => {
      const current = loadStore(groupId);
      const session = current.sessions.find((s) => s.id === sessionId);
      if (!session) return;

      const now = new Date();
      const checkinTime = now.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const lateMinutes = calcLateMinutes(session.startTime, checkinTime);

      // 기존 기록 업데이트 or 신규 생성
      const existing = current.records.find(
        (r) => r.sessionId === sessionId && r.memberName === memberName
      );
      let updatedRecords: PracticeCheckinRecord[];
      if (existing) {
        updatedRecords = current.records.map((r) =>
          r.id === existing.id
            ? {
                ...r,
                status: "checked_in" as PracticeCheckinStatus,
                checkinTime,
                lateMinutes,
                checkoutTime: undefined,
              }
            : r
        );
      } else {
        const newRecord: PracticeCheckinRecord = {
          id: crypto.randomUUID(),
          sessionId,
          memberName,
          status: "checked_in",
          checkinTime,
          lateMinutes,
          createdAt: now.toISOString(),
        };
        updatedRecords = [...current.records, newRecord];
      }
      persist({ sessions: current.sessions, records: updatedRecords });
    },
    [groupId, persist]
  );

  // ─── 체크아웃 ──────────────────────────────────────────
  const checkout = useCallback(
    (sessionId: string, memberName: string): void => {
      const current = loadStore(groupId);
      const checkoutTime = new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const updatedRecords = current.records.map((r) =>
        r.sessionId === sessionId && r.memberName === memberName
          ? { ...r, status: "checked_out" as PracticeCheckinStatus, checkoutTime }
          : r
      );
      persist({ sessions: current.sessions, records: updatedRecords });
    },
    [groupId, persist]
  );

  // ─── 결석 처리 ─────────────────────────────────────────
  const markAbsent = useCallback(
    (sessionId: string, memberName: string): void => {
      const current = loadStore(groupId);
      const existing = current.records.find(
        (r) => r.sessionId === sessionId && r.memberName === memberName
      );
      let updatedRecords: PracticeCheckinRecord[];
      if (existing) {
        updatedRecords = current.records.map((r) =>
          r.id === existing.id
            ? {
                ...r,
                status: "absent" as PracticeCheckinStatus,
                checkinTime: undefined,
                checkoutTime: undefined,
                lateMinutes: undefined,
              }
            : r
        );
      } else {
        const newRecord: PracticeCheckinRecord = {
          id: crypto.randomUUID(),
          sessionId,
          memberName,
          status: "absent",
          createdAt: new Date().toISOString(),
        };
        updatedRecords = [...current.records, newRecord];
      }
      persist({ sessions: current.sessions, records: updatedRecords });
    },
    [groupId, persist]
  );

  // ─── 세션별 기록 조회 ──────────────────────────────────
  const getSessionRecords = useCallback(
    (sessionId: string): PracticeCheckinRecord[] => {
      return store.records.filter((r) => r.sessionId === sessionId);
    },
    [store.records]
  );

  // ─── 통계 ──────────────────────────────────────────────
  const totalSessions = store.sessions.length;

  const activeSession =
    store.sessions.find((s) => s.isActive) ?? null;

  const averageAttendanceRate = (() => {
    const pastSessions = store.sessions.filter((s) => !s.isActive);
    if (pastSessions.length === 0) return 0;

    const rates = pastSessions.map((session) => {
      const sessionRecords = store.records.filter(
        (r) => r.sessionId === session.id
      );
      if (sessionRecords.length === 0) return 0;
      const attended = sessionRecords.filter(
        (r) => r.status === "checked_in" || r.status === "checked_out"
      ).length;
      return Math.round((attended / sessionRecords.length) * 100);
    });

    const total = rates.reduce((sum, r) => sum + r, 0);
    return Math.round(total / rates.length);
  })();

  return {
    sessions: store.sessions,
    records: store.records,
    loading: isLoading,
    refetch: () => mutate(),
    // 액션
    createSession,
    endSession,
    deleteSession,
    checkin,
    checkout,
    markAbsent,
    getSessionRecords,
    // 통계
    totalSessions,
    activeSession,
    averageAttendanceRate,
  };
}
