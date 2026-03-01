"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { SKILL_CATEGORIES } from "@/types";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  SkillCategory,
  SkillEvolutionData,
  SkillMonthlySnapshot,
} from "@/types";

// ============================================
// 상수
// ============================================

/** localStorage 키 프리픽스 */
const STORAGE_PREFIX = "dancebase:skill-evolution";

/** 보관할 최대 스냅샷 수 (12개월) */
const MAX_SNAPSHOTS = 12;

// ============================================
// localStorage 헬퍼
// ============================================

function storageKey(groupId: string, userId: string): string {
  return `${STORAGE_PREFIX}:${groupId}:${userId}`;
}

// ============================================
// 유틸
// ============================================

/** 현재 "YYYY-MM" 문자열 반환 */
function currentYearMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** 6개 카테고리 평균 점수 계산 (소수점 2자리) */
function calcAvgScore(scores: Record<SkillCategory, number>): number {
  const total = SKILL_CATEGORIES.reduce(
    (sum, cat) => sum + (scores[cat] ?? 1),
    0
  );
  return Math.round((total / SKILL_CATEGORIES.length) * 100) / 100;
}

/** 카테고리별 성장률 계산 (최신 - 이전, 없으면 null) */
function calcGrowth(
  latest: SkillMonthlySnapshot | null,
  prev: SkillMonthlySnapshot | null
): Record<SkillCategory, number | null> {
  return Object.fromEntries(
    SKILL_CATEGORIES.map((cat) => [
      cat,
      latest && prev
        ? (latest.scores[cat] ?? 0) - (prev.scores[cat] ?? 0)
        : null,
    ])
  ) as Record<SkillCategory, number | null>;
}

// ============================================
// 훅 반환 타입
// ============================================

export type SkillEvolutionTrackerReturn = {
  /** 전체 스냅샷 데이터 */
  data: SkillEvolutionData;
  /** 최신 스냅샷 (없으면 null) */
  latest: SkillMonthlySnapshot | null;
  /** 이전 스냅샷 (최신 바로 이전, 없으면 null) */
  previous: SkillMonthlySnapshot | null;
  /** 전체 평균 점수의 월별 추이 (X축용) */
  monthlyAvgTrend: { month: string; avgScore: number }[];
  /** 카테고리별 성장률 (최신 - 이전) */
  categoryGrowth: Record<SkillCategory, number | null>;
  /** 종합 평균 점수 (최신, 없으면 null) */
  currentAvg: number | null;
  /** 지난달 대비 종합 평균 변화 (없으면 null) */
  avgChange: number | null;
  loading: boolean;
  /** 현재 스킬 점수를 스냅샷으로 저장 */
  saveSnapshot: (scores: Record<SkillCategory, number>) => SkillMonthlySnapshot;
  /** SWR 재검증 */
  refetch: () => void;
};

// ============================================
// 훅
// ============================================

export function useSkillEvolutionTracker(
  groupId: string,
  userId: string
): SkillEvolutionTrackerReturn {
  const swrKey =
    groupId && userId
      ? `skill-evolution:${groupId}:${userId}`
      : null;

  const { data: rawData, isLoading, mutate } = useSWR(
    swrKey,
    () => loadFromStorage<SkillEvolutionData>(storageKey(groupId, userId), { snapshots: [] })
  );

  const data: SkillEvolutionData = rawData ?? { snapshots: [] };

  // 최신순 정렬
  const sorted = [...data.snapshots].sort(
    (a, b) => b.month.localeCompare(a.month)
  );

  const latest = sorted[0] ?? null;
  const previous = sorted[1] ?? null;

  // 전체 평균 추이 (오래된 것부터 → 차트 왼쪽이 과거)
  const monthlyAvgTrend = [...sorted]
    .reverse()
    .map((s) => ({ month: s.month, avgScore: s.avgScore }));

  const categoryGrowth = calcGrowth(latest, previous);

  const currentAvg = latest?.avgScore ?? null;
  const avgChange =
    latest && previous
      ? Math.round((latest.avgScore - previous.avgScore) * 100) / 100
      : null;

  /** 스냅샷 저장 (같은 달 재기록은 덮어씀) */
  const saveSnapshot = useCallback(
    (scores: Record<SkillCategory, number>): SkillMonthlySnapshot => {
      const month = currentYearMonth();
      const snapshot: SkillMonthlySnapshot = {
        month,
        scores,
        avgScore: calcAvgScore(scores),
        recordedAt: new Date().toISOString(),
      };

      const current = loadFromStorage<SkillEvolutionData>(storageKey(groupId, userId), { snapshots: [] });

      // 같은 달 스냅샷이 이미 있으면 교체, 없으면 추가
      const filtered = current.snapshots.filter((s) => s.month !== month);
      const updated: SkillEvolutionData = {
        snapshots: [snapshot, ...filtered]
          .sort((a, b) => b.month.localeCompare(a.month))
          .slice(0, MAX_SNAPSHOTS),
      };

      saveToStorage(storageKey(groupId, userId), updated);
      mutate(updated);

      return snapshot;
    },
    [groupId, userId, mutate]
  );

  return {
    data,
    latest,
    previous,
    monthlyAvgTrend,
    categoryGrowth,
    currentAvg,
    avgChange,
    loading: isLoading,
    saveSnapshot,
    refetch: () => mutate(),
  };
}
