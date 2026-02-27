"use client";

import { useState, useCallback } from "react";
import { MoodType, MoodEntry } from "@/types";

const MAX_ENTRIES = 90; // 최대 90일 유지

function getStorageKey(groupId: string, userId: string): string {
  return `dancebase:mood-checkin:${groupId}:${userId}`;
}

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function loadEntries(groupId: string, userId: string): MoodEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId, userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as MoodEntry[];
  } catch {
    return [];
  }
}

function saveEntries(
  groupId: string,
  userId: string,
  entries: MoodEntry[]
): void {
  if (typeof window === "undefined") return;
  // 최신순 정렬 후 최대 90일만 유지
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const trimmed = sorted.slice(0, MAX_ENTRIES);
  localStorage.setItem(
    getStorageKey(groupId, userId),
    JSON.stringify(trimmed)
  );
}

export type MoodStats = {
  mood: MoodType;
  count: number;
  ratio: number; // 0~1
};

export function useMoodCheckin(groupId: string, userId: string) {
  // 항상 최신 데이터를 읽기 위해 state를 쓰되, 변경 시마다 갱신
  const [, forceUpdate] = useState(0);

  const getEntries = useCallback((): MoodEntry[] => {
    return loadEntries(groupId, userId);
  }, [groupId, userId]);

  const getTodayMood = useCallback((): MoodEntry | null => {
    const today = getTodayString();
    const entries = loadEntries(groupId, userId);
    return entries.find((e) => e.date === today) ?? null;
  }, [groupId, userId]);

  const checkIn = useCallback(
    (mood: MoodType, note?: string): void => {
      const today = getTodayString();
      const entries = loadEntries(groupId, userId);
      const existingIndex = entries.findIndex((e) => e.date === today);

      const newEntry: MoodEntry = {
        date: today,
        mood,
        note: note?.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        // 같은 날 덮어쓰기
        entries[existingIndex] = newEntry;
      } else {
        entries.push(newEntry);
      }

      saveEntries(groupId, userId, entries);
      forceUpdate((n) => n + 1);
    },
    [groupId, userId]
  );

  // 최근 N일 엔트리 반환 (오늘 기준, 최신순)
  const getRecentEntries = useCallback(
    (days: number): MoodEntry[] => {
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

  // 최근 30일 통계
  const getStats = useCallback((): MoodStats[] => {
    const recent = getRecentEntries(30);
    const total = recent.length;
    const moodOrder: MoodType[] = ["great", "good", "okay", "bad", "terrible"];

    return moodOrder.map((mood) => {
      const count = recent.filter((e) => e.mood === mood).length;
      return {
        mood,
        count,
        ratio: total > 0 ? count / total : 0,
      };
    });
  }, [getRecentEntries]);

  return {
    checkIn,
    getTodayMood,
    getEntries,
    getRecentEntries,
    getStats,
  };
}
