"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { invalidateMemberAvailability } from "@/lib/swr/invalidate";
import type { DayOfWeek, AvailabilitySlot, MemberAvailability } from "@/types";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";

const MAX_SLOTS = 21; // 하루 3개 x 7일

function getStorageKey(groupId: string, userId: string): string {
  return `dancebase:availability:${groupId}:${userId}`;
}

/**
 * 두 시간 슬롯이 겹치는지 확인
 * 같은 요일에서만 체크
 */
function isOverlapping(
  existingSlots: AvailabilitySlot[],
  newSlot: AvailabilitySlot
): boolean {
  const sameDay = existingSlots.filter((s) => s.day === newSlot.day);
  for (const s of sameDay) {
    const existStart = s.startTime;
    const existEnd = s.endTime;
    const newStart = newSlot.startTime;
    const newEnd = newSlot.endTime;
    // 겹침: 새 슬롯 시작이 기존 끝보다 앞이고, 새 슬롯 끝이 기존 시작보다 뒤
    if (newStart < existEnd && newEnd > existStart) {
      return true;
    }
  }
  return false;
}

export function useMemberAvailability(groupId: string, userId: string) {
  const { data, mutate } = useSWR(
    groupId && userId ? swrKeys.memberAvailability(groupId, userId) : null,
    () => loadFromStorage<MemberAvailability>(getStorageKey(groupId, userId), {} as MemberAvailability)
  );

  const availability: MemberAvailability = data ?? {
    userId,
    slots: [],
    updatedAt: new Date().toISOString(),
  };

  /**
   * 슬롯 추가
   * - 최대 21개 제한
   * - 같은 요일 시간 겹침 방지
   * @returns "ok" | "max_exceeded" | "overlap"
   */
  function addSlot(slot: AvailabilitySlot): "ok" | "max_exceeded" | "overlap" {
    if (availability.slots.length >= MAX_SLOTS) {
      return "max_exceeded";
    }
    if (isOverlapping(availability.slots, slot)) {
      return "overlap";
    }
    const updated: MemberAvailability = {
      userId,
      slots: [...availability.slots, slot],
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(getStorageKey(groupId, userId), updated);
    mutate(updated, false);
    invalidateMemberAvailability(groupId, userId);
    return "ok";
  }

  /**
   * 슬롯 제거 (day + startTime + endTime 일치 기준)
   */
  function removeSlot(slot: AvailabilitySlot): void {
    const updated: MemberAvailability = {
      userId,
      slots: availability.slots.filter(
        (s) =>
          !(
            s.day === slot.day &&
            s.startTime === slot.startTime &&
            s.endTime === slot.endTime
          )
      ),
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(getStorageKey(groupId, userId), updated);
    mutate(updated, false);
    invalidateMemberAvailability(groupId, userId);
  }

  /**
   * 특정 요일의 슬롯 목록 반환 (시작 시간 오름차순)
   */
  function getSlotsByDay(day: DayOfWeek): AvailabilitySlot[] {
    return availability.slots
      .filter((s) => s.day === day)
      .sort((a, b) => (a.startTime < b.startTime ? -1 : 1));
  }

  /**
   * 모든 슬롯 초기화
   */
  function clearAll(): void {
    const updated: MemberAvailability = {
      userId,
      slots: [],
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(getStorageKey(groupId, userId), updated);
    mutate(updated, false);
    invalidateMemberAvailability(groupId, userId);
  }

  return {
    availability,
    slots: availability.slots,
    loading: !data,
    addSlot,
    removeSlot,
    getSlotsByDay,
    clearAll,
    refetch: () => mutate(),
  };
}
