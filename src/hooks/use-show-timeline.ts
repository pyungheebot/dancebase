"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { toast } from "sonner";
import { swrKeys } from "@/lib/swr/keys";
import type {
  ShowTimelineEvent,
  ShowTimelineEventType,
  ShowTimelineStatus,
} from "@/types";

// ============================================================
// localStorage 유틸
// ============================================================

function getStorageKey(groupId: string, projectId: string): string {
  return `dancebase:show-timeline:${groupId}:${projectId}`;
}

function loadEvents(groupId: string, projectId: string): ShowTimelineEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId, projectId));
    return raw ? (JSON.parse(raw) as ShowTimelineEvent[]) : [];
  } catch {
    return [];
  }
}

function saveEvents(
  groupId: string,
  projectId: string,
  events: ShowTimelineEvent[]
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      getStorageKey(groupId, projectId),
      JSON.stringify(events)
    );
  } catch {
    // localStorage 쓰기 실패 무시
  }
}

/** 시간 문자열(HH:MM)을 분 단위 숫자로 변환 */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

// ============================================================
// 입력 타입
// ============================================================

export type AddShowTimelineEventInput = {
  title: string;
  eventType: ShowTimelineEventType;
  startTime: string;
  endTime?: string;
  assignedTo?: string;
  location?: string;
  status: ShowTimelineStatus;
  notes?: string;
};

export type UpdateShowTimelineEventInput = Partial<AddShowTimelineEventInput>;

// ============================================================
// 훅
// ============================================================

export function useShowTimeline(groupId: string, projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId && projectId ? swrKeys.showTimeline(groupId, projectId) : null,
    async () => loadEvents(groupId, projectId)
  );

  // 시간순 정렬된 이벤트 목록
  const events: ShowTimelineEvent[] = (data ?? []).slice().sort((a, b) => {
    const diff = timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    if (diff !== 0) return diff;
    return a.createdAt < b.createdAt ? -1 : 1;
  });

  // ── 이벤트 추가 ──
  const addEvent = useCallback(
    async (input: AddShowTimelineEventInput): Promise<boolean> => {
      if (!input.title.trim()) {
        toast.error("이벤트 제목을 입력해주세요");
        return false;
      }
      if (!input.startTime) {
        toast.error("시작 시간을 입력해주세요");
        return false;
      }
      if (
        input.endTime &&
        timeToMinutes(input.endTime) < timeToMinutes(input.startTime)
      ) {
        toast.error("종료 시간은 시작 시간 이후여야 합니다");
        return false;
      }

      const now = new Date().toISOString();
      const newEvent: ShowTimelineEvent = {
        id: crypto.randomUUID(),
        groupId,
        projectId,
        title: input.title.trim(),
        eventType: input.eventType,
        startTime: input.startTime,
        endTime: input.endTime || undefined,
        assignedTo: input.assignedTo?.trim() || undefined,
        location: input.location?.trim() || undefined,
        status: input.status,
        notes: input.notes?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };

      const current = loadEvents(groupId, projectId);
      const updated = [...current, newEvent];
      saveEvents(groupId, projectId, updated);
      await mutate(updated, false);
      toast.success("이벤트가 추가되었습니다");
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 이벤트 수정 ──
  const updateEvent = useCallback(
    async (
      id: string,
      changes: UpdateShowTimelineEventInput
    ): Promise<boolean> => {
      const current = loadEvents(groupId, projectId);
      const target = current.find((e) => e.id === id);
      if (!target) {
        toast.error("이벤트를 찾을 수 없습니다");
        return false;
      }

      const merged = { ...target, ...changes };
      if (
        merged.endTime &&
        timeToMinutes(merged.endTime) < timeToMinutes(merged.startTime)
      ) {
        toast.error("종료 시간은 시작 시간 이후여야 합니다");
        return false;
      }

      const updated = current.map((e) =>
        e.id === id
          ? {
              ...e,
              ...changes,
              title:
                changes.title !== undefined ? changes.title.trim() : e.title,
              assignedTo:
                changes.assignedTo !== undefined
                  ? changes.assignedTo.trim() || undefined
                  : e.assignedTo,
              location:
                changes.location !== undefined
                  ? changes.location.trim() || undefined
                  : e.location,
              endTime:
                changes.endTime !== undefined
                  ? changes.endTime || undefined
                  : e.endTime,
              notes:
                changes.notes !== undefined
                  ? changes.notes.trim() || undefined
                  : e.notes,
              updatedAt: new Date().toISOString(),
            }
          : e
      );

      saveEvents(groupId, projectId, updated);
      await mutate(updated, false);
      toast.success("이벤트가 수정되었습니다");
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 이벤트 삭제 ──
  const deleteEvent = useCallback(
    async (id: string): Promise<boolean> => {
      const current = loadEvents(groupId, projectId);
      const filtered = current.filter((e) => e.id !== id);
      saveEvents(groupId, projectId, filtered);
      await mutate(filtered, false);
      toast.success("이벤트가 삭제되었습니다");
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 상태 변경 ──
  const changeStatus = useCallback(
    async (id: string, status: ShowTimelineStatus): Promise<boolean> => {
      const current = loadEvents(groupId, projectId);
      const updated = current.map((e) =>
        e.id === id
          ? { ...e, status, updatedAt: new Date().toISOString() }
          : e
      );
      saveEvents(groupId, projectId, updated);
      await mutate(updated, false);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 통계 ──
  const stats = {
    total: events.length,
    byStatus: {
      scheduled: events.filter((e) => e.status === "scheduled").length,
      in_progress: events.filter((e) => e.status === "in_progress").length,
      completed: events.filter((e) => e.status === "completed").length,
      cancelled: events.filter((e) => e.status === "cancelled").length,
    },
    progress:
      events.length > 0
        ? Math.round(
            (events.filter((e) => e.status === "completed").length /
              events.length) *
              100
          )
        : 0,
  };

  return {
    events,
    loading: isLoading,
    refetch: () => mutate(),
    addEvent,
    updateEvent,
    deleteEvent,
    changeStatus,
    stats,
  };
}
