"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  SkillCategory,
  SkillEvaluation,
  SkillEvaluationHistory,
} from "@/types";
import { SKILL_CATEGORIES } from "@/types";

// ============================================
// 상수
// ============================================

/** localStorage에 보관할 평가 이력 최대 개수 */
const MAX_EVALUATIONS = 12;

// ============================================
// localStorage 헬퍼
// ============================================

function storageKey(groupId: string, userId: string): string {
  return `dancebase:skill-eval:${groupId}:${userId}`;
}

function loadHistory(groupId: string, userId: string): SkillEvaluationHistory {
  if (typeof window === "undefined") return { evaluations: [] };
  try {
    const raw = localStorage.getItem(storageKey(groupId, userId));
    if (!raw) return { evaluations: [] };
    return JSON.parse(raw) as SkillEvaluationHistory;
  } catch {
    return { evaluations: [] };
  }
}

function saveHistory(
  groupId: string,
  userId: string,
  history: SkillEvaluationHistory
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId, userId), JSON.stringify(history));
  } catch {
    // 무시
  }
}

// ============================================
// 유틸
// ============================================

/** 기본 점수 객체 (모든 카테고리 3점) */
function defaultScores(): Record<SkillCategory, number> {
  return Object.fromEntries(
    SKILL_CATEGORIES.map((cat) => [cat, 3])
  ) as Record<SkillCategory, number>;
}

/** 총점 계산 */
function calcTotalScore(scores: Record<SkillCategory, number>): number {
  return SKILL_CATEGORIES.reduce((sum, cat) => sum + (scores[cat] ?? 1), 0);
}

// ============================================
// 훅 반환 타입
// ============================================

export type SkillSelfEvaluationReturn = {
  /** 평가 이력 전체 (최신순) */
  history: SkillEvaluationHistory;
  /** 최신 평가 (없으면 null) */
  latest: SkillEvaluation | null;
  /** 이전 평가 (최신보다 하나 앞, 없으면 null) */
  previous: SkillEvaluation | null;
  /** 카테고리별 점수 변화량 (최신 - 이전, 이전 없으면 null) */
  scoreChanges: Record<SkillCategory, number | null>;
  loading: boolean;
  /** 새 평가 저장 */
  saveEvaluation: (scores: Record<SkillCategory, number>) => SkillEvaluation;
  /** SWR 재검증 */
  refetch: () => void;
};

// ============================================
// 훅
// ============================================

export function useSkillSelfEvaluation(
  groupId: string,
  userId: string
): SkillSelfEvaluationReturn {
  const { data, isLoading, mutate } = useSWR(
    groupId && userId
      ? swrKeys.skillSelfEvaluation(groupId, userId)
      : null,
    () => loadHistory(groupId, userId)
  );

  const history: SkillEvaluationHistory = data ?? { evaluations: [] };

  // 최신순 정렬 (evaluatedAt 내림차순)
  const sorted = [...history.evaluations].sort(
    (a, b) =>
      new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime()
  );

  const latest = sorted[0] ?? null;
  const previous = sorted[1] ?? null;

  // 카테고리별 변화량 계산
  const scoreChanges: Record<SkillCategory, number | null> =
    Object.fromEntries(
      SKILL_CATEGORIES.map((cat) => [
        cat,
        latest && previous
          ? (latest.scores[cat] ?? 0) - (previous.scores[cat] ?? 0)
          : null,
      ])
    ) as Record<SkillCategory, number | null>;

  /** 새 평가 저장 */
  const saveEvaluation = useCallback(
    (scores: Record<SkillCategory, number>): SkillEvaluation => {
      const newEvaluation: SkillEvaluation = {
        id: crypto.randomUUID(),
        scores,
        totalScore: calcTotalScore(scores),
        evaluatedAt: new Date().toISOString(),
      };

      const current = loadHistory(groupId, userId);
      // 최신순 유지, 최대 MAX_EVALUATIONS 개 보관
      const updatedEvaluations = [newEvaluation, ...current.evaluations].slice(
        0,
        MAX_EVALUATIONS
      );
      const updated: SkillEvaluationHistory = {
        evaluations: updatedEvaluations,
      };

      saveHistory(groupId, userId, updated);
      mutate(updated);

      return newEvaluation;
    },
    [groupId, userId, mutate]
  );

  return {
    history,
    latest,
    previous,
    scoreChanges,
    loading: isLoading,
    saveEvaluation,
    refetch: () => mutate(),
  };
}

// 기본 점수 내보내기 (컴포넌트에서 초기값으로 활용)
export { defaultScores };
