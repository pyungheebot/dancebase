"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { invalidateGroupTimeline } from "@/lib/swr/invalidate";
import type {
  GroupTimelineData,
  GroupTimelineEvent,
  GroupTimelineCategory,
  GroupTimelineImportance,
} from "@/types";

const STORAGE_PREFIX = "group-timeline-";

function loadFromStorage(groupId: string): GroupTimelineData {
  if (typeof window === "undefined") {
    return { groupId, events: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${groupId}`);
    if (raw) return JSON.parse(raw) as GroupTimelineData;
  } catch {
    // 파싱 실패 시 기본값 반환
  }
  return { groupId, events: [], updatedAt: new Date().toISOString() };
}

function saveToStorage(data: GroupTimelineData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    `${STORAGE_PREFIX}${data.groupId}`,
    JSON.stringify(data)
  );
}

export function useGroupTimeline(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.groupTimeline(groupId),
    async () => loadFromStorage(groupId)
  );

  const currentData = data ?? { groupId, events: [], updatedAt: new Date().toISOString() };

  async function addEvent(
    input: Omit<GroupTimelineEvent, "id" | "createdAt">
  ) {
    const newEvent: GroupTimelineEvent = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    const next: GroupTimelineData = {
      ...currentData,
      events: [...currentData.events, newEvent],
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(next);
    await mutate(next, false);
    invalidateGroupTimeline(groupId);
  }

  async function updateEvent(
    id: string,
    input: Partial<Omit<GroupTimelineEvent, "id" | "createdAt">>
  ) {
    const next: GroupTimelineData = {
      ...currentData,
      events: currentData.events.map((e) =>
        e.id === id ? { ...e, ...input } : e
      ),
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(next);
    await mutate(next, false);
    invalidateGroupTimeline(groupId);
  }

  async function deleteEvent(id: string) {
    const next: GroupTimelineData = {
      ...currentData,
      events: currentData.events.filter((e) => e.id !== id),
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(next);
    await mutate(next, false);
    invalidateGroupTimeline(groupId);
  }

  return {
    data: currentData,
    loading: isLoading,
    addEvent,
    updateEvent,
    deleteEvent,
    refetch: () => mutate(),
  };
}

export type { GroupTimelineCategory, GroupTimelineImportance };
