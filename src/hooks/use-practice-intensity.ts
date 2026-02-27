"use client";

import { useState, useCallback } from "react";
import { PracticeIntensityEntry, IntensityLevel, WeeklyIntensitySummary } from "@/types";

const MAX_ENTRIES = 100;

// ── localStorage 헬퍼 ────────────────────────────────────────────────────────

function getStorageKey(groupId: string, userId: string): string {
  return `dancebase:practice-intensity:${groupId}:${userId}`;
}

function loadEntries(groupId: string, userId: string): PracticeIntensityEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId, userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as PracticeIntensityEntry[];
  } catch {
    return [];
  }
}

function saveEntries(
  groupId: string,
  userId: string,
  entries: PracticeIntensityEntry[]
): void {
  if (typeof window === "undefined") return;
  // 최신순 정렬 후 최대 100개만 유지
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const trimmed = sorted.slice(0, MAX_ENTRIES);
  localStorage.setItem(getStorageKey(groupId, userId), JSON.stringify(trimmed));
}

// ── RPE 색상 유틸 ────────────────────────────────────────────────────────────

export function getIntensityColor(intensity: IntensityLevel): {
  bg: string;
  text: string;
  bar: string;
} {
  if (intensity <= 3) {
    return { bg: "bg-green-100", text: "text-green-700", bar: "bg-green-500" };
  }
  if (intensity <= 6) {
    return { bg: "bg-yellow-100", text: "text-yellow-700", bar: "bg-yellow-500" };
  }
  if (intensity <= 8) {
    return { bg: "bg-orange-100", text: "text-orange-700", bar: "bg-orange-500" };
  }
  return { bg: "bg-red-100", text: "text-red-700", bar: "bg-red-500" };
}

export function getIntensityLabel(intensity: IntensityLevel): string {
  if (intensity <= 3) return "가벼움";
  if (intensity <= 6) return "보통";
  if (intensity <= 8) return "강함";
  return "최고강도";
}

// ── 날짜 유틸 ────────────────────────────────────────────────────────────────

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

/** 날짜에서 해당 주의 월요일 (YYYY-MM-DD) 반환 */
function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay(); // 0=일, 1=월 ...
  const diff = day === 0 ? -6 : 1 - day; // 월요일로 조정
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

// ── 훅 ───────────────────────────────────────────────────────────────────────

export function usePracticeIntensity(groupId: string, userId: string) {
  const [, forceUpdate] = useState(0);

  /** 전체 기록 반환 (최신순) */
  const getEntries = useCallback((): PracticeIntensityEntry[] => {
    return loadEntries(groupId, userId);
  }, [groupId, userId]);

  /** 최근 N일 기록 (오늘 기준, 최신순) */
  const getRecentEntries = useCallback(
    (days: number): PracticeIntensityEntry[] => {
      const entries = loadEntries(groupId, userId);
      const today = getTodayString();
      const cutoff = new Date(today);
      cutoff.setDate(cutoff.getDate() - (days - 1));
      const cutoffStr = cutoff.toISOString().slice(0, 10);
      return entries
        .filter((e) => e.date >= cutoffStr && e.date <= today)
        .sort((a, b) => b.date.localeCompare(a.date));
    },
    [groupId, userId]
  );

  /**
   * 주간 요약 계산 (최근 N주, 오늘 기준)
   * 각 주는 월요일 시작 기준으로 묶임.
   */
  const getWeeklySummaries = useCallback(
    (weeks: number): WeeklyIntensitySummary[] => {
      const entries = getRecentEntries(weeks * 7);
      // 주별로 그룹화
      const map = new Map<string, PracticeIntensityEntry[]>();
      for (const entry of entries) {
        const ws = getWeekStart(entry.date);
        if (!map.has(ws)) map.set(ws, []);
        map.get(ws)!.push(entry);
      }

      // 현재 기준 최근 N주의 weekStart 목록 생성 (오래된 순)
      const today = getTodayString();
      const currentWeekStart = getWeekStart(today);
      const weekStarts: string[] = [];
      for (let i = weeks - 1; i >= 0; i--) {
        const d = new Date(currentWeekStart + "T00:00:00");
        d.setDate(d.getDate() - i * 7);
        weekStarts.push(d.toISOString().slice(0, 10));
      }

      return weekStarts.map((ws) => {
        const weekEntries = map.get(ws) ?? [];
        const sessionCount = weekEntries.length;
        const totalMinutes = weekEntries.reduce(
          (sum, e) => sum + e.durationMinutes,
          0
        );
        const avgIntensity =
          sessionCount > 0
            ? weekEntries.reduce((sum, e) => sum + e.intensity, 0) / sessionCount
            : 0;
        return {
          weekStart: ws,
          avgIntensity: Math.round(avgIntensity * 10) / 10,
          totalMinutes,
          sessionCount,
        };
      });
    },
    [getRecentEntries]
  );

  /** 통계 요약 (전체 기록 기준) */
  const getSummaryStats = useCallback(() => {
    const entries = getRecentEntries(30);
    const sessionCount = entries.length;
    const totalMinutes = entries.reduce((sum, e) => sum + e.durationMinutes, 0);
    const avgIntensity =
      sessionCount > 0
        ? entries.reduce((sum, e) => sum + e.intensity, 0) / sessionCount
        : 0;
    return {
      sessionCount,
      totalMinutes,
      avgIntensity: Math.round(avgIntensity * 10) / 10,
    };
  }, [getRecentEntries]);

  /** 기록 추가 */
  const addEntry = useCallback(
    (entry: Omit<PracticeIntensityEntry, "id" | "createdAt">): void => {
      const entries = loadEntries(groupId, userId);
      const newEntry: PracticeIntensityEntry = {
        ...entry,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      entries.push(newEntry);
      saveEntries(groupId, userId, entries);
      forceUpdate((n) => n + 1);
    },
    [groupId, userId]
  );

  /** 기록 삭제 */
  const removeEntry = useCallback(
    (id: string): void => {
      const entries = loadEntries(groupId, userId).filter((e) => e.id !== id);
      saveEntries(groupId, userId, entries);
      forceUpdate((n) => n + 1);
    },
    [groupId, userId]
  );

  return {
    getEntries,
    getRecentEntries,
    getWeeklySummaries,
    getSummaryStats,
    addEntry,
    removeEntry,
  };
}
