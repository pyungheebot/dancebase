"use client";

import { useState, useCallback } from "react";
import { removeFromStorage } from "@/lib/local-storage";

// ============================================================
// 타입 정의
// ============================================================

export type AvailabilityResponse = {
  /** "YYYY-MM-DD_시간대" 형태의 키 → 가용 여부 */
  [dateTimeKey: string]: boolean;
};

export type AvailabilityPollParticipant = {
  userId: string;
  userName: string;
  available: AvailabilityResponse;
};

export type AvailabilityPoll = {
  id: string;
  title: string;
  dates: string[]; // "YYYY-MM-DD" 목록
  timeSlots: string[]; // "오전" | "오후" | "저녁"
  responses: AvailabilityPollParticipant[];
  createdBy: string;
  createdAt: string;
};

export type SlotCount = {
  dateTimeKey: string; // "YYYY-MM-DD_시간대"
  date: string;
  timeSlot: string;
  count: number;
};

// ============================================================
// localStorage 유틸
// ============================================================

const getStorageKey = (groupId: string) => `availability-poll-${groupId}`;

function loadPoll(groupId: string): AvailabilityPoll | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    if (!raw) return null;
    return JSON.parse(raw) as AvailabilityPoll;
  } catch {
    return null;
  }
}

function savePoll(groupId: string, poll: AvailabilityPoll | null) {
  if (typeof window === "undefined") return;
  if (poll === null) {
    removeFromStorage(getStorageKey(groupId));
  } else {
    localStorage.setItem(getStorageKey(groupId), JSON.stringify(poll));
  }
}

function generateId() {
  return `poll-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ============================================================
// 훅
// ============================================================

export function useAvailabilityPoll(groupId: string) {
  const [poll, setPollState] = useState<AvailabilityPoll | null>(() =>
    loadPoll(groupId)
  );

  /** 내부 상태와 localStorage 동기 업데이트 */
  const syncPoll = useCallback(
    (next: AvailabilityPoll | null) => {
      savePoll(groupId, next);
      setPollState(next);
    },
    [groupId]
  );

  /** 투표 생성 */
  const createPoll = useCallback(
    (params: {
      title: string;
      dates: string[];
      timeSlots: string[];
      createdBy: string;
    }) => {
      const next: AvailabilityPoll = {
        id: generateId(),
        title: params.title,
        dates: params.dates,
        timeSlots: params.timeSlots,
        responses: [],
        createdBy: params.createdBy,
        createdAt: new Date().toISOString(),
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
      available: AvailabilityResponse;
    }) => {
      if (!poll) return;
      const existing = poll.responses.findIndex(
        (r) => r.userId === params.userId
      );
      const updated = [...poll.responses];
      const entry: AvailabilityPollParticipant = {
        userId: params.userId,
        userName: params.userName,
        available: params.available,
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

  /** 투표 삭제 */
  const deletePoll = useCallback(() => {
    syncPoll(null);
  }, [syncPoll]);

  /** 결과 집계 — 슬롯별 가용 인원 수 반환 */
  const aggregateResults = useCallback((): SlotCount[] => {
    if (!poll) return [];
    const result: SlotCount[] = [];
    for (const date of poll.dates) {
      for (const timeSlot of poll.timeSlots) {
        const key = `${date}_${timeSlot}`;
        const count = poll.responses.filter((r) => r.available[key]).length;
        result.push({ dateTimeKey: key, date, timeSlot, count });
      }
    }
    return result;
  }, [poll]);

  /** 최적 시간 (가용 인원 최다 슬롯) */
  const getOptimalSlot = useCallback((): SlotCount | null => {
    const slots = aggregateResults();
    if (slots.length === 0) return null;
    const max = Math.max(...slots.map((s) => s.count));
    if (max === 0) return null;
    return slots.find((s) => s.count === max) ?? null;
  }, [aggregateResults]);

  /** 특정 사용자의 기존 응답 조회 */
  const getMyResponse = useCallback(
    (userId: string): AvailabilityResponse | null => {
      if (!poll) return null;
      return poll.responses.find((r) => r.userId === userId)?.available ?? null;
    },
    [poll]
  );

  return {
    poll,
    createPoll,
    submitResponse,
    deletePoll,
    aggregateResults,
    getOptimalSlot,
    getMyResponse,
  };
}
