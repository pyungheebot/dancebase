"use client";

import { useState, useCallback } from "react";
import type {
  PersonalScheduleEntry,
  PersonalScheduleType,
  ScheduleConflictResult,
} from "@/types";

// ============================================
// localStorage 유틸
// ============================================

function getStorageKey(groupId: string): string {
  return `dancebase:schedule-conflict:${groupId}`;
}

function loadSchedules(groupId: string): PersonalScheduleEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as PersonalScheduleEntry[];
  } catch {
    return [];
  }
}

function saveSchedules(
  groupId: string,
  schedules: PersonalScheduleEntry[]
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(groupId), JSON.stringify(schedules));
  } catch {
    // 저장 실패 시 무시
  }
}

// ============================================
// 시간 계산 유틸
// ============================================

/** "HH:MM" 문자열을 분 단위 정수로 변환 */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * 두 시간 구간의 겹치는 분수를 반환.
 * [aStart, aEnd] ∩ [bStart, bEnd]
 */
function calcOverlapMinutes(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): number {
  const as = timeToMinutes(aStart);
  const ae = timeToMinutes(aEnd);
  const bs = timeToMinutes(bStart);
  const be = timeToMinutes(bEnd);

  // 종료 시간이 시작 시간보다 같거나 작으면 겹침 없음
  if (as >= ae || bs >= be) return 0;

  const overlapStart = Math.max(as, bs);
  const overlapEnd = Math.min(ae, be);
  return Math.max(0, overlapEnd - overlapStart);
}

/** "YYYY-MM-DD" 날짜 문자열에서 요일(0=일요일)을 반환 */
function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr + "T00:00:00").getDay();
}

// ============================================
// 훅
// ============================================

export function useScheduleConflict(groupId: string) {
  const [schedules, setSchedules] = useState<PersonalScheduleEntry[]>(() =>
    loadSchedules(groupId)
  );

  const persist = useCallback(
    (next: PersonalScheduleEntry[]) => {
      setSchedules(next);
      saveSchedules(groupId, next);
    },
    [groupId]
  );

  // ------------------------------------------
  // 일정 추가
  // ------------------------------------------
  const addSchedule = useCallback(
    (
      memberName: string,
      title: string,
      type: PersonalScheduleType,
      date: string,
      startTime: string,
      endTime: string,
      recurring: boolean,
      recurringDay?: number
    ): PersonalScheduleEntry => {
      const entry: PersonalScheduleEntry = {
        id: crypto.randomUUID(),
        memberName: memberName.trim(),
        title: title.trim(),
        type,
        date,
        startTime,
        endTime,
        recurring,
        recurringDay: recurring ? recurringDay : undefined,
        createdAt: new Date().toISOString(),
      };
      persist([...schedules, entry]);
      return entry;
    },
    [schedules, persist]
  );

  // ------------------------------------------
  // 일정 수정
  // ------------------------------------------
  const updateSchedule = useCallback(
    (
      id: string,
      patch: Partial<Omit<PersonalScheduleEntry, "id" | "createdAt">>
    ): boolean => {
      const idx = schedules.findIndex((s) => s.id === id);
      if (idx === -1) return false;
      const updated = schedules.map((s) =>
        s.id === id ? { ...s, ...patch } : s
      );
      persist(updated);
      return true;
    },
    [schedules, persist]
  );

  // ------------------------------------------
  // 일정 삭제
  // ------------------------------------------
  const deleteSchedule = useCallback(
    (id: string): void => {
      persist(schedules.filter((s) => s.id !== id));
    },
    [schedules, persist]
  );

  // ------------------------------------------
  // 멤버별 일정 조회
  // ------------------------------------------
  const getByMember = useCallback(
    (memberName: string): PersonalScheduleEntry[] => {
      return schedules.filter((s) => s.memberName === memberName);
    },
    [schedules]
  );

  // ------------------------------------------
  // 특정 일시 충돌 멤버 목록 반환
  // ------------------------------------------
  const checkConflicts = useCallback(
    (
      groupDate: string,
      groupStartTime: string,
      groupEndTime: string
    ): ScheduleConflictResult[] => {
      const results: ScheduleConflictResult[] = [];
      const groupDayOfWeek = getDayOfWeek(groupDate);

      for (const schedule of schedules) {
        let isApplicable = false;

        if (schedule.recurring) {
          // 반복 일정: 요일이 맞으면 적용
          if (schedule.recurringDay !== undefined) {
            isApplicable = schedule.recurringDay === groupDayOfWeek;
          }
        } else {
          // 단일 일정: 날짜가 정확히 일치해야 함
          isApplicable = schedule.date === groupDate;
        }

        if (!isApplicable) continue;

        const overlap = calcOverlapMinutes(
          schedule.startTime,
          schedule.endTime,
          groupStartTime,
          groupEndTime
        );

        if (overlap > 0) {
          results.push({
            memberName: schedule.memberName,
            personalSchedule: schedule,
            conflictDate: groupDate,
            overlapMinutes: overlap,
          });
        }
      }

      // 겹치는 시간 내림차순 정렬
      return results.sort((a, b) => b.overlapMinutes - a.overlapMinutes);
    },
    [schedules]
  );

  // ------------------------------------------
  // 날짜의 모든 충돌 (기본 그룹 연습 시간 19:00~22:00 가정)
  // ------------------------------------------
  const getConflictsForDate = useCallback(
    (
      date: string,
      defaultStart = "19:00",
      defaultEnd = "22:00"
    ): ScheduleConflictResult[] => {
      return checkConflicts(date, defaultStart, defaultEnd);
    },
    [checkConflicts]
  );

  // ------------------------------------------
  // 통계
  // ------------------------------------------
  const totalSchedules = schedules.length;
  const membersWithSchedules = new Set(schedules.map((s) => s.memberName)).size;
  const recurringCount = schedules.filter((s) => s.recurring).length;

  return {
    schedules,
    // CRUD
    addSchedule,
    updateSchedule,
    deleteSchedule,
    // 조회
    getByMember,
    checkConflicts,
    getConflictsForDate,
    // 통계
    totalSchedules,
    membersWithSchedules,
    recurringCount,
  };
}
