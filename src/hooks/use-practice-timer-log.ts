"use client";

import { useState, useEffect, useCallback } from "react";
import type { PracticeTimerCategory, PracticeTimerLogEntry } from "@/types";

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(groupId: string): string {
  return `dancebase:practice-timer-log:${groupId}`;
}

function loadData(groupId: string): PracticeTimerLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as PracticeTimerLogEntry[];
  } catch {
    return [];
  }
}

function saveData(groupId: string, data: PracticeTimerLogEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId), JSON.stringify(data));
  } catch {
    // 무시
  }
}

// ============================================================
// 주 시작일 계산 (월요일 기준)
// ============================================================

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=일
  const diff = day === 0 ? -6 : 1 - day; // 월요일로 이동
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function getWeekEnd(weekStartDate: string): string {
  const d = new Date(weekStartDate + "T00:00:00");
  d.setDate(d.getDate() + 6);
  return d.toISOString().slice(0, 10);
}

// ============================================================
// 통계 타입
// ============================================================

export type PracticeTimerCategoryBreakdown = Record<
  PracticeTimerCategory,
  number
>;

export type PracticeTimerWeeklyItem = {
  weekStart: string;
  totalMinutes: number;
};

export type PracticeTimerStats = {
  totalLogs: number;
  totalMinutes: number;
  averageDuration: number;
  averageIntensity: number;
  categoryBreakdown: PracticeTimerCategoryBreakdown;
  weeklyTrend: PracticeTimerWeeklyItem[];
};

// ============================================================
// 훅
// ============================================================

export function usePracticeTimerLog(groupId: string) {
  const [logs, setLogs] = useState<PracticeTimerLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    if (!groupId) return;
    const data = loadData(groupId);
    setLogs(data);
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const persist = useCallback(
    (next: PracticeTimerLogEntry[]) => {
      saveData(groupId, next);
      setLogs(next);
    },
    [groupId]
  );

  // 기록 추가
  const addLog = useCallback(
    (
      date: string,
      category: PracticeTimerCategory,
      durationMinutes: number,
      memberName?: string,
      description?: string,
      intensity: number = 3
    ): PracticeTimerLogEntry => {
      const entry: PracticeTimerLogEntry = {
        id: crypto.randomUUID(),
        date,
        category,
        durationMinutes,
        memberName,
        description,
        intensity: Math.min(5, Math.max(1, Math.round(intensity))),
        createdAt: new Date().toISOString(),
      };
      persist([...logs, entry]);
      return entry;
    },
    [logs, persist]
  );

  // 기록 삭제
  const deleteLog = useCallback(
    (id: string): boolean => {
      const next = logs.filter((l) => l.id !== id);
      if (next.length === logs.length) return false;
      persist(next);
      return true;
    },
    [logs, persist]
  );

  // 날짜별 조회
  const getByDate = useCallback(
    (date: string): PracticeTimerLogEntry[] => {
      return logs.filter((l) => l.date === date);
    },
    [logs]
  );

  // 카테고리별 조회
  const getByCategory = useCallback(
    (category: PracticeTimerCategory): PracticeTimerLogEntry[] => {
      return logs.filter((l) => l.category === category);
    },
    [logs]
  );

  // 멤버별 조회
  const getByMember = useCallback(
    (memberName: string): PracticeTimerLogEntry[] => {
      return logs.filter((l) => l.memberName === memberName);
    },
    [logs]
  );

  // 주간 합계 (weekStartDate: "YYYY-MM-DD" 월요일 기준)
  const getWeeklyTotal = useCallback(
    (weekStartDate: string): number => {
      const end = getWeekEnd(weekStartDate);
      return logs
        .filter((l) => l.date >= weekStartDate && l.date <= end)
        .reduce((sum, l) => sum + l.durationMinutes, 0);
    },
    [logs]
  );

  // 통계 계산
  const stats: PracticeTimerStats = (() => {
    const totalLogs = logs.length;
    const totalMinutes = logs.reduce((s, l) => s + l.durationMinutes, 0);
    const averageDuration =
      totalLogs > 0 ? Math.round(totalMinutes / totalLogs) : 0;
    const averageIntensity =
      totalLogs > 0
        ? Math.round(
            (logs.reduce((s, l) => s + l.intensity, 0) / totalLogs) * 10
          ) / 10
        : 0;

    const allCategories: PracticeTimerCategory[] = [
      "warmup",
      "technique",
      "choreography",
      "freestyle",
      "cooldown",
      "other",
    ];
    const categoryBreakdown = allCategories.reduce((acc, cat) => {
      acc[cat] = logs
        .filter((l) => l.category === cat)
        .reduce((s, l) => s + l.durationMinutes, 0);
      return acc;
    }, {} as PracticeTimerCategoryBreakdown);

    // 최근 4주 추이
    const now = new Date();
    const weeklyTrend: PracticeTimerWeeklyItem[] = [];
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const weekStart = getWeekStart(d);
      weeklyTrend.push({
        weekStart,
        totalMinutes: 0, // 아래서 채움
      });
    }
    for (const item of weeklyTrend) {
      item.totalMinutes = logs
        .filter(
          (l) => l.date >= item.weekStart && l.date <= getWeekEnd(item.weekStart)
        )
        .reduce((s, l) => s + l.durationMinutes, 0);
    }

    return {
      totalLogs,
      totalMinutes,
      averageDuration,
      averageIntensity,
      categoryBreakdown,
      weeklyTrend,
    };
  })();

  return {
    logs,
    loading,
    addLog,
    deleteLog,
    getByDate,
    getByCategory,
    getByMember,
    getWeeklyTotal,
    stats,
    refetch: reload,
  };
}
