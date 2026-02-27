"use client";

import { useState, useCallback } from "react";
import type { TimeCapsuleMessage } from "@/types";

// ============================================
// 상수
// ============================================

const STORAGE_KEY_PREFIX = "dancebase:time-capsule:";
const MAX_CAPSULES = 20;

// ============================================
// localStorage 헬퍼
// ============================================

function getStorageKey(groupId: string): string {
  return `${STORAGE_KEY_PREFIX}${groupId}`;
}

function loadFromStorage(groupId: string): TimeCapsuleMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    return raw ? (JSON.parse(raw) as TimeCapsuleMessage[]) : [];
  } catch {
    return [];
  }
}

function persistToStorage(groupId: string, capsules: TimeCapsuleMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(groupId), JSON.stringify(capsules));
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

// ============================================
// 날짜 헬퍼
// ============================================

/** 오늘 날짜를 YYYY-MM-DD 문자열로 반환 */
function todayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** 개봉 가능 여부: openDate <= today */
function isOpenable(openDate: string): boolean {
  return openDate <= todayString();
}

/** 개봉일까지 남은 날 수 (음수면 지난 것) */
export function calcDaysLeft(openDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const open = new Date(openDate);
  open.setHours(0, 0, 0, 0);
  return Math.round((open.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// ============================================
// 개봉일 지난 캡슐 자동 동기화
// ============================================

function syncOpenedStatus(capsules: TimeCapsuleMessage[]): TimeCapsuleMessage[] {
  return capsules.map((c) => {
    if (!c.isOpened && isOpenable(c.openDate)) {
      return { ...c, isOpened: true };
    }
    return c;
  });
}

// ============================================
// 훅
// ============================================

export type UseTimeCapsuleResult = {
  capsules: TimeCapsuleMessage[];
  addCapsule: (params: { author: string; message: string; openDate: string }) => boolean;
  deleteCapsule: (id: string) => void;
  openCapsule: (id: string) => void;
  getAvailableCapsules: () => TimeCapsuleMessage[];
  getPendingCapsules: () => TimeCapsuleMessage[];
  loading: boolean;
};

export function useTimeCapsule(groupId: string): UseTimeCapsuleResult {
  const [capsules, setCapsules] = useState<TimeCapsuleMessage[]>(() => {
    const stored = loadFromStorage(groupId);
    // 초기 로드 시 개봉일 지난 캡슐 자동 동기화
    const synced = syncOpenedStatus(stored);
    if (synced.some((c, i) => c.isOpened !== stored[i]?.isOpened)) {
      persistToStorage(groupId, synced);
    }
    return synced;
  });

  /** 캡슐 추가. 최대 20개 초과 시 false 반환 */
  const addCapsule = useCallback(
    ({
      author,
      message,
      openDate,
    }: {
      author: string;
      message: string;
      openDate: string;
    }): boolean => {
      let added = false;
      setCapsules((prev) => {
        if (prev.length >= MAX_CAPSULES) return prev;
        const now = new Date().toISOString();
        const newCapsule: TimeCapsuleMessage = {
          id: `${groupId}-tc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          author: author.trim(),
          message: message.trim(),
          openDate,
          createdAt: now,
          isOpened: isOpenable(openDate),
        };
        const next = [...prev, newCapsule];
        persistToStorage(groupId, next);
        added = true;
        return next;
      });
      return added;
    },
    [groupId]
  );

  /** 캡슐 삭제 */
  const deleteCapsule = useCallback(
    (id: string) => {
      setCapsules((prev) => {
        const next = prev.filter((c) => c.id !== id);
        persistToStorage(groupId, next);
        return next;
      });
    },
    [groupId]
  );

  /** 수동 개봉 (개봉일이 된 캡슐만 허용) */
  const openCapsule = useCallback(
    (id: string) => {
      setCapsules((prev) => {
        const next = prev.map((c) => {
          if (c.id !== id) return c;
          if (!isOpenable(c.openDate)) return c;
          return { ...c, isOpened: true };
        });
        persistToStorage(groupId, next);
        return next;
      });
    },
    [groupId]
  );

  /** 개봉 가능한 캡슐 (openDate <= today, 아직 isOpened=false 포함) */
  const getAvailableCapsules = useCallback((): TimeCapsuleMessage[] => {
    return capsules.filter((c) => isOpenable(c.openDate));
  }, [capsules]);

  /** 아직 대기 중인 캡슐 (openDate > today) */
  const getPendingCapsules = useCallback((): TimeCapsuleMessage[] => {
    return capsules.filter((c) => !isOpenable(c.openDate));
  }, [capsules]);

  return {
    capsules,
    addCapsule,
    deleteCapsule,
    openCapsule,
    getAvailableCapsules,
    getPendingCapsules,
    loading: false,
  };
}
