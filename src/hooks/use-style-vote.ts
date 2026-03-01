"use client";

import { useState, useCallback } from "react";
import type { StyleVoteSession, StyleVoteCandidate } from "@/types";

function getStorageKey(groupId: string): string {
  return `dancebase:style-vote:${groupId}`;
}

function loadSessions(groupId: string): StyleVoteSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as StyleVoteSession[];
  } catch {
    return [];
  }
}

function saveSessions(groupId: string, sessions: StyleVoteSession[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(groupId), JSON.stringify(sessions));
  } catch {
    // 저장 실패 시 무시
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useStyleVote(groupId: string) {
  const [, forceUpdate] = useState(0);

  const refresh = useCallback(() => {
    forceUpdate((n) => n + 1);
  }, []);

  /** 전체 세션 목록 반환 */
  const getSessions = useCallback((): StyleVoteSession[] => {
    return loadSessions(groupId);
  }, [groupId]);

  /** 활성(open) 세션 반환 */
  const getActiveSession = useCallback((): StyleVoteSession | null => {
    const sessions = loadSessions(groupId);
    return sessions.find((s) => s.status === "open") ?? null;
  }, [groupId]);

  /** 새 투표 세션 생성 */
  const createSession = useCallback(
    (topic: string, maxVotesPerPerson: number): void => {
      const sessions = loadSessions(groupId);
      const newSession: StyleVoteSession = {
        id: generateId(),
        topic,
        status: "open",
        candidates: [],
        maxVotesPerPerson: Math.max(1, maxVotesPerPerson),
        createdAt: new Date().toISOString(),
      };
      sessions.unshift(newSession);
      saveSessions(groupId, sessions);
      refresh();
    },
    [groupId, refresh]
  );

  /** 세션 마감 */
  const closeSession = useCallback(
    (sessionId: string): void => {
      const sessions = loadSessions(groupId);
      const idx = sessions.findIndex((s) => s.id === sessionId);
      if (idx < 0) return;
      sessions[idx] = {
        ...sessions[idx],
        status: "closed",
        closedAt: new Date().toISOString(),
      };
      saveSessions(groupId, sessions);
      refresh();
    },
    [groupId, refresh]
  );

  /** 세션 다시 열기 */
  const reopenSession = useCallback(
    (sessionId: string): void => {
      const sessions = loadSessions(groupId);
      const idx = sessions.findIndex((s) => s.id === sessionId);
      if (idx < 0) return;
      const next = { ...sessions[idx] };
      delete next.closedAt;
      next.status = "open";
      sessions[idx] = next;
      saveSessions(groupId, sessions);
      refresh();
    },
    [groupId, refresh]
  );

  /** 세션 삭제 */
  const deleteSession = useCallback(
    (sessionId: string): void => {
      const sessions = loadSessions(groupId).filter((s) => s.id !== sessionId);
      saveSessions(groupId, sessions);
      refresh();
    },
    [groupId, refresh]
  );

  /** 후보 추가 */
  const addCandidate = useCallback(
    (
      sessionId: string,
      title: string,
      description: string,
      proposedBy: string
    ): void => {
      const sessions = loadSessions(groupId);
      const idx = sessions.findIndex((s) => s.id === sessionId);
      if (idx < 0) return;
      const newCandidate: StyleVoteCandidate = {
        id: generateId(),
        title,
        description,
        proposedBy,
        votes: [],
      };
      sessions[idx] = {
        ...sessions[idx],
        candidates: [...sessions[idx].candidates, newCandidate],
      };
      saveSessions(groupId, sessions);
      refresh();
    },
    [groupId, refresh]
  );

  /** 후보 삭제 */
  const removeCandidate = useCallback(
    (sessionId: string, candidateId: string): void => {
      const sessions = loadSessions(groupId);
      const idx = sessions.findIndex((s) => s.id === sessionId);
      if (idx < 0) return;
      sessions[idx] = {
        ...sessions[idx],
        candidates: sessions[idx].candidates.filter(
          (c) => c.id !== candidateId
        ),
      };
      saveSessions(groupId, sessions);
      refresh();
    },
    [groupId, refresh]
  );

  /** 투표 (토글 방식: 이미 투표했으면 취소) */
  const castVote = useCallback(
    (sessionId: string, candidateId: string, voterName: string): void => {
      const sessions = loadSessions(groupId);
      const sessionIdx = sessions.findIndex((s) => s.id === sessionId);
      if (sessionIdx < 0) return;

      const session = sessions[sessionIdx];
      if (session.status === "closed") return;

      const candidates = session.candidates.map((c) => ({ ...c, votes: [...c.votes] }));
      const candidateIdx = candidates.findIndex((c) => c.id === candidateId);
      if (candidateIdx < 0) return;

      const alreadyVoted = candidates[candidateIdx].votes.includes(voterName);

      if (alreadyVoted) {
        // 투표 취소
        candidates[candidateIdx].votes = candidates[candidateIdx].votes.filter(
          (v) => v !== voterName
        );
      } else {
        // 현재 이 사람이 투표한 총 개수 확인
        const myTotalVotes = candidates.reduce(
          (sum, c) => sum + (c.votes.includes(voterName) ? 1 : 0),
          0
        );
        if (myTotalVotes >= session.maxVotesPerPerson) return; // 최대 투표 수 초과
        candidates[candidateIdx].votes.push(voterName);
      }

      sessions[sessionIdx] = { ...session, candidates };
      saveSessions(groupId, sessions);
      refresh();
    },
    [groupId, refresh]
  );

  /** 특정 후보의 득표율(%) 계산 */
  const getVoteRate = useCallback(
    (session: StyleVoteSession, candidateId: string): number => {
      const totalVotes = session.candidates.reduce(
        (sum, c) => sum + c.votes.length,
        0
      );
      if (totalVotes === 0) return 0;
      const candidate = session.candidates.find((c) => c.id === candidateId);
      if (!candidate) return 0;
      return Math.round((candidate.votes.length / totalVotes) * 100);
    },
    []
  );

  /** 최다 득표 후보 반환 (동률 시 첫 번째) */
  const getWinner = useCallback(
    (session: StyleVoteSession): StyleVoteCandidate | null => {
      if (session.candidates.length === 0) return null;
      const maxVotes = Math.max(...session.candidates.map((c) => c.votes.length));
      if (maxVotes === 0) return null;
      return (
        session.candidates.find((c) => c.votes.length === maxVotes) ?? null
      );
    },
    []
  );

  /** 특정 멤버가 해당 후보에 투표했는지 여부 */
  const hasVoted = useCallback(
    (
      session: StyleVoteSession,
      candidateId: string,
      voterName: string
    ): boolean => {
      const candidate = session.candidates.find((c) => c.id === candidateId);
      return candidate?.votes.includes(voterName) ?? false;
    },
    []
  );

  /** 특정 멤버의 이미 사용한 투표 수 */
  const getMyVoteCount = useCallback(
    (session: StyleVoteSession, voterName: string): number => {
      return session.candidates.reduce(
        (sum, c) => sum + (c.votes.includes(voterName) ? 1 : 0),
        0
      );
    },
    []
  );

  return {
    getSessions,
    getActiveSession,
    createSession,
    closeSession,
    reopenSession,
    deleteSession,
    addCandidate,
    removeCandidate,
    castVote,
    getVoteRate,
    getWinner,
    hasVoted,
    getMyVoteCount,
  };
}
