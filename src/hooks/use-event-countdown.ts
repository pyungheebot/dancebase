"use client";

import { useState, useCallback } from "react";
import type { CountdownEvent } from "@/types";
import { loadFromStorage } from "@/lib/local-storage";

// ============================================
// 상수
// ============================================

const STORAGE_KEY_PREFIX = "dancebase:countdowns:";
const MAX_EVENTS = 10;

// ============================================
// localStorage 헬퍼
// ============================================

function getStorageKey(groupId: string): string {
  return `${STORAGE_KEY_PREFIX}${groupId}`;
}

function persistToStorage(groupId: string, events: CountdownEvent[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(groupId), JSON.stringify(events));
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

// ============================================
// 날짜/시간 헬퍼
// ============================================

/** 이벤트 대상 날짜/시간을 Date 객체로 변환 */
export function getEventDateTime(event: CountdownEvent): Date {
  if (event.eventTime) {
    return new Date(`${event.eventDate}T${event.eventTime}:00`);
  }
  // 시간 미지정 시 해당 날짜 자정(00:00)으로 설정
  return new Date(`${event.eventDate}T00:00:00`);
}

/** 이벤트가 이미 지났는지 확인 */
export function isPastEvent(event: CountdownEvent): boolean {
  const target = getEventDateTime(event);
  return target.getTime() < Date.now();
}

/** 남은 시간 계산: { days, hours, minutes } */
export function getRemainingTime(event: CountdownEvent): {
  days: number;
  hours: number;
  minutes: number;
  totalMinutes: number;
} {
  const target = getEventDateTime(event);
  const diffMs = target.getTime() - Date.now();

  if (diffMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, totalMinutes: 0 };
  }

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes, totalMinutes };
}

// ============================================
// 훅
// ============================================

export type UseEventCountdownResult = {
  events: CountdownEvent[];
  addEvent: (params: {
    title: string;
    eventDate: string;
    eventTime?: string;
    emoji: string;
  }) => boolean;
  deleteEvent: (id: string) => void;
  getActiveEvents: () => CountdownEvent[];
  loading: boolean;
};

export function useEventCountdown(groupId: string): UseEventCountdownResult {
  const [events, setEvents] = useState<CountdownEvent[]>(() =>
    loadFromStorage<CountdownEvent[]>(getStorageKey(groupId), [])
  );

  /** 이벤트 추가. 최대 10개 초과 시 false 반환 */
  const addEvent = useCallback(
    ({
      title,
      eventDate,
      eventTime,
      emoji,
    }: {
      title: string;
      eventDate: string;
      eventTime?: string;
      emoji: string;
    }): boolean => {
      let added = false;
      setEvents((prev) => {
        if (prev.length >= MAX_EVENTS) return prev;
        const newEvent: CountdownEvent = {
          id: `${groupId}-cd-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          title: title.trim(),
          eventDate,
          eventTime: eventTime || undefined,
          emoji,
          createdAt: new Date().toISOString(),
        };
        const next = [...prev, newEvent];
        persistToStorage(groupId, next);
        added = true;
        return next;
      });
      return added;
    },
    [groupId]
  );

  /** 이벤트 삭제 */
  const deleteEvent = useCallback(
    (id: string) => {
      setEvents((prev) => {
        const next = prev.filter((e) => e.id !== id);
        persistToStorage(groupId, next);
        return next;
      });
    },
    [groupId]
  );

  /**
   * 활성 이벤트 목록 반환
   * - 지난 이벤트도 포함 (완료 표시용)
   * - 가까운 순(오름차순) 정렬
   */
  const getActiveEvents = useCallback((): CountdownEvent[] => {
    return [...events].sort((a, b) => {
      const aTime = getEventDateTime(a).getTime();
      const bTime = getEventDateTime(b).getTime();
      return aTime - bTime;
    });
  }, [events]);

  return {
    events,
    addEvent,
    deleteEvent,
    getActiveEvents,
    loading: false,
  };
}
