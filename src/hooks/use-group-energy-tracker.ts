"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { invalidateGroupEnergyTracker } from "@/lib/swr/invalidate";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type { EnergyRecord, EnergyDimension } from "@/types";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";

const MAX_RECORDS = 100;

function storageKey(groupId: string): string {
  return `dancebase:energy:${groupId}`;
}

function loadRecords(groupId: string): EnergyRecord[] {
  return loadFromStorage<EnergyRecord[]>(storageKey(groupId), []);
}

function saveRecords(groupId: string, records: EnergyRecord[]): void {
  // 최신순 정렬 후 최대 100개 유지
  const sorted = [...records].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const trimmed = sorted.slice(0, MAX_RECORDS);
  saveToStorage(storageKey(groupId), trimmed);
}

// -------------------------------------------------------
// 일별 평균 계산 (동일 날짜 기록들의 평균)
// -------------------------------------------------------
export type DailyAverage = {
  date: string;
  morale: number;
  motivation: number;
  fatigue: number;
  count: number;
};

function calcDailyAverages(records: EnergyRecord[]): DailyAverage[] {
  const grouped: Record<string, EnergyRecord[]> = {};
  for (const r of records) {
    if (!grouped[r.date]) grouped[r.date] = [];
    grouped[r.date].push(r);
  }

  return Object.entries(grouped)
    .map(([date, recs]) => ({
      date,
      morale: Math.round(recs.reduce((s, r) => s + r.scores.morale, 0) / recs.length),
      motivation: Math.round(
        recs.reduce((s, r) => s + r.scores.motivation, 0) / recs.length
      ),
      fatigue: Math.round(
        recs.reduce((s, r) => s + r.scores.fatigue, 0) / recs.length
      ),
      count: recs.length,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// -------------------------------------------------------
// 주간 트렌드 계산 (최근 4주 평균)
// -------------------------------------------------------
export type WeeklyTrend = {
  weekLabel: string; // "W1", "W2", "W3", "W4" (오래된 순)
  startDate: string;
  endDate: string;
  morale: number;
  motivation: number;
  fatigue: number;
  count: number;
};

function calcWeeklyTrends(records: EnergyRecord[]): WeeklyTrend[] {
  const now = new Date();
  const trends: WeeklyTrend[] = [];

  for (let w = 3; w >= 0; w--) {
    // w=3 → 4주 전, w=0 → 이번 주
    const endMs = now.getTime() - w * 7 * 24 * 60 * 60 * 1000;
    const startMs = endMs - 7 * 24 * 60 * 60 * 1000;

    const startDate = new Date(startMs).toISOString().slice(0, 10);
    const endDate = new Date(endMs).toISOString().slice(0, 10);

    const weekRecs = records.filter((r) => r.date >= startDate && r.date <= endDate);

    trends.push({
      weekLabel: `W${4 - w}`,
      startDate,
      endDate,
      morale:
        weekRecs.length > 0
          ? Math.round(weekRecs.reduce((s, r) => s + r.scores.morale, 0) / weekRecs.length)
          : 0,
      motivation:
        weekRecs.length > 0
          ? Math.round(
              weekRecs.reduce((s, r) => s + r.scores.motivation, 0) / weekRecs.length
            )
          : 0,
      fatigue:
        weekRecs.length > 0
          ? Math.round(
              weekRecs.reduce((s, r) => s + r.scores.fatigue, 0) / weekRecs.length
            )
          : 0,
      count: weekRecs.length,
    });
  }

  return trends;
}

// -------------------------------------------------------
// 최근 30일 기록 필터
// -------------------------------------------------------
function recentRecords(records: EnergyRecord[], days = 30): EnergyRecord[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return records.filter((r) => r.date >= cutoffStr);
}

// -------------------------------------------------------
// 훅
// -------------------------------------------------------
export function useGroupEnergyTracker(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.groupEnergyTracker(groupId) : null,
    () => loadRecords(groupId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const records = data ?? [];
  const recent30 = recentRecords(records, 30);
  const dailyAverages = calcDailyAverages(recent30);
  const weeklyTrends = calcWeeklyTrends(recent30);

  // 현재 에너지 (최근 기록 기준 최신 7일 평균)
  const recent7 = recentRecords(records, 7);
  const currentEnergy: Record<EnergyDimension, number> = {
    morale:
      recent7.length > 0
        ? Math.round(recent7.reduce((s, r) => s + r.scores.morale, 0) / recent7.length)
        : 0,
    motivation:
      recent7.length > 0
        ? Math.round(recent7.reduce((s, r) => s + r.scores.motivation, 0) / recent7.length)
        : 0,
    fatigue:
      recent7.length > 0
        ? Math.round(recent7.reduce((s, r) => s + r.scores.fatigue, 0) / recent7.length)
        : 0,
  };

  // 기록 추가
  function addRecord(input: {
    date: string;
    recordedBy: string;
    scores: Record<EnergyDimension, number>;
    note: string;
  }): void {
    const newRecord: EnergyRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: input.date,
      recordedBy: input.recordedBy,
      scores: input.scores,
      note: input.note,
      createdAt: new Date().toISOString(),
    };

    const current = loadRecords(groupId);
    const updated = [newRecord, ...current];
    saveRecords(groupId, updated);

    invalidateGroupEnergyTracker(groupId);
    mutate(loadRecords(groupId));
    toast.success(TOAST.ENERGY.SAVED);
  }

  // 기록 삭제
  function deleteRecord(id: string): void {
    const current = loadRecords(groupId);
    const updated = current.filter((r) => r.id !== id);
    saveRecords(groupId, updated);

    invalidateGroupEnergyTracker(groupId);
    mutate(loadRecords(groupId));
    toast.success(TOAST.ENERGY.DELETED);
  }

  return {
    records,
    recent30,
    currentEnergy,
    dailyAverages,
    weeklyTrends,
    loading: isLoading,
    addRecord,
    deleteRecord,
    refetch: () => mutate(loadRecords(groupId)),
  };
}
