"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type {
  MeetingMinute,
  MeetingMinutesEntry,
  MeetingMinutesType,
  MeetingAgendaItem,
} from "@/types";

// ============================================
// Supabase 기반 훅 (프로젝트 회의록용)
// ============================================

export function useMeetingMinutes(
  groupId: string,
  projectId?: string | null
) {
  const fetcher = async (): Promise<MeetingMinute[]> => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
      .from("meeting_minutes")
      .select("*")
      .eq("group_id", groupId)
      .order("meeting_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (projectId) {
      query = query.eq("project_id", projectId);
    } else {
      query = query.is("project_id", null);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as MeetingMinute[];
  };

  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.meetingMinutes(groupId, projectId) : null,
    fetcher
  );

  return {
    minutes: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
  };
}

// ============================================
// localStorage 유틸
// ============================================

function storageKey(groupId: string): string {
  return `dancebase:meeting-minutes:${groupId}`;
}

function loadEntries(groupId: string): MeetingMinutesEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as MeetingMinutesEntry[];
  } catch {
    return [];
  }
}

function saveEntries(groupId: string, entries: MeetingMinutesEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId), JSON.stringify(entries));
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

// ============================================
// 훅
// ============================================

export function useMeetingMinutesMemo(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.meetingMinutesMemo(groupId),
    () => loadEntries(groupId),
    { fallbackData: [] }
  );

  const entries = data ?? [];

  // 회의록 추가
  const addMinutes = useCallback(
    (params: {
      title: string;
      type: MeetingMinutesType;
      date: string;
      startTime: string;
      endTime: string;
      location?: string;
      attendees: string[];
      absentees: string[];
      recorder: string;
      agendaItems: MeetingAgendaItem[];
      generalNotes?: string;
      nextMeetingDate?: string;
    }): boolean => {
      const current = loadEntries(groupId);
      const newEntry: MeetingMinutesEntry = {
        id: crypto.randomUUID(),
        title: params.title,
        type: params.type,
        date: params.date,
        startTime: params.startTime,
        endTime: params.endTime,
        location: params.location,
        attendees: params.attendees,
        absentees: params.absentees,
        recorder: params.recorder,
        agendaItems: params.agendaItems,
        generalNotes: params.generalNotes,
        nextMeetingDate: params.nextMeetingDate,
        createdAt: new Date().toISOString(),
      };
      const updated = [newEntry, ...current];
      saveEntries(groupId, updated);
      mutate(updated, false);
      return true;
    },
    [groupId, mutate]
  );

  // 회의록 수정
  const updateMinutes = useCallback(
    (
      id: string,
      patch: Partial<Omit<MeetingMinutesEntry, "id" | "createdAt">>
    ): void => {
      const current = loadEntries(groupId);
      const updated = current.map((e) =>
        e.id === id ? { ...e, ...patch } : e
      );
      saveEntries(groupId, updated);
      mutate(updated, false);
    },
    [groupId, mutate]
  );

  // 회의록 삭제
  const deleteMinutes = useCallback(
    (id: string): void => {
      const current = loadEntries(groupId);
      const updated = current.filter((e) => e.id !== id);
      saveEntries(groupId, updated);
      mutate(updated, false);
    },
    [groupId, mutate]
  );

  // 유형별 필터
  const getByType = useCallback(
    (type: MeetingMinutesType): MeetingMinutesEntry[] => {
      return entries.filter((e) => e.type === type);
    },
    [entries]
  );

  // 통계
  const totalMeetings = entries.length;

  const totalActionItems = entries.reduce(
    (sum, e) =>
      sum + e.agendaItems.reduce((s, a) => s + a.actionItems.length, 0),
    0
  );

  const today = new Date().toISOString().slice(0, 10);
  const pendingActionItems = entries.reduce((sum, e) => {
    return (
      sum +
      e.agendaItems.reduce((s, a) => {
        return (
          s +
          a.actionItems.filter(
            (item) => !item.deadline || item.deadline >= today
          ).length
        );
      }, 0)
    );
  }, 0);

  const recentMeeting =
    entries.length > 0
      ? entries.slice().sort((a, b) => b.date.localeCompare(a.date))[0]
      : null;

  return {
    entries,
    loading: isLoading,
    refetch: () => mutate(),
    addMinutes,
    updateMinutes,
    deleteMinutes,
    getByType,
    totalMeetings,
    totalActionItems,
    pendingActionItems,
    recentMeeting,
  };
}
