"use client";

import { useState, useCallback } from "react";
import type { UnifiedCalendarEvent, UnifiedEventType } from "@/types";

// ============================================================
// 상수
// ============================================================

export const UNIFIED_EVENT_TYPE_LABELS: Record<UnifiedEventType, string> = {
  practice: "연습",
  performance: "공연",
  meeting: "회의",
  social: "모임",
  competition: "대회",
  workshop: "워크샵",
  other: "기타",
};

export const UNIFIED_EVENT_TYPE_COLORS: Record<
  UnifiedEventType,
  { bg: string; text: string; border: string; dot: string; badge: string }
> = {
  practice: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    dot: "bg-green-500",
    badge: "bg-green-100 text-green-700 border-green-200",
  },
  performance: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
    badge: "bg-red-100 text-red-700 border-red-200",
  },
  meeting: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
  },
  social: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    dot: "bg-orange-500",
    badge: "bg-orange-100 text-orange-700 border-orange-200",
  },
  competition: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    dot: "bg-purple-500",
    badge: "bg-purple-100 text-purple-700 border-purple-200",
  },
  workshop: {
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    border: "border-cyan-200",
    dot: "bg-cyan-500",
    badge: "bg-cyan-100 text-cyan-700 border-cyan-200",
  },
  other: {
    bg: "bg-gray-50",
    text: "text-gray-600",
    border: "border-gray-200",
    dot: "bg-gray-400",
    badge: "bg-gray-100 text-gray-600 border-gray-200",
  },
};

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(groupId: string): string {
  return `dancebase:unified-calendar:${groupId}`;
}

function loadEvents(groupId: string): UnifiedCalendarEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as UnifiedCalendarEvent[];
  } catch {
    return [];
  }
}

function saveEvents(groupId: string, events: UnifiedCalendarEvent[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId), JSON.stringify(events));
  } catch {
    // 무시
  }
}

// ============================================================
// 통계 타입
// ============================================================

export type UnifiedCalendarStats = {
  totalEvents: number;
  thisMonthCount: number;
  upcomingCount: number;
  typeDistribution: Record<UnifiedEventType, number>;
};

// ============================================================
// 훅
// ============================================================

export function useUnifiedCalendar(groupId: string) {
  const [events, setEvents] = useState<UnifiedCalendarEvent[]>(() => loadEvents(groupId));

  const reload = useCallback(() => {
    if (!groupId) return;
    const data = loadEvents(groupId);
    setEvents(data);
  }, [groupId]);

  // 내부 저장 헬퍼
  const persist = useCallback(
    (next: UnifiedCalendarEvent[]) => {
      saveEvents(groupId, next);
      setEvents(next);
    },
    [groupId]
  );

  // 이벤트 추가
  const addEvent = useCallback(
    (params: Omit<UnifiedCalendarEvent, "id" | "createdAt">): UnifiedCalendarEvent => {
      const newEvent: UnifiedCalendarEvent = {
        ...params,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      persist([...events, newEvent]);
      return newEvent;
    },
    [events, persist]
  );

  // 이벤트 수정
  const updateEvent = useCallback(
    (id: string, patch: Partial<Omit<UnifiedCalendarEvent, "id" | "createdAt">>) => {
      const next = events.map((e) => (e.id === id ? { ...e, ...patch } : e));
      persist(next);
    },
    [events, persist]
  );

  // 이벤트 삭제
  const deleteEvent = useCallback(
    (id: string) => {
      persist(events.filter((e) => e.id !== id));
    },
    [events, persist]
  );

  // 날짜별 조회
  const getByDate = useCallback(
    (date: string): UnifiedCalendarEvent[] => {
      return events
        .filter((e) => e.date === date)
        .sort((a, b) => {
          if (a.isAllDay && !b.isAllDay) return -1;
          if (!a.isAllDay && b.isAllDay) return 1;
          return a.startTime.localeCompare(b.startTime);
        });
    },
    [events]
  );

  // 월별 조회
  const getByMonth = useCallback(
    (year: number, month: number): UnifiedCalendarEvent[] => {
      const prefix = `${year}-${String(month).padStart(2, "0")}`;
      return events
        .filter((e) => e.date.startsWith(prefix))
        .sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          if (a.isAllDay && !b.isAllDay) return -1;
          if (!a.isAllDay && b.isAllDay) return 1;
          return a.startTime.localeCompare(b.startTime);
        });
    },
    [events]
  );

  // 유형별 조회
  const getByType = useCallback(
    (type: UnifiedEventType): UnifiedCalendarEvent[] => {
      return events
        .filter((e) => e.type === type)
        .sort((a, b) => a.date.localeCompare(b.date));
    },
    [events]
  );

  // 다가오는 N일 이벤트
  const getUpcoming = useCallback(
    (days = 7): UnifiedCalendarEvent[] => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const end = new Date(today);
      end.setDate(end.getDate() + days);

      const todayStr = today.toISOString().slice(0, 10);
      const endStr = end.toISOString().slice(0, 10);

      return events
        .filter((e) => e.date >= todayStr && e.date <= endStr)
        .sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          if (a.isAllDay && !b.isAllDay) return -1;
          if (!a.isAllDay && b.isAllDay) return 1;
          return a.startTime.localeCompare(b.startTime);
        });
    },
    [events]
  );

  // 통계
  const stats: UnifiedCalendarStats = (() => {
    const now = new Date();
    const thisMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const todayStr = now.toISOString().slice(0, 10);
    const endStr = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const typeDistribution: Record<UnifiedEventType, number> = {
      practice: 0,
      performance: 0,
      meeting: 0,
      social: 0,
      competition: 0,
      workshop: 0,
      other: 0,
    };

    let thisMonthCount = 0;
    let upcomingCount = 0;

    for (const e of events) {
      typeDistribution[e.type] += 1;
      if (e.date.startsWith(thisMonthPrefix)) thisMonthCount += 1;
      if (e.date >= todayStr && e.date <= endStr) upcomingCount += 1;
    }

    return {
      totalEvents: events.length,
      thisMonthCount,
      upcomingCount,
      typeDistribution,
    };
  })();

  return {
    events,
    loading: false,
    addEvent,
    updateEvent,
    deleteEvent,
    getByDate,
    getByMonth,
    getByType,
    getUpcoming,
    stats,
    refetch: reload,
  };
}
