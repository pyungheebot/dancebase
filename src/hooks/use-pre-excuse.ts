"use client";

import { useState, useCallback } from "react";
import type { PreExcuseEntry, PreExcuseReason } from "@/types";

// ============================================================
// localStorage 유틸
// ============================================================

const getStorageKey = (groupId: string) => `dancebase:pre-excuse:${groupId}`;

function loadEntries(groupId: string): PreExcuseEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as PreExcuseEntry[];
  } catch {
    return [];
  }
}

function saveEntries(groupId: string, entries: PreExcuseEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(groupId), JSON.stringify(entries));
}

function generateId() {
  return `pre-excuse-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ============================================================
// 훅
// ============================================================

export function usePreExcuse(groupId: string) {
  const [entries, setEntriesState] = useState<PreExcuseEntry[]>(() =>
    loadEntries(groupId)
  );

  /** 내부 상태와 localStorage 동기 업데이트 */
  const syncEntries = useCallback(
    (next: PreExcuseEntry[]) => {
      saveEntries(groupId, next);
      setEntriesState(next);
    },
    [groupId]
  );

  /**
   * 사전 결석 신고 등록
   * 이미 동일 scheduleId + userId 신고가 있으면 덮어씀
   */
  const submitExcuse = useCallback(
    (params: {
      scheduleId: string;
      userId: string;
      userName: string;
      reason: PreExcuseReason;
      memo: string;
    }) => {
      const now = new Date().toISOString();
      const existingIdx = entries.findIndex(
        (e) => e.scheduleId === params.scheduleId && e.userId === params.userId
      );
      const entry: PreExcuseEntry = {
        id: existingIdx >= 0 ? entries[existingIdx].id : generateId(),
        scheduleId: params.scheduleId,
        userId: params.userId,
        userName: params.userName,
        reason: params.reason,
        memo: params.memo,
        createdAt: existingIdx >= 0 ? entries[existingIdx].createdAt : now,
      };
      const updated = [...entries];
      if (existingIdx >= 0) {
        updated[existingIdx] = entry;
      } else {
        updated.push(entry);
      }
      syncEntries(updated);
      return entry;
    },
    [entries, syncEntries]
  );

  /**
   * 사전 결석 신고 취소
   * scheduleId + userId 로 취소 (일정 시작 전까지만 허용)
   */
  const cancelExcuse = useCallback(
    (scheduleId: string, userId: string, scheduleStartAt?: string) => {
      if (scheduleStartAt) {
        const startTime = new Date(scheduleStartAt).getTime();
        const now = Date.now();
        if (now >= startTime) {
          return false; // 이미 시작된 일정은 취소 불가
        }
      }
      const updated = entries.filter(
        (e) => !(e.scheduleId === scheduleId && e.userId === userId)
      );
      syncEntries(updated);
      return true;
    },
    [entries, syncEntries]
  );

  /** 특정 일정의 내 신고 조회 */
  const getMyExcuse = useCallback(
    (scheduleId: string, userId: string): PreExcuseEntry | null => {
      return (
        entries.find(
          (e) => e.scheduleId === scheduleId && e.userId === userId
        ) ?? null
      );
    },
    [entries]
  );

  /** 특정 일정의 전체 신고 목록 (리더용) */
  const getExcusesBySchedule = useCallback(
    (scheduleId: string): PreExcuseEntry[] => {
      return entries.filter((e) => e.scheduleId === scheduleId);
    },
    [entries]
  );

  /** 특정 일정의 신고 수 */
  const getExcuseCount = useCallback(
    (scheduleId: string): number => {
      return entries.filter((e) => e.scheduleId === scheduleId).length;
    },
    [entries]
  );

  return {
    entries,
    submitExcuse,
    cancelExcuse,
    getMyExcuse,
    getExcusesBySchedule,
    getExcuseCount,
  };
}
