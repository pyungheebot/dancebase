"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { GrowthTrajectory, GrowthDataPoint, GrowthDimension } from "@/types";

// ─── 상수 ──────────────────────────────────────────────────────

const DIMENSIONS: GrowthDimension[] = [
  "skill",
  "attendance",
  "leadership",
  "creativity",
  "collaboration",
];

// ─── localStorage 헬퍼 ─────────────────────────────────────────

function storageKey(groupId: string): string {
  return `dancebase:growth-trajectory:${groupId}`;
}

function loadData(groupId: string): GrowthTrajectory[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as GrowthTrajectory[];
  } catch {
    return [];
  }
}

function saveData(groupId: string, data: GrowthTrajectory[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId), JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

// ─── 유틸 ──────────────────────────────────────────────────────

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** 종합 점수 계산 (5개 차원 평균) */
function calcComposite(scores: Record<GrowthDimension, number>): number {
  const total = DIMENSIONS.reduce((s, d) => s + scores[d], 0);
  return Math.round(total / DIMENSIONS.length);
}

/** 초기 데이터포인트 생성 (최근 3개월 시뮬레이션) */
function generateInitialDataPoints(): GrowthDataPoint[] {
  const points: GrowthDataPoint[] = [];
  const now = new Date();

  for (let i = 2; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const baseScore = randomInt(40, 70);
    const variance = randomInt(-10, 10);

    const scores: Record<GrowthDimension, number> = {
      skill: Math.min(100, Math.max(0, baseScore + randomInt(-15, 15))),
      attendance: Math.min(100, Math.max(0, baseScore + randomInt(-10, 20))),
      leadership: Math.min(100, Math.max(0, baseScore + randomInt(-20, 10))),
      creativity: Math.min(100, Math.max(0, baseScore + variance + randomInt(-10, 10))),
      collaboration: Math.min(100, Math.max(0, baseScore + randomInt(-5, 15))),
    };

    points.push({ month, scores });
  }

  return points;
}

/** 추세 계산: 최근 3개월 평균 vs 이전 평균 */
function calcTrend(
  dataPoints: GrowthDataPoint[]
): "rising" | "steady" | "declining" {
  if (dataPoints.length < 2) return "steady";

  const sorted = [...dataPoints].sort((a, b) =>
    a.month.localeCompare(b.month)
  );

  const recent = sorted.slice(-3);
  const older = sorted.slice(0, Math.max(1, sorted.length - 3));

  const recentAvg =
    recent.reduce((s, p) => s + calcComposite(p.scores), 0) / recent.length;
  const olderAvg =
    older.reduce((s, p) => s + calcComposite(p.scores), 0) / older.length;

  const diff = recentAvg - olderAvg;

  if (diff > 3) return "rising";
  if (diff < -3) return "declining";
  return "steady";
}

// ─── 훅 ───────────────────────────────────────────────────────

export function useGrowthTrajectory(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.growthTrajectory(groupId) : null,
    (): GrowthTrajectory[] => loadData(groupId)
  );

  const trajectories = data ?? [];

  /** 멤버 추가 (초기 3개월 데이터포인트 자동 생성) */
  const addTrajectory = useCallback((memberName: string, goal: number): GrowthTrajectory | null => {
    if (!memberName.trim()) return null;

    const already = trajectories.find(
      (t) => t.memberName.trim() === memberName.trim()
    );
    if (already) return null;

    const now = new Date().toISOString();
    const dataPoints = generateInitialDataPoints();
    const trend = calcTrend(dataPoints);

    const newItem: GrowthTrajectory = {
      id: `gt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      memberName: memberName.trim(),
      dataPoints,
      goal: Math.min(100, Math.max(0, goal)),
      trend,
      createdAt: now,
      updatedAt: now,
    };

    const updated = [...trajectories, newItem];
    saveData(groupId, updated);
    mutate(updated, false);
    return newItem;
  }, [trajectories, groupId, mutate]);

  /** 월별 데이터포인트 추가 */
  const addDataPoint = useCallback((
    trajectoryId: string,
    month: string,
    scores: Record<GrowthDimension, number>
  ): boolean => {
    const idx = trajectories.findIndex((t) => t.id === trajectoryId);
    if (idx === -1) return false;

    const target = trajectories[idx];
    const existingIdx = target.dataPoints.findIndex((p) => p.month === month);

    let newPoints: GrowthDataPoint[];
    if (existingIdx >= 0) {
      newPoints = target.dataPoints.map((p, i) =>
        i === existingIdx ? { month, scores } : p
      );
    } else {
      newPoints = [...target.dataPoints, { month, scores }];
    }

    const updated: GrowthTrajectory = {
      ...target,
      dataPoints: newPoints,
      trend: calcTrend(newPoints),
      updatedAt: new Date().toISOString(),
    };

    const newList = trajectories.map((t, i) => (i === idx ? updated : t));
    saveData(groupId, newList);
    mutate(newList, false);
    return true;
  }, [trajectories, groupId, mutate]);

  /** 성장 궤적 삭제 */
  const deleteTrajectory = useCallback((id: string): void => {
    const updated = trajectories.filter((t) => t.id !== id);
    saveData(groupId, updated);
    mutate(updated, false);
  }, [trajectories, groupId, mutate]);

  /** 멤버 이름으로 궤적 조회 */
  const getTrajectoryForMember = useCallback((name: string): GrowthTrajectory | undefined => {
    return trajectories.find((t) => t.memberName === name);
  }, [trajectories]);

  // ─── 통계 ───────────────────────────────────────────────────

  const totalMembers = trajectories.length;

  /** 평균 성장률: 멤버별 최신 종합점수와 첫 종합점수의 차이 평균 */
  const avgGrowthRate: number = (() => {
    if (trajectories.length === 0) return 0;
    const rates = trajectories.map((t) => {
      const sorted = [...t.dataPoints].sort((a, b) =>
        a.month.localeCompare(b.month)
      );
      if (sorted.length < 2) return 0;
      const first = calcComposite(sorted[0].scores);
      const last = calcComposite(sorted[sorted.length - 1].scores);
      return last - first;
    });
    const sum = rates.reduce((s, r) => s + r, 0);
    return Math.round(sum / rates.length);
  })();

  /** 멤버별 최신 종합 점수 */
  const getLatestComposite = useCallback((t: GrowthTrajectory): number => {
    if (t.dataPoints.length === 0) return 0;
    const sorted = [...t.dataPoints].sort((a, b) =>
      a.month.localeCompare(b.month)
    );
    return calcComposite(sorted[sorted.length - 1].scores);
  }, []);

  /** 목표 달성률 (%) */
  const getGoalAchievement = useCallback((t: GrowthTrajectory): number => {
    if (t.goal === 0) return 0;
    return Math.min(100, Math.round((getLatestComposite(t) / t.goal) * 100));
  }, [getLatestComposite]);

  return {
    trajectories,
    loading: isLoading,
    totalMembers,
    avgGrowthRate,
    addTrajectory,
    addDataPoint,
    deleteTrajectory,
    getTrajectoryForMember,
    getLatestComposite,
    getGoalAchievement,
    calcComposite,
    refetch: () => mutate(),
  };
}
