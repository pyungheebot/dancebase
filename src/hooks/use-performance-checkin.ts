"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  CheckinMember,
  CheckinStatus,
  PerformanceCheckinEvent,
} from "@/types";

// ============================================
// 상수
// ============================================

const LS_KEY = (groupId: string, projectId: string) =>
  `dancebase:checkin:${groupId}:${projectId}`;

// ============================================
// 상태 순서 정의
// ============================================

const STATUS_ORDER: CheckinStatus[] = [
  "pending",
  "arrived",
  "costume_ready",
  "stage_ready",
];

/** 다음 상태를 반환 (stage_ready 이후에는 그대로 유지) */
function nextStatus(current: CheckinStatus): CheckinStatus {
  const idx = STATUS_ORDER.indexOf(current);
  if (idx === -1 || idx === STATUS_ORDER.length - 1) return current;
  return STATUS_ORDER[idx + 1];
}

// ============================================
// localStorage 헬퍼
// ============================================

function loadEvents(groupId: string, projectId: string): PerformanceCheckinEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY(groupId, projectId));
    return raw ? (JSON.parse(raw) as PerformanceCheckinEvent[]) : [];
  } catch {
    return [];
  }
}

function saveEvents(
  groupId: string,
  projectId: string,
  events: PerformanceCheckinEvent[]
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY(groupId, projectId), JSON.stringify(events));
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

// ============================================
// 훅
// ============================================

export function usePerformanceCheckin(groupId: string, projectId: string) {
  const swrKey =
    groupId && projectId
      ? swrKeys.performanceCheckin(groupId, projectId)
      : null;

  const { data, mutate } = useSWR(
    swrKey,
    () => loadEvents(groupId, projectId),
    { revalidateOnFocus: false }
  );

  const events: PerformanceCheckinEvent[] = data ?? [];

  // ── 내부 업데이트 헬퍼 ───────────────────────────────────

  function update(next: PerformanceCheckinEvent[]): void {
    saveEvents(groupId, projectId, next);
    mutate(next, false);
  }

  // ── 이벤트 생성 ─────────────────────────────────────────

  function createEvent(
    eventName: string,
    eventDate: string,
    callTime: string
  ): boolean {
    if (!eventName.trim() || !eventDate || !callTime) return false;
    const stored = loadEvents(groupId, projectId);

    const newEvent: PerformanceCheckinEvent = {
      id: `checkin-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      eventName: eventName.trim(),
      eventDate,
      callTime,
      members: [],
      createdAt: new Date().toISOString(),
    };

    update([...stored, newEvent]);
    return true;
  }

  // ── 이벤트 삭제 ─────────────────────────────────────────

  function deleteEvent(eventId: string): void {
    const stored = loadEvents(groupId, projectId);
    update(stored.filter((e) => e.id !== eventId));
  }

  // ── 멤버 추가 ──────────────────────────────────────────

  function addMember(eventId: string, memberName: string): boolean {
    if (!memberName.trim()) return false;
    const stored = loadEvents(groupId, projectId);
    const idx = stored.findIndex((e) => e.id === eventId);
    if (idx === -1) return false;

    // 동명이인 허용: 이름 중복 체크 없음
    const newMember: CheckinMember = {
      id: `member-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      memberName: memberName.trim(),
      status: "pending",
      costumeNote: "",
      isReady: false,
    };

    const next = stored.map((e, i) =>
      i === idx ? { ...e, members: [...e.members, newMember] } : e
    );
    update(next);
    return true;
  }

  // ── 멤버 상태 순차 변경 ─────────────────────────────────
  // pending → arrived → costume_ready → stage_ready

  function updateStatus(eventId: string, memberId: string): void {
    const stored = loadEvents(groupId, projectId);
    const eIdx = stored.findIndex((e) => e.id === eventId);
    if (eIdx === -1) return;

    const event = stored[eIdx];
    const mIdx = event.members.findIndex((m) => m.id === memberId);
    if (mIdx === -1) return;

    const member = event.members[mIdx];
    const newStatus = nextStatus(member.status);

    // arrived 상태로 변경될 때 도착 시간 기록
    const arrivedAt =
      newStatus === "arrived" && member.status === "pending"
        ? new Date().toISOString()
        : member.arrivedAt;

    const updatedMember: CheckinMember = {
      ...member,
      status: newStatus,
      arrivedAt,
    };

    const next = stored.map((e, ei) =>
      ei === eIdx
        ? {
            ...e,
            members: e.members.map((m, mi) =>
              mi === mIdx ? updatedMember : m
            ),
          }
        : e
    );
    update(next);
  }

  // ── 준비 완료 토글 ──────────────────────────────────────

  function toggleReady(eventId: string, memberId: string): void {
    const stored = loadEvents(groupId, projectId);
    const eIdx = stored.findIndex((e) => e.id === eventId);
    if (eIdx === -1) return;

    const event = stored[eIdx];
    const mIdx = event.members.findIndex((m) => m.id === memberId);
    if (mIdx === -1) return;

    const next = stored.map((e, ei) =>
      ei === eIdx
        ? {
            ...e,
            members: e.members.map((m, mi) =>
              mi === mIdx ? { ...m, isReady: !m.isReady } : m
            ),
          }
        : e
    );
    update(next);
  }

  // ── 통계 헬퍼 ──────────────────────────────────────────

  function getStats(event: PerformanceCheckinEvent) {
    const total = event.members.length;
    const arrivedCount = event.members.filter(
      (m) => m.status !== "pending"
    ).length;
    const readyCount = event.members.filter((m) => m.isReady).length;
    const pendingCount = event.members.filter(
      (m) => m.status === "pending"
    ).length;
    const stageReadyCount = event.members.filter(
      (m) => m.status === "stage_ready"
    ).length;
    const readyRate =
      total === 0 ? 0 : Math.round((stageReadyCount / total) * 100);

    return {
      total,
      arrivedCount,
      readyCount,
      pendingCount,
      stageReadyCount,
      readyRate,
    };
  }

  return {
    events,
    // CRUD
    createEvent,
    deleteEvent,
    addMember,
    updateStatus,
    toggleReady,
    // 통계
    getStats,
    nextStatus,
    STATUS_ORDER,
    // SWR
    loading: data === undefined,
    refetch: () => mutate(),
  };
}
