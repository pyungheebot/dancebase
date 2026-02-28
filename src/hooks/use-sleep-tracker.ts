"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { SleepTrackerEntry, SleepTrackerQuality } from "@/types";

const STORAGE_PREFIX = "dancebase:sleep-tracker:";

function qualityToScore(quality: SleepTrackerQuality): number {
  switch (quality) {
    case "excellent":
      return 5;
    case "good":
      return 4;
    case "fair":
      return 3;
    case "poor":
      return 2;
    case "terrible":
      return 1;
  }
}

function calcDurationHours(bedtime: string, wakeTime: string): number {
  const [bH, bM] = bedtime.split(":").map(Number);
  const [wH, wM] = wakeTime.split(":").map(Number);
  let bedMinutes = bH * 60 + bM;
  let wakeMinutes = wH * 60 + wM;
  if (wakeMinutes <= bedMinutes) {
    wakeMinutes += 24 * 60;
  }
  return Math.round(((wakeMinutes - bedMinutes) / 60) * 10) / 10;
}

function getWeekRange(date: string): { start: string; end: string } {
  const d = new Date(date);
  const day = d.getDay(); // 0=일
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (dt: Date) => dt.toISOString().split("T")[0];
  return { start: fmt(monday), end: fmt(sunday) };
}

function loadEntries(memberId: string): SleepTrackerEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + memberId);
    if (!raw) return [];
    return JSON.parse(raw) as SleepTrackerEntry[];
  } catch {
    return [];
  }
}

function saveEntries(memberId: string, entries: SleepTrackerEntry[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_PREFIX + memberId, JSON.stringify(entries));
}

export function useSleepTracker(memberId: string) {
  const key = swrKeys.sleepTracker(memberId);

  const { data, mutate } = useSWR(key, () => loadEntries(memberId), {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  const entries: SleepTrackerEntry[] = data ?? [];

  // 기록 추가
  function addEntry(
    input: Omit<SleepTrackerEntry, "id" | "durationHours" | "createdAt">
  ): void {
    const newEntry: SleepTrackerEntry = {
      ...input,
      id: crypto.randomUUID(),
      durationHours: calcDurationHours(input.bedtime, input.wakeTime),
      createdAt: new Date().toISOString(),
    };
    const updated = [newEntry, ...entries].sort((a, b) =>
      b.date.localeCompare(a.date)
    );
    saveEntries(memberId, updated);
    mutate(updated, false);
  }

  // 기록 수정
  function updateEntry(
    id: string,
    patch: Partial<Omit<SleepTrackerEntry, "id" | "createdAt">>
  ): void {
    const updated = entries.map((e) => {
      if (e.id !== id) return e;
      const next = { ...e, ...patch };
      if (patch.bedtime || patch.wakeTime) {
        next.durationHours = calcDurationHours(next.bedtime, next.wakeTime);
      }
      return next;
    });
    saveEntries(memberId, updated);
    mutate(updated, false);
  }

  // 기록 삭제
  function deleteEntry(id: string): void {
    const updated = entries.filter((e) => e.id !== id);
    saveEntries(memberId, updated);
    mutate(updated, false);
  }

  // 해당 주 기록
  function getEntriesByWeek(date: string): SleepTrackerEntry[] {
    const { start, end } = getWeekRange(date);
    return entries.filter((e) => e.date >= start && e.date <= end);
  }

  // 통계
  const stats = (() => {
    const totalEntries = entries.length;
    if (totalEntries === 0) {
      return {
        totalEntries: 0,
        averageDuration: 0,
        averageQualityScore: 0,
        weeklyAvgDuration: 0,
        bestSleepDay: null as string | null,
      };
    }

    const averageDuration =
      Math.round(
        (entries.reduce((s, e) => s + e.durationHours, 0) / totalEntries) * 10
      ) / 10;

    const averageQualityScore =
      Math.round(
        (entries.reduce((s, e) => s + qualityToScore(e.quality), 0) /
          totalEntries) *
          10
      ) / 10;

    const today = new Date().toISOString().split("T")[0];
    const weekEntries = getEntriesByWeek(today);
    const weeklyAvgDuration =
      weekEntries.length === 0
        ? 0
        : Math.round(
            (weekEntries.reduce((s, e) => s + e.durationHours, 0) /
              weekEntries.length) *
              10
          ) / 10;

    const bestEntry = entries.reduce(
      (best, e) => {
        const score =
          qualityToScore(e.quality) * 2 +
          Math.min(e.durationHours / 8, 1) * 3;
        return score > best.score ? { score, date: e.date } : best;
      },
      { score: -1, date: null as string | null }
    );

    return {
      totalEntries,
      averageDuration,
      averageQualityScore,
      weeklyAvgDuration,
      bestSleepDay: bestEntry.date,
    };
  })();

  return {
    entries,
    addEntry,
    updateEntry,
    deleteEntry,
    getEntriesByWeek,
    stats,
    refetch: () => mutate(),
  };
}
