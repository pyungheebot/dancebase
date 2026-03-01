"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { toast } from "sonner";
import type { EventRsvpItem, EventRsvpMember, EventRsvpResponse } from "@/types";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";

// ─── localStorage 헬퍼 ────────────────────────────────────────

const LS_KEY = (groupId: string) => `dancebase:event-rsvp:${groupId}`;

// ─── 훅 ─────────────────────────────────────────────────────

export function useEventRsvp(groupId: string) {
  const { data, mutate } = useSWR(
    groupId ? swrKeys.eventRsvp(groupId) : null,
    () => loadFromStorage<EventRsvpItem[]>(LS_KEY(groupId), []),
    { revalidateOnFocus: false }
  );

  const events = data ?? [];

  // ── 이벤트 추가 ────────────────────────────────────────────

  function addEvent(input: {
    title: string;
    date: string;
    time?: string;
    location?: string;
    description?: string;
    deadline?: string;
    createdBy: string;
    memberNames?: string[];
  }): boolean {
    if (!input.title.trim()) {
      toast.error("이벤트 제목을 입력해주세요.");
      return false;
    }
    if (!input.date) {
      toast.error("이벤트 날짜를 입력해주세요.");
      return false;
    }
    try {
      const stored = loadFromStorage<EventRsvpItem[]>(LS_KEY(groupId), []);
      // 멤버 목록이 있으면 pending 응답으로 초기화
      const initialResponses: EventRsvpMember[] = (input.memberNames ?? []).map(
        (name) => ({ memberName: name, response: "pending" as EventRsvpResponse })
      );
      const newEvent: EventRsvpItem = {
        id: crypto.randomUUID(),
        title: input.title.trim(),
        date: input.date,
        time: input.time?.trim() || undefined,
        location: input.location?.trim() || undefined,
        description: input.description?.trim() || undefined,
        deadline: input.deadline || undefined,
        responses: initialResponses,
        createdBy: input.createdBy,
        createdAt: new Date().toISOString(),
      };
      const next = [...stored, newEvent];
      saveToStorage(LS_KEY(groupId), next);
      mutate(next, false);
      toast.success("이벤트가 추가되었습니다.");
      return true;
    } catch {
      toast.error("이벤트 추가에 실패했습니다.");
      return false;
    }
  }

  // ── 이벤트 수정 ────────────────────────────────────────────

  function updateEvent(
    eventId: string,
    patch: Partial<Omit<EventRsvpItem, "id" | "createdAt" | "createdBy" | "responses">>
  ): boolean {
    try {
      const stored = loadFromStorage<EventRsvpItem[]>(LS_KEY(groupId), []);
      const idx = stored.findIndex((e) => e.id === eventId);
      if (idx === -1) {
        toast.error("이벤트를 찾을 수 없습니다.");
        return false;
      }
      const updated = { ...stored[idx], ...patch };
      const next = [
        ...stored.slice(0, idx),
        updated,
        ...stored.slice(idx + 1),
      ];
      saveToStorage(LS_KEY(groupId), next);
      mutate(next, false);
      toast.success("이벤트가 수정되었습니다.");
      return true;
    } catch {
      toast.error("이벤트 수정에 실패했습니다.");
      return false;
    }
  }

  // ── 이벤트 삭제 ────────────────────────────────────────────

  function deleteEvent(eventId: string): boolean {
    try {
      const stored = loadFromStorage<EventRsvpItem[]>(LS_KEY(groupId), []);
      const next = stored.filter((e) => e.id !== eventId);
      if (next.length === stored.length) return false;
      saveToStorage(LS_KEY(groupId), next);
      mutate(next, false);
      toast.success("이벤트가 삭제되었습니다.");
      return true;
    } catch {
      toast.error("이벤트 삭제에 실패했습니다.");
      return false;
    }
  }

  // ── 응답 등록/수정 ─────────────────────────────────────────

  function respond(
    eventId: string,
    memberName: string,
    response: EventRsvpResponse,
    note?: string
  ): boolean {
    if (!memberName.trim()) {
      toast.error("이름을 입력해주세요.");
      return false;
    }
    try {
      const stored = loadFromStorage<EventRsvpItem[]>(LS_KEY(groupId), []);
      const event = stored.find((e) => e.id === eventId);
      if (!event) {
        toast.error("이벤트를 찾을 수 없습니다.");
        return false;
      }
      const existingIdx = event.responses.findIndex(
        (r) => r.memberName.toLowerCase() === memberName.trim().toLowerCase()
      );
      const newEntry: EventRsvpMember = {
        memberName: memberName.trim(),
        response,
        respondedAt: new Date().toISOString(),
        note: note?.trim() || undefined,
      };
      let updatedResponses: EventRsvpMember[];
      if (existingIdx !== -1) {
        updatedResponses = event.responses.map((r, i) =>
          i === existingIdx ? newEntry : r
        );
      } else {
        updatedResponses = [...event.responses, newEntry];
      }
      const next = stored.map((e) =>
        e.id === eventId ? { ...e, responses: updatedResponses } : e
      );
      saveToStorage(LS_KEY(groupId), next);
      mutate(next, false);
      const LABELS: Record<EventRsvpResponse, string> = {
        attending: "참석",
        maybe: "미정",
        not_attending: "불참",
        pending: "미응답",
      };
      toast.success(`${memberName.trim()}님이 '${LABELS[response]}'으로 응답했습니다.`);
      return true;
    } catch {
      toast.error("응답 등록에 실패했습니다.");
      return false;
    }
  }

  // ── 이벤트 통계 ────────────────────────────────────────────

  function getEventStats(eventId: string) {
    const event = events.find((e) => e.id === eventId);
    if (!event) return { attending: 0, maybe: 0, not_attending: 0, pending: 0 };
    const counts = { attending: 0, maybe: 0, not_attending: 0, pending: 0 };
    for (const r of event.responses) {
      counts[r.response] = (counts[r.response] ?? 0) + 1;
    }
    return counts;
  }

  // ── 전체 통계 ──────────────────────────────────────────────

  const today = new Date().toISOString().slice(0, 10);
  const totalEvents = events.length;
  const upcomingEvents = events.filter((e) => e.date >= today).length;

  // 응답률: pending이 아닌 응답 / 전체 응답 목록
  const allResponses = events.flatMap((e) => e.responses);
  const responded = allResponses.filter((r) => r.response !== "pending").length;
  const responseRate =
    allResponses.length > 0
      ? Math.round((responded / allResponses.length) * 100)
      : 0;

  const stats = { totalEvents, upcomingEvents, responseRate };

  return {
    events,
    // CRUD
    addEvent,
    updateEvent,
    deleteEvent,
    // 응답
    respond,
    // 통계
    getEventStats,
    stats,
    // SWR
    refetch: () => mutate(),
  };
}
