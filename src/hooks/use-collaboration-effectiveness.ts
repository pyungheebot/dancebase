"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { CollabDimension, CollabEvaluation, CollabSummary } from "@/types";

// ============================================
// 상수
// ============================================

export const COLLAB_DIMENSIONS: CollabDimension[] = [
  "communication",
  "punctuality",
  "contribution",
  "attitude",
  "skillSharing",
];

export const COLLAB_DIMENSION_LABEL: Record<CollabDimension, string> = {
  communication: "소통",
  punctuality: "시간 준수",
  contribution: "기여도",
  attitude: "태도",
  skillSharing: "기술 공유",
};

export const COLLAB_DIMENSION_ICON: Record<CollabDimension, string> = {
  communication: "MessageCircle",
  punctuality: "Clock",
  contribution: "TrendingUp",
  attitude: "Heart",
  skillSharing: "Share2",
};

// ============================================
// localStorage 헬퍼
// ============================================

function storageKey(groupId: string): string {
  return `dancebase:collab-eval:${groupId}`;
}

function loadEvaluations(groupId: string): CollabEvaluation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as CollabEvaluation[];
  } catch {
    return [];
  }
}

function saveEvaluations(groupId: string, evals: CollabEvaluation[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId), JSON.stringify(evals));
  } catch {
    // 무시
  }
}

// ============================================
// 유틸
// ============================================

function calcOverallScore(scores: Record<CollabDimension, number>): number {
  const total = COLLAB_DIMENSIONS.reduce((sum, dim) => sum + (scores[dim] ?? 0), 0);
  return Math.round((total / COLLAB_DIMENSIONS.length) * 10) / 10;
}

function calcAverageScores(
  evals: CollabEvaluation[]
): Record<CollabDimension, number> {
  if (evals.length === 0) {
    return Object.fromEntries(
      COLLAB_DIMENSIONS.map((d) => [d, 0])
    ) as Record<CollabDimension, number>;
  }
  return Object.fromEntries(
    COLLAB_DIMENSIONS.map((dim) => {
      const avg =
        evals.reduce((sum, e) => sum + (e.scores[dim] ?? 0), 0) / evals.length;
      return [dim, Math.round(avg * 10) / 10];
    })
  ) as Record<CollabDimension, number>;
}

// ============================================
// 훅 반환 타입
// ============================================

export type CollaborationEffectivenessReturn = {
  /** 전체 평가 목록 */
  evaluations: CollabEvaluation[];
  /** 멤버별 종합 요약 (overallScore 내림차순) */
  summaries: CollabSummary[];
  /** 내가 받은 평가 목록 */
  getReceivedEvaluations: (targetId: string) => CollabEvaluation[];
  /** 특정 멤버의 요약 */
  getMemberSummary: (targetId: string) => CollabSummary | null;
  /** 평가 추가 (같은 evaluator→target 조합은 최신으로 덮어씀) */
  addEvaluation: (
    params: Omit<CollabEvaluation, "id" | "createdAt">
  ) => CollabEvaluation;
  /** 평가 삭제 */
  deleteEvaluation: (id: string) => void;
  loading: boolean;
  refetch: () => void;
};

// ============================================
// 훅
// ============================================

export function useCollaborationEffectiveness(
  groupId: string
): CollaborationEffectivenessReturn {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.collaborationEffectiveness(groupId) : null,
    () => loadEvaluations(groupId)
  );

  const evaluations: CollabEvaluation[] = useMemo(() => data ?? [], [data]);

  // 멤버별 요약 계산
  const summaries: CollabSummary[] = (() => {
    const byTarget = new Map<string, CollabEvaluation[]>();
    for (const ev of evaluations) {
      const list = byTarget.get(ev.targetId) ?? [];
      list.push(ev);
      byTarget.set(ev.targetId, list);
    }
    const result: CollabSummary[] = [];
    byTarget.forEach((evList, targetId) => {
      const averageScores = calcAverageScores(evList);
      const overallScore = calcOverallScore(averageScores);
      result.push({
        targetId,
        targetName: evList[evList.length - 1].targetName,
        averageScores,
        overallScore,
        evaluationCount: evList.length,
      });
    });
    return result.sort((a, b) => b.overallScore - a.overallScore);
  })();

  const getReceivedEvaluations = useCallback(
    (targetId: string): CollabEvaluation[] =>
      evaluations.filter((e) => e.targetId === targetId),
    [evaluations]
  );

  const getMemberSummary = useCallback(
    (targetId: string): CollabSummary | null =>
      summaries.find((s) => s.targetId === targetId) ?? null,
    [summaries]
  );

  const addEvaluation = useCallback(
    (params: Omit<CollabEvaluation, "id" | "createdAt">): CollabEvaluation => {
      const newEval: CollabEvaluation = {
        ...params,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      const current = loadEvaluations(groupId);
      // 같은 evaluator → target 조합의 기존 평가를 제거하고 최신으로 교체
      const filtered = current.filter(
        (e) =>
          !(e.evaluatorId === params.evaluatorId && e.targetId === params.targetId)
      );
      const updated = [newEval, ...filtered];
      saveEvaluations(groupId, updated);
      mutate(updated);
      return newEval;
    },
    [groupId, mutate]
  );

  const deleteEvaluation = useCallback(
    (id: string): void => {
      const current = loadEvaluations(groupId);
      const updated = current.filter((e) => e.id !== id);
      saveEvaluations(groupId, updated);
      mutate(updated);
    },
    [groupId, mutate]
  );

  return {
    evaluations,
    summaries,
    getReceivedEvaluations,
    getMemberSummary,
    addEvaluation,
    deleteEvaluation,
    loading: isLoading,
    refetch: () => mutate(),
  };
}
