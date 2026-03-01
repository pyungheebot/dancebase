"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { GroupEvent, EventTag } from "@/types";
import { saveToStorage } from "@/lib/local-storage";

const STORAGE_KEY_PREFIX = "dancebase:event-gallery:";
const MAX_EVENTS = 100;

function getStorageKey(groupId: string): string {
  return `${STORAGE_KEY_PREFIX}${groupId}`;
}

function saveEvents(groupId: string, events: GroupEvent[]): void {
  saveToStorage(getStorageKey(groupId), events);
}

function sortByDateDesc(events: GroupEvent[]): GroupEvent[] {
  return [...events].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export type GroupEventInput = {
  title: string;
  date: string;
  location: string;
  description: string;
  tag: EventTag;
  participantCount: number;
};

export function useEventGallery(groupId: string) {
  const [events, setEvents] = useState<GroupEvent[]>([]);
  const [tagFilter, setTagFilter] = useState<EventTag | "all">("all");
  const [yearFilter, setYearFilter] = useState<number | "all">("all");

  // 저장 + 상태 업데이트
  const persistAndUpdate = useCallback(
    (newEvents: GroupEvent[]) => {
      const sorted = sortByDateDesc(newEvents);
      saveEvents(groupId, sorted);
      setEvents(sorted);
    },
    [groupId]
  );

  // 연도 목록 (이벤트에서 추출)
  const availableYears = Array.from(
    new Set(events.map((e) => new Date(e.date).getFullYear()))
  ).sort((a, b) => b - a);

  // 필터 적용
  const filteredEvents = events.filter((e) => {
    const matchesTag = tagFilter === "all" || e.tag === tagFilter;
    const matchesYear =
      yearFilter === "all" ||
      new Date(e.date).getFullYear() === yearFilter;
    return matchesTag && matchesYear;
  });

  // 이벤트 추가
  const addEvent = useCallback(
    (input: GroupEventInput): boolean => {
      if (events.length >= MAX_EVENTS) {
        toast.error(`이벤트는 최대 ${MAX_EVENTS}개까지 등록할 수 있습니다.`);
        return false;
      }
      if (!input.title.trim()) {
        toast.error(TOAST.TITLE_REQUIRED_DOT);
        return false;
      }
      if (!input.date) {
        toast.error(TOAST.DATE_REQUIRED_DOT);
        return false;
      }

      const newEvent: GroupEvent = {
        id: crypto.randomUUID(),
        groupId,
        title: input.title.trim(),
        date: input.date,
        location: input.location.trim(),
        description: input.description.trim(),
        tag: input.tag,
        participantCount: Math.max(0, input.participantCount),
        createdAt: new Date().toISOString(),
      };

      persistAndUpdate([...events, newEvent]);
      toast.success(TOAST.EVENT.REGISTERED);
      return true;
    },
    [events, groupId, persistAndUpdate]
  );

  // 이벤트 수정
  const updateEvent = useCallback(
    (id: string, input: GroupEventInput): boolean => {
      if (!input.title.trim()) {
        toast.error(TOAST.TITLE_REQUIRED_DOT);
        return false;
      }
      if (!input.date) {
        toast.error(TOAST.DATE_REQUIRED_DOT);
        return false;
      }

      const updated = events.map((e) =>
        e.id === id
          ? {
              ...e,
              title: input.title.trim(),
              date: input.date,
              location: input.location.trim(),
              description: input.description.trim(),
              tag: input.tag,
              participantCount: Math.max(0, input.participantCount),
            }
          : e
      );

      persistAndUpdate(updated);
      toast.success(TOAST.SHOW_TIMELINE.EVENT_UPDATED_DOT);
      return true;
    },
    [events, persistAndUpdate]
  );

  // 이벤트 삭제
  const deleteEvent = useCallback(
    (id: string): void => {
      const updated = events.filter((e) => e.id !== id);
      persistAndUpdate(updated);
      toast.success(TOAST.SHOW_TIMELINE.EVENT_DELETED_DOT);
    },
    [events, persistAndUpdate]
  );

  return {
    events,
    filteredEvents,
    loading: false,
    tagFilter,
    setTagFilter,
    yearFilter,
    setYearFilter,
    availableYears,
    addEvent,
    updateEvent,
    deleteEvent,
    totalCount: events.length,
    maxReached: events.length >= MAX_EVENTS,
  };
}
