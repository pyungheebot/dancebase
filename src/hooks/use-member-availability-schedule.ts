"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  MemberAvailabilityData,
  MemberAvailabilityEntry,
  MemberAvailabilityDay,
  MemberAvailabilitySlot,
  MemberAvailabilityLevel,
  MemberAvailabilityOverlap,
} from "@/types";

// ============================================
// 상수
// ============================================

/** 시간 슬롯 목록 (06:00 ~ 23:00, 1시간 단위) */
export const AVAILABILITY_TIME_SLOTS: string[] = Array.from(
  { length: 18 },
  (_, i) => {
    const hour = i + 6;
    return `${String(hour).padStart(2, "0")}:00`;
  }
);

export const AVAILABILITY_DAY_LABELS: Record<MemberAvailabilityDay, string> = {
  mon: "월",
  tue: "화",
  wed: "수",
  thu: "목",
  fri: "금",
  sat: "토",
  sun: "일",
};

export const AVAILABILITY_DAY_ORDER: MemberAvailabilityDay[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

export const AVAILABILITY_LEVEL_LABELS: Record<MemberAvailabilityLevel, string> =
  {
    available: "가능",
    difficult: "어려움",
    unavailable: "불가",
  };

// ============================================
// localStorage 유틸
// ============================================

function storageKey(groupId: string): string {
  return `dancebase:member-availability:${groupId}`;
}

function loadData(groupId: string): MemberAvailabilityData {
  if (typeof window === "undefined") {
    return { groupId, entries: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) {
      return { groupId, entries: [], updatedAt: new Date().toISOString() };
    }
    return JSON.parse(raw) as MemberAvailabilityData;
  } catch {
    return { groupId, entries: [], updatedAt: new Date().toISOString() };
  }
}

function saveData(data: MemberAvailabilityData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(data.groupId), JSON.stringify(data));
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

function defaultData(groupId: string): MemberAvailabilityData {
  return { groupId, entries: [], updatedAt: new Date().toISOString() };
}

// ============================================
// 겹치는 시간대 계산 유틸
// ============================================

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * 멤버들의 요일별 슬롯에서 겹치는 가능/어려움 시간대를 계산한다.
 * 2명 이상이 동시에 available 또는 difficult인 구간을 반환.
 */
function calcOverlaps(
  entries: MemberAvailabilityEntry[]
): MemberAvailabilityOverlap[] {
  const overlaps: MemberAvailabilityOverlap[] = [];

  for (const day of AVAILABILITY_DAY_ORDER) {
    // 요일별로 각 멤버의 슬롯을 수집
    type FlatSlot = {
      memberName: string;
      level: MemberAvailabilityLevel;
      startMin: number;
      endMin: number;
    };
    const memberSlots: FlatSlot[] = [];

    for (const entry of entries) {
      const daySlots = entry.slots[day] ?? [];
      for (const slot of daySlots) {
        if (slot.level === "unavailable") continue;
        memberSlots.push({
          memberName: entry.memberName,
          level: slot.level,
          startMin: timeToMinutes(slot.startTime),
          endMin: timeToMinutes(slot.endTime),
        });
      }
    }

    if (memberSlots.length === 0) continue;

    // 전체 시간 범위에서 30분 단위로 스캔
    const minStart = Math.min(...memberSlots.map((s) => s.startMin));
    const maxEnd = Math.max(...memberSlots.map((s) => s.endMin));

    const step = 30;
    let segStart: number | null = null;
    let segAvailable: string[] = [];
    let segDifficult: string[] = [];

    const flushSegment = (segEnd: number) => {
      if (segStart === null) return;
      if (segAvailable.length >= 2 || segDifficult.length >= 2) {
        overlaps.push({
          day,
          startTime: minutesToTime(segStart),
          endTime: minutesToTime(segEnd),
          availableMembers: [...segAvailable],
          difficultMembers: [...segDifficult],
        });
      }
    };

    for (let t = minStart; t < maxEnd; t += step) {
      const available: string[] = [];
      const difficult: string[] = [];

      for (const s of memberSlots) {
        if (s.startMin <= t && t < s.endMin) {
          if (s.level === "available") available.push(s.memberName);
          else if (s.level === "difficult") difficult.push(s.memberName);
        }
      }

      const curKey =
        [...available].sort().join(",") +
        "|" +
        [...difficult].sort().join(",");
      const prevKey =
        [...segAvailable].sort().join(",") +
        "|" +
        [...segDifficult].sort().join(",");

      if (
        (available.length >= 1 || difficult.length >= 1) &&
        curKey === prevKey &&
        segStart !== null
      ) {
        // 같은 구성 유지 - 계속 진행
      } else {
        // 구간 저장 후 새 구간 시작
        if (segStart !== null) flushSegment(t);
        if (available.length >= 1 || difficult.length >= 1) {
          segStart = t;
          segAvailable = available;
          segDifficult = difficult;
        } else {
          segStart = null;
          segAvailable = [];
          segDifficult = [];
        }
      }
    }
    if (segStart !== null) flushSegment(maxEnd);
  }

  return overlaps;
}

// ============================================
// 훅
// ============================================

export function useMemberAvailabilitySchedule(groupId: string) {
  const fallback = defaultData(groupId);

  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.memberAvailabilitySchedule(groupId) : null,
    () => loadData(groupId),
    { fallbackData: fallback, revalidateOnFocus: false }
  );

  const current: MemberAvailabilityData = data ?? fallback;

  // ── 저장 헬퍼 ────────────────────────────────────────────

  const persist = useCallback(
    (next: MemberAvailabilityData) => {
      const withTs: MemberAvailabilityData = {
        ...next,
        updatedAt: new Date().toISOString(),
      };
      saveData(withTs);
      mutate(withTs, false);
    },
    [mutate]
  );

  // ── 멤버 추가 ────────────────────────────────────────────

  const addMember = useCallback(
    (memberName: string): boolean => {
      const name = memberName.trim();
      if (!name) return false;
      if (current.entries.some((e) => e.memberName === name)) return false;
      const now = new Date().toISOString();
      const newEntry: MemberAvailabilityEntry = {
        id: crypto.randomUUID(),
        memberName: name,
        slots: {},
        notes: undefined,
        createdAt: now,
        updatedAt: now,
      };
      persist({ ...current, entries: [...current.entries, newEntry] });
      return true;
    },
    [current, persist]
  );

  // ── 멤버 삭제 ────────────────────────────────────────────

  const removeMember = useCallback(
    (memberId: string): void => {
      persist({
        ...current,
        entries: current.entries.filter((e) => e.id !== memberId),
      });
    },
    [current, persist]
  );

  // ── 멤버 이름 수정 ────────────────────────────────────────

  const renameMember = useCallback(
    (memberId: string, newName: string): boolean => {
      const name = newName.trim();
      if (!name) return false;
      if (
        current.entries.some((e) => e.memberName === name && e.id !== memberId)
      )
        return false;
      persist({
        ...current,
        entries: current.entries.map((e) =>
          e.id === memberId
            ? { ...e, memberName: name, updatedAt: new Date().toISOString() }
            : e
        ),
      });
      return true;
    },
    [current, persist]
  );

  // ── 슬롯 추가/업데이트 ───────────────────────────────────

  const upsertSlot = useCallback(
    (
      memberId: string,
      day: MemberAvailabilityDay,
      slot: MemberAvailabilitySlot
    ): void => {
      persist({
        ...current,
        entries: current.entries.map((e) => {
          if (e.id !== memberId) return e;
          const existing = e.slots[day] ?? [];
          const hasExisting = existing.some(
            (s) => s.startTime === slot.startTime
          );
          const updated = hasExisting
            ? existing.map((s) => (s.startTime === slot.startTime ? slot : s))
            : [...existing, slot].sort((a, b) =>
                a.startTime.localeCompare(b.startTime)
              );
          return {
            ...e,
            slots: { ...e.slots, [day]: updated },
            updatedAt: new Date().toISOString(),
          };
        }),
      });
    },
    [current, persist]
  );

  // ── 슬롯 삭제 ────────────────────────────────────────────

  const removeSlot = useCallback(
    (
      memberId: string,
      day: MemberAvailabilityDay,
      startTime: string
    ): void => {
      persist({
        ...current,
        entries: current.entries.map((e) => {
          if (e.id !== memberId) return e;
          const updated = (e.slots[day] ?? []).filter(
            (s) => s.startTime !== startTime
          );
          const newSlots = { ...e.slots };
          if (updated.length === 0) {
            delete newSlots[day];
          } else {
            newSlots[day] = updated;
          }
          return {
            ...e,
            slots: newSlots,
            updatedAt: new Date().toISOString(),
          };
        }),
      });
    },
    [current, persist]
  );

  // ── 요일 전체 슬롯 초기화 ─────────────────────────────────

  const clearDaySlots = useCallback(
    (memberId: string, day: MemberAvailabilityDay): void => {
      persist({
        ...current,
        entries: current.entries.map((e) => {
          if (e.id !== memberId) return e;
          const newSlots = { ...e.slots };
          delete newSlots[day];
          return {
            ...e,
            slots: newSlots,
            updatedAt: new Date().toISOString(),
          };
        }),
      });
    },
    [current, persist]
  );

  // ── 메모 업데이트 ─────────────────────────────────────────

  const updateNotes = useCallback(
    (memberId: string, notes: string): void => {
      persist({
        ...current,
        entries: current.entries.map((e) =>
          e.id === memberId
            ? {
                ...e,
                notes: notes || undefined,
                updatedAt: new Date().toISOString(),
              }
            : e
        ),
      });
    },
    [current, persist]
  );

  // ── 겹치는 시간대 계산 ───────────────────────────────────

  const overlaps = calcOverlaps(current.entries);

  const getOverlapsByDay = useCallback(
    (day: MemberAvailabilityDay): MemberAvailabilityOverlap[] =>
      overlaps.filter((o) => o.day === day),
    [overlaps]
  );

  // ── 특정 멤버 엔트리 조회 ─────────────────────────────────

  const getMemberEntry = useCallback(
    (memberId: string): MemberAvailabilityEntry | undefined =>
      current.entries.find((e) => e.id === memberId),
    [current.entries]
  );

  return {
    data: current,
    loading: isLoading,
    refetch: () => mutate(),
    // 멤버 관리
    addMember,
    removeMember,
    renameMember,
    // 슬롯 관리
    upsertSlot,
    removeSlot,
    clearDaySlots,
    // 메모
    updateNotes,
    // 조회
    getMemberEntry,
    overlaps,
    getOverlapsByDay,
  };
}
