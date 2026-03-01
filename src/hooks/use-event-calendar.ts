"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { CalendarEvent, CalendarEventType } from "@/types";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";

// ============================================
// 상수 및 localStorage 키
// ============================================

const LS_KEY = (groupId: string) =>
  `dancebase:event-calendar:${groupId}`;

// ============================================
// localStorage 헬퍼
// ============================================

function loadEvents(groupId: string): CalendarEvent[] {
  return loadFromStorage<CalendarEvent[]>(LS_KEY(groupId), []);
}

function saveEvents(groupId: string, events: CalendarEvent[]): void {
  saveToStorage(LS_KEY(groupId), events);
}

// ============================================
// 날짜 헬퍼
// ============================================

function todayYMD(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toYMD(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// ============================================
// 훅
// ============================================

export function useEventCalendar(groupId: string) {
  const { data: events, mutate } = useSWR(
    groupId ? swrKeys.eventCalendar(groupId) : null,
    () => loadEvents(groupId),
    { revalidateOnFocus: false }
  );

  const allEvents: CalendarEvent[] = useMemo(() => events ?? [], [events]);

  // ── CRUD ────────────────────────────────────────────────

  const addEvent = useCallback((
    input: Omit<CalendarEvent, "id" | "createdAt">
  ): CalendarEvent => {
    const newEvent: CalendarEvent = {
      ...input,
      id: `ce-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    };
    const next = [...allEvents, newEvent];
    saveEvents(groupId, next);
    mutate(next, false);
    return newEvent;
  }, [allEvents, groupId, mutate]);

  function updateEvent(
    id: string,
    partial: Partial<Omit<CalendarEvent, "id" | "createdAt">>
  ): void {
    const next = allEvents.map((e) =>
      e.id === id ? { ...e, ...partial } : e
    );
    saveEvents(groupId, next);
    mutate(next, false);
  }

  function deleteEvent(id: string): void {
    const next = allEvents.filter((e) => e.id !== id);
    saveEvents(groupId, next);
    mutate(next, false);
  }

  // ── 조회 헬퍼 ────────────────────────────────────────────

  /** 특정 연월의 이벤트 반환 (month: 1~12) */
  function getEventsByMonth(year: number, month: number): CalendarEvent[] {
    const prefix = toYMD(year, month, 1).slice(0, 7); // YYYY-MM
    return allEvents
      .filter((e) => e.date.startsWith(prefix))
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
      });
  }

  /** 특정 날짜(YYYY-MM-DD)의 이벤트 반환 */
  function getEventsByDate(date: string): CalendarEvent[] {
    return allEvents
      .filter((e) => e.date === date)
      .sort((a, b) => a.time.localeCompare(b.time));
  }

  /** 오늘 이후 가장 가까운 이벤트 limit개 반환 */
  function getUpcomingEvents(limit = 5): CalendarEvent[] {
    const today = todayYMD();
    return allEvents
      .filter((e) => e.date >= today)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
      })
      .slice(0, limit);
  }

  // ── 통계 ────────────────────────────────────────────────

  const today = todayYMD();
  const thisMonthPrefix = today.slice(0, 7); // YYYY-MM

  const totalEvents = allEvents.length;
  const thisMonthCount = allEvents.filter((e) =>
    e.date.startsWith(thisMonthPrefix)
  ).length;

  const upcomingEvents = allEvents
    .filter((e) => e.date >= today)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });

  const nextEventDate =
    upcomingEvents.length > 0 ? upcomingEvents[0].date : null;

  return {
    events: allEvents,
    // CRUD
    addEvent,
    updateEvent,
    deleteEvent,
    // 조회
    getEventsByMonth,
    getEventsByDate,
    getUpcomingEvents,
    // 통계
    totalEvents,
    thisMonthCount,
    nextEventDate,
    // SWR
    loading: events === undefined,
    refetch: () => mutate(),
  };
}

// ============================================
// 타입 색상 헬퍼 (컴포넌트에서 공유)
// ============================================

export const EVENT_TYPE_COLORS: Record<
  CalendarEventType,
  { bg: string; text: string; dot: string; badge: string }
> = {
  practice: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700",
  },
  performance: {
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
    badge: "bg-red-100 text-red-700",
  },
  meeting: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    dot: "bg-purple-500",
    badge: "bg-purple-100 text-purple-700",
  },
  workshop: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    dot: "bg-orange-500",
    badge: "bg-orange-100 text-orange-700",
  },
  social: {
    bg: "bg-pink-50",
    text: "text-pink-700",
    dot: "bg-pink-500",
    badge: "bg-pink-100 text-pink-700",
  },
  other: {
    bg: "bg-gray-50",
    text: "text-gray-700",
    dot: "bg-gray-400",
    badge: "bg-gray-100 text-gray-700",
  },
};

export const EVENT_TYPE_LABELS: Record<CalendarEventType, string> = {
  practice: "연습",
  performance: "공연",
  meeting: "모임",
  workshop: "워크숍",
  social: "친목",
  other: "기타",
};
