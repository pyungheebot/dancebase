"use client";

import { useState, useCallback } from "react";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import { filterByDatePrefix } from "@/lib/date-utils";
import type {
  GroupCalendarEvent,
  GroupEventCalendarData,
  GroupEventCategory,
  GroupEventRsvp,
  GroupEventRsvpStatus,
} from "@/types";

// ============================================================
// 상수
// ============================================================

export const GROUP_EVENT_CATEGORIES: GroupEventCategory[] = [
  "공연",
  "워크숍",
  "모임",
  "대회",
  "축제",
  "연습",
  "기타",
];

export const GROUP_EVENT_CATEGORY_COLORS: Record<
  GroupEventCategory,
  { bg: string; text: string; dot: string; badge: string }
> = {
  공연: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    dot: "bg-purple-500",
    badge: "bg-purple-100 text-purple-700",
  },
  워크숍: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    dot: "bg-orange-500",
    badge: "bg-orange-100 text-orange-700",
  },
  모임: {
    bg: "bg-pink-50",
    text: "text-pink-700",
    dot: "bg-pink-500",
    badge: "bg-pink-100 text-pink-700",
  },
  대회: {
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
    badge: "bg-red-100 text-red-700",
  },
  축제: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    dot: "bg-yellow-500",
    badge: "bg-yellow-100 text-yellow-700",
  },
  연습: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
    badge: "bg-blue-100 text-blue-700",
  },
  기타: {
    bg: "bg-gray-50",
    text: "text-gray-700",
    dot: "bg-gray-400",
    badge: "bg-gray-100 text-gray-700",
  },
};

export const RSVP_STATUS_LABELS: Record<GroupEventRsvpStatus, string> = {
  참석: "참석",
  미참석: "미참석",
  미정: "미정",
};

export const RSVP_STATUS_COLORS: Record<
  GroupEventRsvpStatus,
  { bg: string; text: string; border: string }
> = {
  참석: {
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-300",
  },
  미참석: {
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-300",
  },
  미정: {
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-300",
  },
};

// ============================================================
// localStorage 헬퍼
// ============================================================

const USER_ID_KEY = "group-event-calendar:userId";

function getOrCreateUserId(): string {
  if (typeof window === "undefined") return "anonymous";
  try {
    const stored = localStorage.getItem(USER_ID_KEY);
    if (stored) return stored;
    const newId = crypto.randomUUID();
    localStorage.setItem(USER_ID_KEY, newId);
    return newId;
  } catch {
    return "anonymous";
  }
}

function storageKey(groupId: string): string {
  return swrKeys.groupEventCalendar(groupId);
}

// ============================================================
// 날짜 헬퍼
// ============================================================

export function todayYMD(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** 두 날짜(YYYY-MM-DD) 간의 D-day 계산 (양수: 미래, 음수: 과거) */
export function calcDday(targetDate: string): number {
  const today = new Date(todayYMD());
  const target = new Date(targetDate);
  const diff = target.getTime() - today.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

/** D-day 문자열 포맷 */
export function formatDday(dday: number): string {
  if (dday === 0) return "D-Day";
  if (dday > 0) return `D-${dday}`;
  return `D+${Math.abs(dday)}`;
}

// ============================================================
// 통계 타입
// ============================================================

export type GroupEventCalendarStats = {
  /** 이번 달 이벤트 수 */
  thisMonthCount: number;
  /** 전체 이벤트 수 */
  totalCount: number;
  /** 다음 이벤트 D-day (없으면 null) */
  nextEventDday: number | null;
  /** 다음 이벤트 (없으면 null) */
  nextEvent: GroupCalendarEvent | null;
  /** 내 RSVP 현황 */
  myRsvp: {
    attending: number;
    notAttending: number;
    pending: number;
  };
};

// ============================================================
// 훅
// ============================================================

export function useGroupEventCalendar(groupId: string) {
  const [events, setEvents] = useState<GroupCalendarEvent[]>(() => loadFromStorage<GroupEventCalendarData>(storageKey(groupId), {} as GroupEventCalendarData).events);
  const [userId] = useState<string>(() => getOrCreateUserId());

  const reload = useCallback(() => {
    if (!groupId) return;
    const data = loadFromStorage<GroupEventCalendarData>(storageKey(groupId), {} as GroupEventCalendarData);
    setEvents(data.events);
  }, [groupId]);

  const persist = useCallback(
    (updated: GroupCalendarEvent[]) => {
      const data: GroupEventCalendarData = {
        groupId,
        events: updated,
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(storageKey(groupId), data);
      setEvents(updated);
    },
    [groupId]
  );

  // ── CRUD ────────────────────────────────────────────────────

  /** 이벤트 추가 */
  const addEvent = useCallback(
    (params: Omit<GroupCalendarEvent, "id" | "rsvps" | "createdAt">): GroupCalendarEvent => {
      const newEvent: GroupCalendarEvent = {
        ...params,
        id: crypto.randomUUID(),
        rsvps: [],
        createdAt: new Date().toISOString(),
      };
      persist([...events, newEvent]);
      return newEvent;
    },
    [events, persist]
  );

  /** 이벤트 수정 */
  const updateEvent = useCallback(
    (
      eventId: string,
      params: Partial<Omit<GroupCalendarEvent, "id" | "createdAt" | "rsvps">>
    ): boolean => {
      const idx = events.findIndex((e) => e.id === eventId);
      if (idx === -1) return false;
      const updated = events.map((e) =>
        e.id === eventId ? { ...e, ...params } : e
      );
      persist(updated);
      return true;
    },
    [events, persist]
  );

  /** 이벤트 삭제 */
  const deleteEvent = useCallback(
    (eventId: string): boolean => {
      const exists = events.some((e) => e.id === eventId);
      if (!exists) return false;
      persist(events.filter((e) => e.id !== eventId));
      return true;
    },
    [events, persist]
  );

  // ── RSVP ────────────────────────────────────────────────────

  /** RSVP 설정 (현재 사용자) */
  const setRsvp = useCallback(
    (eventId: string, status: GroupEventRsvpStatus): boolean => {
      const event = events.find((e) => e.id === eventId);
      if (!event) return false;

      const now = new Date().toISOString();
      const existing = event.rsvps.find((r) => r.userId === userId);

      let updatedRsvps: GroupEventRsvp[];
      if (existing) {
        updatedRsvps = event.rsvps.map((r) =>
          r.userId === userId ? { ...r, status, updatedAt: now } : r
        );
      } else {
        updatedRsvps = [...event.rsvps, { userId, status, updatedAt: now }];
      }

      const updated = events.map((e) =>
        e.id === eventId ? { ...e, rsvps: updatedRsvps } : e
      );
      persist(updated);
      return true;
    },
    [events, persist, userId]
  );

  /** 현재 사용자의 특정 이벤트 RSVP 상태 조회 */
  const getMyRsvp = useCallback(
    (eventId: string): GroupEventRsvpStatus | null => {
      const event = events.find((e) => e.id === eventId);
      if (!event) return null;
      const rsvp = event.rsvps.find((r) => r.userId === userId);
      return rsvp?.status ?? null;
    },
    [events, userId]
  );

  // ── 조회 헬퍼 ────────────────────────────────────────────────

  /** 특정 연월의 이벤트 반환 (month: 1~12) */
  const getEventsByMonth = useCallback(
    (year: number, month: number): GroupCalendarEvent[] => {
      const prefix = `${year}-${String(month).padStart(2, "0")}`;
      return filterByDatePrefix(events, prefix).sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
      });
    },
    [events]
  );

  /** 특정 날짜(YYYY-MM-DD)의 이벤트 반환 */
  const getEventsByDate = useCallback(
    (date: string): GroupCalendarEvent[] => {
      return events
        .filter((e) => e.date === date)
        .sort((a, b) => a.time.localeCompare(b.time));
    },
    [events]
  );

  /** 오늘 이후 다가오는 이벤트 (limit개) */
  const getUpcomingEvents = useCallback(
    (limit = 5): GroupCalendarEvent[] => {
      const today = todayYMD();
      return events
        .filter((e) => e.date >= today)
        .sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return a.time.localeCompare(b.time);
        })
        .slice(0, limit);
    },
    [events]
  );

  // ── 통계 ────────────────────────────────────────────────────

  const stats: GroupEventCalendarStats = (() => {
    const today = todayYMD();
    const thisMonthPrefix = today.slice(0, 7);

    const thisMonthCount = events.filter((e) =>
      e.date.startsWith(thisMonthPrefix)
    ).length;

    const upcoming = events
      .filter((e) => e.date >= today)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
      });

    const nextEvent = upcoming.length > 0 ? upcoming[0] : null;
    const nextEventDday = nextEvent ? calcDday(nextEvent.date) : null;

    // 내 RSVP 현황
    let attending = 0;
    let notAttending = 0;
    let pending = 0;
    for (const ev of events) {
      const rsvp = ev.rsvps.find((r) => r.userId === userId);
      if (!rsvp || rsvp.status === "미정") pending++;
      else if (rsvp.status === "참석") attending++;
      else notAttending++;
    }

    return {
      thisMonthCount,
      totalCount: events.length,
      nextEventDday,
      nextEvent,
      myRsvp: { attending, notAttending, pending },
    };
  })();

  return {
    events,
    loading: false,
    userId,
    stats,
    // CRUD
    addEvent,
    updateEvent,
    deleteEvent,
    // RSVP
    setRsvp,
    getMyRsvp,
    // 조회
    getEventsByMonth,
    getEventsByDate,
    getUpcomingEvents,
    refetch: reload,
  };
}
