"use client";

import { useState, useCallback } from "react";
import type { ScheduleRetro } from "@/types";
import { removeFromStorage } from "@/lib/local-storage";

function getStorageKey(scheduleId: string): string {
  return `schedule-retro-${scheduleId}`;
}

function loadRetro(scheduleId: string): ScheduleRetro | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getStorageKey(scheduleId));
    return raw ? (JSON.parse(raw) as ScheduleRetro) : null;
  } catch {
    return null;
  }
}

function saveRetro(scheduleId: string, retro: ScheduleRetro): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(scheduleId), JSON.stringify(retro));
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

function removeRetro(scheduleId: string): void {
  if (typeof window === "undefined") return;
  try {
    removeFromStorage(getStorageKey(scheduleId));
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

export function useScheduleRetro(scheduleId: string) {
  const [retro, setRetro] = useState<ScheduleRetro | null>(() =>
    loadRetro(scheduleId)
  );

  const save = useCallback(
    (data: { good: string; improve: string; nextGoal: string }, createdBy: string) => {
      const existing = loadRetro(scheduleId);
      const newRetro: ScheduleRetro = {
        good: data.good,
        improve: data.improve,
        nextGoal: data.nextGoal,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
        createdBy,
      };
      saveRetro(scheduleId, newRetro);
      setRetro(newRetro);
    },
    [scheduleId]
  );

  const remove = useCallback(() => {
    removeRetro(scheduleId);
    setRetro(null);
  }, [scheduleId]);

  const refresh = useCallback(() => {
    setRetro(loadRetro(scheduleId));
  }, [scheduleId]);

  return { retro, save, remove, refresh };
}
