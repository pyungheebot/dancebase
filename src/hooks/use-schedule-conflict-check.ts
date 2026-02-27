"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { detectConflicts } from "@/lib/schedule-conflict";
import type { Schedule } from "@/types";

type ConflictCheckParams = {
  startsAt: string | null;
  endsAt: string | null;
  groupId: string;
  excludeScheduleId?: string;
};

type ConflictCheckResult = {
  conflicts: Schedule[];
  hasConflict: boolean;
  isChecking: boolean;
};

/**
 * 일정 충돌 감지 훅
 * - debounce 500ms 적용
 * - startsAt / endsAt 중 하나라도 없으면 검사 생략
 * - excludeScheduleId: 수정 모드에서 자기 자신 제외
 */
export function useScheduleConflictCheck({
  startsAt,
  endsAt,
  groupId,
  excludeScheduleId,
}: ConflictCheckParams): ConflictCheckResult {
  const [conflicts, setConflicts] = useState<Schedule[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // 날짜/시간 미입력 시 충돌 초기화
    if (!startsAt || !endsAt) {
      setConflicts([]);
      setIsChecking(false);
      return;
    }

    setIsChecking(true);

    // 이전 타이머 취소
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("schedules")
          .select("*")
          .eq("group_id", groupId);

        if (error) {
          setConflicts([]);
          return;
        }

        const existing = (data ?? []) as Schedule[];
        const found = detectConflicts(
          { starts_at: startsAt, ends_at: endsAt },
          existing,
          excludeScheduleId
        );
        setConflicts(found);
      } finally {
        setIsChecking(false);
      }
    }, 500);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [startsAt, endsAt, groupId, excludeScheduleId]);

  return {
    conflicts,
    hasConflict: conflicts.length > 0,
    isChecking,
  };
}
