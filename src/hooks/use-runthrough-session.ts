"use client";

import { useState, useEffect, useCallback } from "react";
import type { RunthroughSession, RunthroughNote } from "@/types";

function getStorageKey(projectId: string): string {
  return `runthrough-sessions-${projectId}`;
}

function loadSessions(projectId: string): RunthroughSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(projectId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as RunthroughSession[];
  } catch {
    return [];
  }
}

function saveSessions(projectId: string, sessions: RunthroughSession[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(projectId), JSON.stringify(sessions));
  } catch {
    // localStorage 쓰기 실패 무시
  }
}

export function useRunthroughSession(projectId: string) {
  const [sessions, setSessions] = useState<RunthroughSession[]>([]);
  const [currentSession, setCurrentSession] = useState<RunthroughSession | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const all = loadSessions(projectId);
    // 진행 중(endedAt === null) 세션이 있으면 currentSession으로 복원
    const ongoing = all.find((s) => s.endedAt === null) ?? null;
    const finished = all.filter((s) => s.endedAt !== null);
    setCurrentSession(ongoing);
    setSessions(finished);
  }, [projectId]);

  // 새 세션 시작
  const startSession = useCallback(
    (songOrder: Array<{ id: string; title: string }>) => {
      const newSession: RunthroughSession = {
        id: crypto.randomUUID(),
        projectId,
        startedAt: new Date().toISOString(),
        endedAt: null,
        notes: [],
        songOrder: songOrder.map((s) => s.id),
      };
      setCurrentSession(newSession);
      // 진행 중 세션 포함해서 저장 (기존 finished 세션들 + 새 세션)
      setSessions((prev) => {
        const all = [...prev, newSession];
        saveSessions(projectId, all);
        return prev;
      });
      // 별도로 ongoing 포함한 전체 목록 저장
      const all = loadSessions(projectId);
      // 이미 진행 중인 세션이 있으면 종료 처리
      const cleaned = all.filter((s) => s.endedAt !== null);
      saveSessions(projectId, [...cleaned, newSession]);
    },
    [projectId]
  );

  // 세션 종료
  const endSession = useCallback(() => {
    if (!currentSession) return;
    const ended: RunthroughSession = {
      ...currentSession,
      endedAt: new Date().toISOString(),
    };
    setCurrentSession(null);
    setSessions((prev) => {
      const updated = [ended, ...prev];
      saveSessions(projectId, updated);
      return updated;
    });
  }, [currentSession, projectId]);

  // 메모 추가
  const addNote = useCallback(
    (songId: string, songTitle: string, timestamp: number, content: string) => {
      if (!currentSession) return;
      const note: RunthroughNote = { songId, songTitle, timestamp, content };
      const updated: RunthroughSession = {
        ...currentSession,
        notes: [...currentSession.notes, note],
      };
      setCurrentSession(updated);
      // localStorage 동기화 (ongoing 세션도 저장)
      const all = loadSessions(projectId);
      const withoutOngoing = all.filter((s) => s.endedAt !== null);
      saveSessions(projectId, [...withoutOngoing, updated]);
    },
    [currentSession, projectId]
  );

  // 과거 세션 삭제
  const deleteSession = useCallback(
    (sessionId: string) => {
      setSessions((prev) => {
        const updated = prev.filter((s) => s.id !== sessionId);
        // ongoing 세션이 있으면 함께 저장
        const ongoing = currentSession ? [currentSession] : [];
        saveSessions(projectId, [...updated, ...ongoing]);
        return updated;
      });
    },
    [projectId, currentSession]
  );

  // 특정 세션 메모 조회
  const getSessionNotes = useCallback(
    (sessionId: string): RunthroughNote[] => {
      const all = loadSessions(projectId);
      const session = all.find((s) => s.id === sessionId);
      return session?.notes ?? [];
    },
    [projectId]
  );

  return {
    sessions,
    currentSession,
    loading: !mounted,
    startSession,
    endSession,
    addNote,
    deleteSession,
    getSessionNotes,
  };
}
