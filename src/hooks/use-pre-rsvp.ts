"use client";

import { useState, useCallback } from "react";
import { removeFromStorage } from "@/lib/local-storage";

// ============================================================
// 타입 정의
// ============================================================

export type PreRsvpResponse = "yes" | "no" | "maybe";

export type PreRsvpParticipant = {
  userId: string;
  userName: string;
  response: PreRsvpResponse;
};

export type PreRsvpPoll = {
  id: string;
  title: string;
  proposedDate: string; // "YYYY-MM-DD"
  proposedTime: string; // "HH:MM"
  description: string;
  responses: PreRsvpParticipant[];
  createdBy: string;
  createdAt: string;
  status: "open" | "closed";
};

export type PreRsvpAggregate = {
  yes: number;
  no: number;
  maybe: number;
  total: number;
};

// ============================================================
// localStorage 유틸
// ============================================================

const getStorageKey = (groupId: string) => `pre-rsvp-${groupId}`;

function loadPoll(groupId: string): PreRsvpPoll | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    if (!raw) return null;
    return JSON.parse(raw) as PreRsvpPoll;
  } catch {
    return null;
  }
}

function savePoll(groupId: string, poll: PreRsvpPoll | null) {
  if (typeof window === "undefined") return;
  if (poll === null) {
    removeFromStorage(getStorageKey(groupId));
  } else {
    localStorage.setItem(getStorageKey(groupId), JSON.stringify(poll));
  }
}

function generateId() {
  return `pre-rsvp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ============================================================
// 훅
// ============================================================

export function usePreRsvp(groupId: string) {
  const [poll, setPollState] = useState<PreRsvpPoll | null>(() =>
    loadPoll(groupId)
  );

  /** 내부 상태와 localStorage 동기 업데이트 */
  const syncPoll = useCallback(
    (next: PreRsvpPoll | null) => {
      savePoll(groupId, next);
      setPollState(next);
    },
    [groupId]
  );

  /** 조사 생성 */
  const createPoll = useCallback(
    (params: {
      title: string;
      proposedDate: string;
      proposedTime: string;
      description: string;
      createdBy: string;
    }) => {
      const next: PreRsvpPoll = {
        id: generateId(),
        title: params.title,
        proposedDate: params.proposedDate,
        proposedTime: params.proposedTime,
        description: params.description,
        responses: [],
        createdBy: params.createdBy,
        createdAt: new Date().toISOString(),
        status: "open",
      };
      syncPoll(next);
      return next;
    },
    [syncPoll]
  );

  /** 응답 제출 / 수정 */
  const submitResponse = useCallback(
    (params: {
      userId: string;
      userName: string;
      response: PreRsvpResponse;
    }) => {
      if (!poll) return;
      const existing = poll.responses.findIndex(
        (r) => r.userId === params.userId
      );
      const updated = [...poll.responses];
      const entry: PreRsvpParticipant = {
        userId: params.userId,
        userName: params.userName,
        response: params.response,
      };
      if (existing >= 0) {
        updated[existing] = entry;
      } else {
        updated.push(entry);
      }
      syncPoll({ ...poll, responses: updated });
    },
    [poll, syncPoll]
  );

  /** 조사 닫기 */
  const closePoll = useCallback(() => {
    if (!poll) return;
    syncPoll({ ...poll, status: "closed" });
  }, [poll, syncPoll]);

  /** 조사 삭제 */
  const deletePoll = useCallback(() => {
    syncPoll(null);
  }, [syncPoll]);

  /** 응답 집계 */
  const aggregate = useCallback((): PreRsvpAggregate => {
    if (!poll) return { yes: 0, no: 0, maybe: 0, total: 0 };
    const yes = poll.responses.filter((r) => r.response === "yes").length;
    const no = poll.responses.filter((r) => r.response === "no").length;
    const maybe = poll.responses.filter((r) => r.response === "maybe").length;
    return { yes, no, maybe, total: poll.responses.length };
  }, [poll]);

  /** 특정 사용자의 응답 조회 */
  const getMyResponse = useCallback(
    (userId: string): PreRsvpResponse | null => {
      if (!poll) return null;
      return poll.responses.find((r) => r.userId === userId)?.response ?? null;
    },
    [poll]
  );

  return {
    poll,
    createPoll,
    submitResponse,
    closePoll,
    deletePoll,
    aggregate,
    getMyResponse,
  };
}
