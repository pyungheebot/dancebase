"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { swrKeys } from "@/lib/swr/keys";
import type { ScheduleConflict, ConflictType } from "@/types";

/**
 * 두 일정의 시간이 겹치는지 확인
 * A.start < B.end && B.start < A.end 이면 겹침
 */
function hasTimeOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  const aS = new Date(aStart).getTime();
  const aE = new Date(aEnd).getTime();
  const bS = new Date(bStart).getTime();
  const bE = new Date(bEnd).getTime();
  return aS < bE && bS < aE;
}

/**
 * 두 일정이 같은 날인지 확인 (YYYY-MM-DD 기준)
 */
function isSameDay(aStart: string, bStart: string): boolean {
  return aStart.slice(0, 10) === bStart.slice(0, 10);
}

/**
 * 두 일정의 장소가 동일한지 확인 (null/공백 제외)
 */
function hasSameLocation(
  aLocation: string | null,
  bLocation: string | null
): boolean {
  if (!aLocation || !bLocation) return false;
  return aLocation.trim().toLowerCase() === bLocation.trim().toLowerCase();
}

export function useScheduleConflictDetector(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.scheduleConflictDetector(groupId) : null,
    async () => {
      const supabase = createClient();

      const { data: schedules, error } = await supabase
        .from("schedules")
        .select("id, title, starts_at, ends_at, location")
        .eq("group_id", groupId)
        .order("starts_at", { ascending: true });

      if (error) throw new Error(error.message);
      if (!schedules || schedules.length < 2) return [];

      const conflicts: ScheduleConflict[] = [];

      for (let i = 0; i < schedules.length; i++) {
        for (let j = i + 1; j < schedules.length; j++) {
          const a = schedules[i];
          const b = schedules[j];

          const conflictTypes: ConflictType[] = [];

          if (hasTimeOverlap(a.starts_at, a.ends_at, b.starts_at, b.ends_at)) {
            conflictTypes.push("time_overlap");
          }

          // 시간 겹침이 없을 때만 같은 날 여부 확인 (중복 방지)
          if (
            conflictTypes.length === 0 &&
            isSameDay(a.starts_at, b.starts_at)
          ) {
            conflictTypes.push("same_day");
          }

          if (hasSameLocation(a.location, b.location)) {
            conflictTypes.push("same_location");
          }

          if (conflictTypes.length > 0) {
            conflicts.push({
              id: `${a.id}-${b.id}`,
              scheduleA: {
                id: a.id,
                title: a.title,
                startsAt: a.starts_at,
                endsAt: a.ends_at,
                location: a.location,
              },
              scheduleB: {
                id: b.id,
                title: b.title,
                startsAt: b.starts_at,
                endsAt: b.ends_at,
                location: b.location,
              },
              conflictTypes,
            });
          }
        }
      }

      return conflicts;
    }
  );

  return {
    conflicts: data ?? [],
    loading: isLoading,
    refetch: () => mutate(),
  };
}
