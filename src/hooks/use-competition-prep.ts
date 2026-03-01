"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  CompetitionPrepEvent,
  CompetitionPrepItem,
  CompetitionPrepCategory,
} from "@/types";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";

// ============================================================
// localStorage 유틸
// ============================================================

function getStorageKey(groupId: string): string {
  return `dancebase:competition-prep:${groupId}`;
}

function loadEvents(groupId: string): CompetitionPrepEvent[] {
  return loadFromStorage<CompetitionPrepEvent[]>(getStorageKey(groupId), []);
}

function saveEvents(groupId: string, events: CompetitionPrepEvent[]): void {
  saveToStorage(getStorageKey(groupId), events);
}

// ============================================================
// 훅
// ============================================================

export function useCompetitionPrep(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.competitionPrep(groupId),
    async () => loadEvents(groupId)
  );

  const events = data ?? [];

  // ── 이벤트 추가 ──
  async function addEvent(
    input: Omit<CompetitionPrepEvent, "id" | "createdAt" | "items">
  ): Promise<CompetitionPrepEvent> {
    const newEvent: CompetitionPrepEvent = {
      ...input,
      id: crypto.randomUUID(),
      items: [],
      createdAt: new Date().toISOString(),
    };
    const updated = [...events, newEvent];
    saveEvents(groupId, updated);
    await mutate(updated, false);
    return newEvent;
  }

  // ── 이벤트 수정 ──
  async function updateEvent(
    eventId: string,
    changes: Partial<Omit<CompetitionPrepEvent, "id" | "createdAt" | "items">>
  ): Promise<void> {
    const updated = events.map((e) =>
      e.id === eventId ? { ...e, ...changes } : e
    );
    saveEvents(groupId, updated);
    await mutate(updated, false);
  }

  // ── 이벤트 삭제 ──
  async function deleteEvent(eventId: string): Promise<void> {
    const updated = events.filter((e) => e.id !== eventId);
    saveEvents(groupId, updated);
    await mutate(updated, false);
  }

  // ── 아이템 추가 ──
  async function addItem(
    eventId: string,
    input: Omit<CompetitionPrepItem, "id" | "isCompleted">
  ): Promise<void> {
    const newItem: CompetitionPrepItem = {
      ...input,
      id: crypto.randomUUID(),
      isCompleted: false,
    };
    const updated = events.map((e) => {
      if (e.id !== eventId) return e;
      return { ...e, items: [...e.items, newItem] };
    });
    saveEvents(groupId, updated);
    await mutate(updated, false);
  }

  // ── 아이템 수정 ──
  async function updateItem(
    eventId: string,
    itemId: string,
    changes: Partial<Omit<CompetitionPrepItem, "id">>
  ): Promise<void> {
    const updated = events.map((e) => {
      if (e.id !== eventId) return e;
      return {
        ...e,
        items: e.items.map((item) =>
          item.id === itemId ? { ...item, ...changes } : item
        ),
      };
    });
    saveEvents(groupId, updated);
    await mutate(updated, false);
  }

  // ── 아이템 삭제 ──
  async function deleteItem(eventId: string, itemId: string): Promise<void> {
    const updated = events.map((e) => {
      if (e.id !== eventId) return e;
      return { ...e, items: e.items.filter((item) => item.id !== itemId) };
    });
    saveEvents(groupId, updated);
    await mutate(updated, false);
  }

  // ── 완료 토글 ──
  async function toggleComplete(
    eventId: string,
    itemId: string
  ): Promise<void> {
    const updated = events.map((e) => {
      if (e.id !== eventId) return e;
      return {
        ...e,
        items: e.items.map((item) =>
          item.id === itemId
            ? { ...item, isCompleted: !item.isCompleted }
            : item
        ),
      };
    });
    saveEvents(groupId, updated);
    await mutate(updated, false);
  }

  // ── 카테고리별 아이템 가져오기 ──
  function getItemsByCategory(
    eventId: string,
    category: CompetitionPrepCategory
  ): CompetitionPrepItem[] {
    const event = events.find((e) => e.id === eventId);
    if (!event) return [];
    return event.items.filter((item) => item.category === category);
  }

  // ── 통계 ──
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalEvents = events.length;

  const upcomingEvents = events.filter((e) => {
    const eventDate = new Date(e.date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate >= today;
  }).length;

  const totalItems = events.reduce((sum, e) => sum + e.items.length, 0);
  const completedItems = events.reduce(
    (sum, e) => sum + e.items.filter((item) => item.isCompleted).length,
    0
  );
  const overallCompletionRate =
    totalItems === 0
      ? 0
      : Math.round((completedItems / totalItems) * 100);

  const stats = {
    totalEvents,
    upcomingEvents,
    overallCompletionRate,
    totalItems,
    completedItems,
  };

  return {
    events,
    loading: isLoading,
    refetch: () => mutate(),
    addEvent,
    updateEvent,
    deleteEvent,
    addItem,
    updateItem,
    deleteItem,
    toggleComplete,
    getItemsByCategory,
    stats,
  };
}
