"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  TeamBuildingEvent,
  TeamBuildingCategory,
  TeamBuildingParticipant,
} from "@/types";

// ============================================================
// localStorage 유틸
// ============================================================

function getStorageKey(groupId: string): string {
  return `dancebase:team-building:${groupId}`;
}

function loadEvents(groupId: string): TeamBuildingEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    return raw ? (JSON.parse(raw) as TeamBuildingEvent[]) : [];
  } catch {
    return [];
  }
}

function saveEvents(groupId: string, events: TeamBuildingEvent[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(groupId), JSON.stringify(events));
}

// ============================================================
// 훅
// ============================================================

export function useTeamBuilding(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.teamBuilding(groupId),
    async () => loadEvents(groupId)
  );

  const events = data ?? [];

  // ── 이벤트 추가 ──
  async function addEvent(
    input: Omit<TeamBuildingEvent, "id" | "createdAt" | "participants" | "isCompleted">
  ): Promise<void> {
    const newEvent: TeamBuildingEvent = {
      ...input,
      id: crypto.randomUUID(),
      participants: [],
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [...events, newEvent];
    saveEvents(groupId, updated);
    await mutate(updated, false);
  }

  // ── 이벤트 수정 ──
  async function updateEvent(
    eventId: string,
    changes: Partial<
      Omit<TeamBuildingEvent, "id" | "createdAt" | "participants">
    >
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

  // ── 참가 ──
  async function joinEvent(
    eventId: string,
    memberName: string
  ): Promise<boolean> {
    const event = events.find((e) => e.id === eventId);
    if (!event) return false;

    // 이미 참가 중인 경우
    if (event.participants.some((p) => p.memberName === memberName)) {
      return false;
    }

    // 최대 인원 초과 시
    if (
      event.maxParticipants !== undefined &&
      event.participants.length >= event.maxParticipants
    ) {
      return false;
    }

    const newParticipant: TeamBuildingParticipant = { memberName };
    const updated = events.map((e) =>
      e.id === eventId
        ? { ...e, participants: [...e.participants, newParticipant] }
        : e
    );
    saveEvents(groupId, updated);
    await mutate(updated, false);
    return true;
  }

  // ── 참가 취소 ──
  async function leaveEvent(
    eventId: string,
    memberName: string
  ): Promise<void> {
    const updated = events.map((e) =>
      e.id === eventId
        ? {
            ...e,
            participants: e.participants.filter(
              (p) => p.memberName !== memberName
            ),
          }
        : e
    );
    saveEvents(groupId, updated);
    await mutate(updated, false);
  }

  // ── 피드백 추가 ──
  async function addFeedback(
    eventId: string,
    memberName: string,
    rating: number,
    feedback?: string
  ): Promise<boolean> {
    const event = events.find((e) => e.id === eventId);
    if (!event) return false;

    const participant = event.participants.find(
      (p) => p.memberName === memberName
    );
    if (!participant) return false;

    const updatedParticipants = event.participants.map((p) =>
      p.memberName === memberName
        ? { ...p, rating: Math.min(5, Math.max(1, rating)), feedback }
        : p
    );
    const updated = events.map((e) =>
      e.id === eventId ? { ...e, participants: updatedParticipants } : e
    );
    saveEvents(groupId, updated);
    await mutate(updated, false);
    return true;
  }

  // ── 완료 토글 ──
  async function toggleComplete(eventId: string): Promise<void> {
    const event = events.find((e) => e.id === eventId);
    if (!event) return;
    await updateEvent(eventId, { isCompleted: !event.isCompleted });
  }

  // ── 통계 ──
  const totalEvents = events.length;
  const completedEvents = events.filter((e) => e.isCompleted).length;
  const upcomingEvents = events.filter((e) => !e.isCompleted).length;

  const ratedParticipants = events
    .flatMap((e) => e.participants)
    .filter((p) => p.rating !== undefined);

  const averageRating =
    ratedParticipants.length > 0
      ? ratedParticipants.reduce((sum, p) => sum + (p.rating ?? 0), 0) /
        ratedParticipants.length
      : 0;

  const stats = {
    totalEvents,
    completedEvents,
    upcomingEvents,
    averageRating: Math.round(averageRating * 10) / 10,
  };

  return {
    events,
    loading: isLoading,
    refetch: () => mutate(),
    addEvent,
    updateEvent,
    deleteEvent,
    joinEvent,
    leaveEvent,
    addFeedback,
    toggleComplete,
    stats,
  };
}

export type { TeamBuildingCategory };
