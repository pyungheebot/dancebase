"use client";

import { useState, useCallback } from "react";
import { saveToStorage } from "@/lib/local-storage";
import type {
  MemberSchedulePreference,
  TimeSlotEntry,

  WeekDayIndex,
  OptimalSlotResult,
} from "@/types";

// ============================================================
// 스토리지 키
// ============================================================

const STORAGE_KEY_PREFIX = "dancebase:schedule-preference:";

function getStorageKey(groupId: string): string {
  return `${STORAGE_KEY_PREFIX}${groupId}`;
}

// ============================================================
// 스토리지 데이터 형식
// ============================================================

type StorageData = {
  preferences: MemberSchedulePreference[];
};

// ============================================================
// 훅
// ============================================================

export function useSchedulePreference(
  groupId: string,
  totalMemberCount?: number
) {
  const [data, setData] = useState<StorageData>({ preferences: [] });

  // 상태 업데이트 + localStorage 동기화
  const updateData = useCallback(
    (updater: (prev: StorageData) => StorageData) => {
      setData((prev) => {
        const next = updater(prev);
        saveToStorage(getStorageKey(groupId), next);
        return next;
      });
    },
    [groupId]
  );

  // ============================================================
  // 선호도 설정 (멤버 전체 교체)
  // ============================================================

  const setPreference = useCallback(
    (memberName: string, preferences: TimeSlotEntry[]) => {
      updateData((prev) => {
        const existing = prev.preferences.find(
          (p) => p.memberName === memberName
        );
        const now = new Date().toISOString();

        if (existing) {
          return {
            ...prev,
            preferences: prev.preferences.map((p) =>
              p.memberName === memberName
                ? { ...p, preferences, updatedAt: now }
                : p
            ),
          };
        }

        const newEntry: MemberSchedulePreference = {
          id: crypto.randomUUID(),
          memberName,
          preferences,
          updatedAt: now,
          createdAt: now,
        };

        return {
          ...prev,
          preferences: [...prev.preferences, newEntry],
        };
      });
    },
    [updateData]
  );

  // ============================================================
  // 선호도 삭제
  // ============================================================

  const deletePreference = useCallback(
    (memberName: string) => {
      updateData((prev) => ({
        ...prev,
        preferences: prev.preferences.filter(
          (p) => p.memberName !== memberName
        ),
      }));
    },
    [updateData]
  );

  // ============================================================
  // 멤버별 조회
  // ============================================================

  const getMemberPreference = useCallback(
    (memberName: string): MemberSchedulePreference | undefined => {
      return data.preferences.find((p) => p.memberName === memberName);
    },
    [data.preferences]
  );

  // ============================================================
  // 최적 시간대 찾기
  // ============================================================

  const findOptimalSlots = useCallback(
    (
      startHour: number,
      endHour: number,
      durationHours: number
    ): OptimalSlotResult[] => {
      const results: OptimalSlotResult[] = [];
      const allDays: WeekDayIndex[] = [0, 1, 2, 3, 4, 5, 6];

      for (const day of allDays) {
        for (let h = startHour; h + durationHours <= endHour; h++) {
          const slotStart = h;
          const slotEnd = h + durationHours;

          let availableCount = 0;
          let preferredCount = 0;

          for (const member of data.preferences) {
            // 해당 슬롯과 겹치는 멤버 항목을 모두 확인
            const overlapping = member.preferences.filter(
              (entry) =>
                entry.day === day &&
                entry.startHour < slotEnd &&
                entry.endHour > slotStart
            );

            // 겹치는 항목 중 unavailable이 하나라도 있으면 참여 불가
            const hasUnavailable = overlapping.some(
              (e) => e.preference === "unavailable"
            );
            if (hasUnavailable) continue;

            // preferred가 있으면 preferred, available이 있으면 available
            const hasPreferred = overlapping.some(
              (e) => e.preference === "preferred"
            );
            const hasAvailable = overlapping.some(
              (e) => e.preference === "available"
            );

            if (hasPreferred) {
              preferredCount++;
              availableCount++;
            } else if (hasAvailable) {
              availableCount++;
            }
          }

          // score: preferred 2점, available 1점
          const score = preferredCount * 2 + availableCount;

          results.push({
            day,
            startHour: slotStart,
            endHour: slotEnd,
            availableCount,
            preferredCount,
            score,
          });
        }
      }

      // score 내림차순 정렬
      return results.sort((a, b) => b.score - a.score);
    },
    [data.preferences]
  );

  // ============================================================
  // 요일x시간 가용성 매트릭스 반환
  // 반환: matrix[day][hour] = { availableCount, preferredCount }
  // ============================================================

  const getAvailabilityMatrix = useCallback((): Record<
    number,
    Record<number, { availableCount: number; preferredCount: number }>
  > => {
    const matrix: Record<
      number,
      Record<number, { availableCount: number; preferredCount: number }>
    > = {};

    const allDays: WeekDayIndex[] = [0, 1, 2, 3, 4, 5, 6];

    for (const day of allDays) {
      matrix[day] = {};
      for (let hour = 0; hour <= 23; hour++) {
        let availableCount = 0;
        let preferredCount = 0;

        for (const member of data.preferences) {
          const slot = member.preferences.find(
            (e) =>
              e.day === day &&
              e.startHour <= hour &&
              e.endHour > hour
          );

          if (!slot) continue;
          if (slot.preference === "unavailable") continue;
          if (slot.preference === "preferred") {
            preferredCount++;
            availableCount++;
          } else if (slot.preference === "available") {
            availableCount++;
          }
        }

        matrix[day][hour] = { availableCount, preferredCount };
      }
    }

    return matrix;
  }, [data.preferences]);

  // ============================================================
  // 통계
  // ============================================================

  const totalMembers = data.preferences.length;
  const coverageRate =
    totalMemberCount && totalMemberCount > 0
      ? Math.round((totalMembers / totalMemberCount) * 100)
      : 0;

  return {
    preferences: data.preferences,
    // 액션
    setPreference,
    deletePreference,
    // 조회
    getMemberPreference,
    findOptimalSlots,
    getAvailabilityMatrix,
    // 통계
    totalMembers,
    coverageRate,
  };
}
