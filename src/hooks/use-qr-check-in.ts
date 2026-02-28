"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { QrCheckInSession, QrCheckInRecord, QrCheckInData } from "@/types";

// ============================================================
// localStorage 유틸
// ============================================================

function storageKey(groupId: string): string {
  return `dancebase:qr-check-in:${groupId}`;
}

type Store = {
  sessions: QrCheckInSession[];
  records: QrCheckInRecord[];
};

function loadStore(groupId: string): Store {
  if (typeof window === "undefined") return { sessions: [], records: [] };
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) return { sessions: [], records: [] };
    const parsed = JSON.parse(raw) as QrCheckInData;
    return { sessions: parsed.sessions ?? [], records: parsed.records ?? [] };
  } catch {
    return { sessions: [], records: [] };
  }
}

function saveStore(groupId: string, store: Store): void {
  if (typeof window === "undefined") return;
  try {
    const data: QrCheckInData = {
      groupId,
      sessions: store.sessions,
      records: store.records,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(storageKey(groupId), JSON.stringify(data));
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

// ============================================================
// QR 코드 생성 유틸
// ============================================================

/** 랜덤 영숫자 코드 생성 (기본 8자리) */
export function generateQrCode(length = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// ============================================================
// 훅
// ============================================================

export function useQrCheckIn(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.qrCheckIn(groupId) : null,
    () => loadStore(groupId),
    { fallbackData: { sessions: [], records: [] } }
  );

  const store = data ?? { sessions: [], records: [] };

  // ─── 내부 저장 헬퍼 ───────────────────────────────────────
  const persist = useCallback(
    (next: Store) => {
      saveStore(groupId, next);
      mutate(next, false);
    },
    [groupId, mutate]
  );

  // ─── 세션 생성 ───────────────────────────────────────────
  const createSession = useCallback(
    (
      title: string,
      date: string,
      startTime: string
    ): QrCheckInSession => {
      const current = loadStore(groupId);
      // 기존 활성 세션은 비활성화
      const updatedSessions = current.sessions.map((s) =>
        s.isActive ? { ...s, isActive: false } : s
      );
      const newSession: QrCheckInSession = {
        id: crypto.randomUUID(),
        title,
        date,
        startTime,
        endTime: null,
        qrCode: generateQrCode(8),
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      const next: Store = {
        sessions: [newSession, ...updatedSessions],
        records: current.records,
      };
      persist(next);
      return newSession;
    },
    [groupId, persist]
  );

  // ─── 세션 종료 ───────────────────────────────────────────
  const endSession = useCallback(
    (sessionId: string): void => {
      const current = loadStore(groupId);
      const endTime = new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const updatedSessions = current.sessions.map((s) =>
        s.id === sessionId
          ? { ...s, isActive: false, endTime }
          : s
      );
      persist({ sessions: updatedSessions, records: current.records });
    },
    [groupId, persist]
  );

  // ─── 세션 삭제 ───────────────────────────────────────────
  const deleteSession = useCallback(
    (sessionId: string): void => {
      const current = loadStore(groupId);
      const next: Store = {
        sessions: current.sessions.filter((s) => s.id !== sessionId),
        records: current.records.filter((r) => r.sessionId !== sessionId),
      };
      persist(next);
    },
    [groupId, persist]
  );

  // ─── 수동 체크인 ─────────────────────────────────────────
  const checkIn = useCallback(
    (sessionId: string, memberName: string): { success: boolean; message: string } => {
      const current = loadStore(groupId);
      const session = current.sessions.find((s) => s.id === sessionId);
      if (!session) {
        return { success: false, message: "세션을 찾을 수 없습니다." };
      }
      // 중복 체크인 방지
      const alreadyCheckedIn = current.records.some(
        (r) => r.sessionId === sessionId && r.memberName === memberName
      );
      if (alreadyCheckedIn) {
        return { success: false, message: `${memberName}님은 이미 체크인했습니다.` };
      }
      const newRecord: QrCheckInRecord = {
        id: crypto.randomUUID(),
        sessionId,
        memberName,
        checkedInAt: new Date().toISOString(),
        method: "manual",
      };
      const next: Store = {
        sessions: current.sessions,
        records: [...current.records, newRecord],
      };
      persist(next);
      return { success: true, message: `${memberName}님 체크인 완료!` };
    },
    [groupId, persist]
  );

  // ─── QR 코드 체크인 ──────────────────────────────────────
  const checkInByQr = useCallback(
    (
      qrCode: string,
      memberName: string
    ): { success: boolean; message: string } => {
      const current = loadStore(groupId);
      const session = current.sessions.find(
        (s) => s.isActive && s.qrCode === qrCode
      );
      if (!session) {
        return { success: false, message: "유효하지 않은 QR 코드입니다." };
      }
      // 중복 체크인 방지
      const alreadyCheckedIn = current.records.some(
        (r) => r.sessionId === session.id && r.memberName === memberName
      );
      if (alreadyCheckedIn) {
        return { success: false, message: `${memberName}님은 이미 체크인했습니다.` };
      }
      const newRecord: QrCheckInRecord = {
        id: crypto.randomUUID(),
        sessionId: session.id,
        memberName,
        checkedInAt: new Date().toISOString(),
        method: "qr",
      };
      const next: Store = {
        sessions: current.sessions,
        records: [...current.records, newRecord],
      };
      persist(next);
      return { success: true, message: `${memberName}님 QR 체크인 완료!` };
    },
    [groupId, persist]
  );

  // ─── 체크인 기록 삭제 ─────────────────────────────────────
  const removeCheckIn = useCallback(
    (recordId: string): void => {
      const current = loadStore(groupId);
      const next: Store = {
        sessions: current.sessions,
        records: current.records.filter((r) => r.id !== recordId),
      };
      persist(next);
    },
    [groupId, persist]
  );

  // ─── 세션별 기록 조회 ─────────────────────────────────────
  const getSessionRecords = useCallback(
    (sessionId: string): QrCheckInRecord[] => {
      return store.records.filter((r) => r.sessionId === sessionId);
    },
    [store.records]
  );

  // ─── 통계 ────────────────────────────────────────────────

  const activeSession = store.sessions.find((s) => s.isActive) ?? null;

  const totalSessions = store.sessions.length;

  const totalCheckIns = store.records.length;

  /** 세션당 평균 체크인 수 */
  const averageAttendance = (() => {
    if (store.sessions.length === 0) return 0;
    return Math.round(store.records.length / store.sessions.length);
  })();

  /** 멤버별 체크인 횟수 순위 (내림차순) */
  const memberAttendanceRanking: Array<{ memberName: string; count: number }> =
    (() => {
      const countMap: Record<string, number> = {};
      for (const r of store.records) {
        countMap[r.memberName] = (countMap[r.memberName] ?? 0) + 1;
      }
      return Object.entries(countMap)
        .map(([memberName, count]) => ({ memberName, count }))
        .sort((a, b) => b.count - a.count);
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
    checkIn,
    checkInByQr,
    removeCheckIn,
    generateQrCode,
    getSessionRecords,
    // 파생 상태
    activeSession,
    // 통계
    totalSessions,
    totalCheckIns,
    averageAttendance,
    memberAttendanceRanking,
  };
}
