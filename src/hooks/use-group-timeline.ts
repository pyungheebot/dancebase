"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { invalidateGroupTimeline } from "@/lib/swr/invalidate";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  GroupTimelineData,
  GroupTimelineEvent,
  GroupTimelineCategory,
  GroupTimelineImportance,
} from "@/types";

const STORAGE_KEY = (groupId: string) => `${groupId}${groupId}`;

export function useGroupTimeline(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.groupTimeline(groupId),
    async () => loadFromStorage<GroupTimelineData>(STORAGE_KEY(groupId), {} as GroupTimelineData)
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
    saveToStorage(STORAGE_KEY(groupId), next);
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
    saveToStorage(STORAGE_KEY(groupId), next);
    await mutate(next, false);
    invalidateGroupTimeline(groupId);
  }

  async function deleteEvent(id: string) {
    const next: GroupTimelineData = {
      ...currentData,
      events: currentData.events.filter((e) => e.id !== id),
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(STORAGE_KEY(groupId), next);
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
