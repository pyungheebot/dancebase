"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { TimetableSlot, TimetableSlotType, TimetableDay } from "@/types";

// ─── 슬롯 타입별 기본 색상 ───────────────────────────────────

export const SLOT_TYPE_COLORS: Record<TimetableSlotType, string> = {
  practice:    "#3B82F6",
  personal:    "#10B981",
  meeting:     "#F59E0B",
  performance: "#8B5CF6",
  rest:        "#6B7280",
  other:       "#EC4899",
};

export const SLOT_TYPE_LABELS: Record<TimetableSlotType, string> = {
  practice:    "단체연습",
  personal:    "개인연습",
  meeting:     "미팅",
  performance: "공연",
  rest:        "휴식",
  other:       "기타",
};

// ─── localStorage 헬퍼 ────────────────────────────────────────

function loadSlots(groupId: string): TimetableSlot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`dancebase:timetable:${groupId}`);
    if (!raw) return [];
    return JSON.parse(raw) as TimetableSlot[];
  } catch {
    return [];
  }
}

function saveSlots(groupId: string, slots: TimetableSlot[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`dancebase:timetable:${groupId}`, JSON.stringify(slots));
}

// ─── 시간 비교 유틸 ──────────────────────────────────────────

/** "HH:MM" 형식을 분 단위 정수로 변환 */
function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** 두 슬롯이 같은 요일에서 시간이 겹치는지 확인 */
export function hasTimeOverlap(
  a: { startTime: string; endTime: string },
  b: { startTime: string; endTime: string }
): boolean {
  const aStart = toMinutes(a.startTime);
  const aEnd   = toMinutes(a.endTime);
  const bStart = toMinutes(b.startTime);
  const bEnd   = toMinutes(b.endTime);
  return aStart < bEnd && bStart < aEnd;
}

// ─── 훅 ─────────────────────────────────────────────────────

export function useWeeklyTimetable(groupId: string) {
  const key = swrKeys.weeklyTimetable(groupId);

  const { data, mutate } = useSWR(key, () => loadSlots(groupId), {
    revalidateOnFocus: false,
  });

  const slots = data ?? [];

  // ── 슬롯 추가 ─────────────────────────────────────────────

  function addSlot(
    input: Omit<TimetableSlot, "id">
  ): { ok: boolean; conflict?: TimetableSlot } {
    try {
      const stored = loadSlots(groupId);

      // 같은 요일 시간 겹침 감지
      const conflicting = stored.find(
        (s) =>
          s.day === input.day &&
          hasTimeOverlap(s, input)
      );
      if (conflicting) {
        return { ok: false, conflict: conflicting };
      }

      const newSlot: TimetableSlot = {
        ...input,
        id: crypto.randomUUID(),
      };
      const updated = [...stored, newSlot];
      saveSlots(groupId, updated);
      mutate(updated, false);
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }

  // ── 슬롯 수정 ─────────────────────────────────────────────

  function updateSlot(
    id: string,
    patch: Partial<Omit<TimetableSlot, "id">>
  ): { ok: boolean; conflict?: TimetableSlot } {
    try {
      const stored = loadSlots(groupId);
      const idx = stored.findIndex((s) => s.id === id);
      if (idx === -1) return { ok: false };

      const merged = { ...stored[idx], ...patch };

      // 같은 요일 시간 겹침 감지 (자기 자신 제외)
      const conflicting = stored.find(
        (s) =>
          s.id !== id &&
          s.day === merged.day &&
          hasTimeOverlap(s, merged)
      );
      if (conflicting) {
        return { ok: false, conflict: conflicting };
      }

      stored[idx] = merged;
      saveSlots(groupId, stored);
      mutate(stored, false);
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }

  // ── 슬롯 삭제 ─────────────────────────────────────────────

  function deleteSlot(id: string): boolean {
    try {
      const stored = loadSlots(groupId);
      const updated = stored.filter((s) => s.id !== id);
      saveSlots(groupId, updated);
      mutate(updated, false);
      return true;
    } catch {
      return false;
    }
  }

  // ── 요일별 조회 ────────────────────────────────────────────

  function getSlotsByDay(day: TimetableDay): TimetableSlot[] {
    return slots
      .filter((s) => s.day === day)
      .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
  }

  // ── 충돌 검사 (추가 전 미리 확인) ──────────────────────────

  function checkConflict(
    day: TimetableDay,
    startTime: string,
    endTime: string,
    excludeId?: string
  ): TimetableSlot | null {
    const candidate = { startTime, endTime };
    return (
      slots.find(
        (s) =>
          s.id !== excludeId &&
          s.day === day &&
          hasTimeOverlap(s, candidate)
      ) ?? null
    );
  }

  return {
    slots,
    addSlot,
    updateSlot,
    deleteSlot,
    getSlotsByDay,
    checkConflict,
    refetch: () => mutate(),
  };
}
