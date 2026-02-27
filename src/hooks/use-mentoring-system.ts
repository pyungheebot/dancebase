"use client";

import { useState, useEffect, useCallback } from "react";
import { swrKeys } from "@/lib/swr/keys";
import type { MentoringPair, MentoringStatus, MentoringFeedback } from "@/types";

// ============================================
// localStorage 헬퍼
// ============================================

function storageKey(groupId: string): string {
  return `dancebase:mentoring:${groupId}`;
}

function loadPairs(groupId: string): MentoringPair[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as MentoringPair[];
  } catch {
    return [];
  }
}

function savePairs(groupId: string, pairs: MentoringPair[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId), JSON.stringify(pairs));
  } catch {
    // 무시
  }
}

// ============================================
// 멘토링 매칭 시스템 훅
// ============================================

export type MentoringStats = {
  activeCount: number;
  completedCount: number;
  pausedCount: number;
  avgRating: number | null;
  totalFeedbacks: number;
};

export function useMentoringSystem(groupId: string) {
  const [pairs, setPairs] = useState<MentoringPair[]>([]);
  const [loading, setLoading] = useState(true);

  // localStorage에서 매칭 불러오기
  const reload = useCallback(() => {
    if (!groupId) return;
    const data = loadPairs(groupId);
    setPairs(data);
    setLoading(false);
  }, [groupId]);

  // 초기 로드
  useEffect(() => {
    reload();
  }, [reload]);

  // SWR 키 (localStorage 기반 갱신 트리거용)
  const _swrKey = swrKeys.mentoringSystem(groupId);
  void _swrKey;

  // 매칭 생성
  const createPair = useCallback(
    (params: {
      mentorId: string;
      mentorName: string;
      menteeId: string;
      menteeName: string;
      goal: string;
      startDate: string;
    }): MentoringPair => {
      const newPair: MentoringPair = {
        id: crypto.randomUUID(),
        mentorId: params.mentorId,
        mentorName: params.mentorName,
        menteeId: params.menteeId,
        menteeName: params.menteeName,
        goal: params.goal,
        status: "active",
        startDate: params.startDate,
        feedbacks: [],
        createdAt: new Date().toISOString(),
      };
      const updated = [...pairs, newPair];
      savePairs(groupId, updated);
      setPairs(updated);
      return newPair;
    },
    [groupId, pairs]
  );

  // 매칭 완료 처리
  const completePair = useCallback(
    (pairId: string) => {
      const updated = pairs.map((p) =>
        p.id === pairId
          ? { ...p, status: "completed" as MentoringStatus, endDate: new Date().toISOString().slice(0, 10) }
          : p
      );
      savePairs(groupId, updated);
      setPairs(updated);
    },
    [groupId, pairs]
  );

  // 매칭 일시정지 처리
  const pausePair = useCallback(
    (pairId: string) => {
      const updated = pairs.map((p) =>
        p.id === pairId ? { ...p, status: "paused" as MentoringStatus } : p
      );
      savePairs(groupId, updated);
      setPairs(updated);
    },
    [groupId, pairs]
  );

  // 매칭 재개 처리
  const resumePair = useCallback(
    (pairId: string) => {
      const updated = pairs.map((p) =>
        p.id === pairId ? { ...p, status: "active" as MentoringStatus } : p
      );
      savePairs(groupId, updated);
      setPairs(updated);
    },
    [groupId, pairs]
  );

  // 매칭 삭제
  const deletePair = useCallback(
    (pairId: string) => {
      const updated = pairs.filter((p) => p.id !== pairId);
      savePairs(groupId, updated);
      setPairs(updated);
    },
    [groupId, pairs]
  );

  // 피드백 추가
  const addFeedback = useCallback(
    (
      pairId: string,
      feedback: Omit<MentoringFeedback, "id">
    ): void => {
      const newFeedback: MentoringFeedback = {
        ...feedback,
        id: crypto.randomUUID(),
      };
      const updated = pairs.map((p) =>
        p.id === pairId
          ? { ...p, feedbacks: [...p.feedbacks, newFeedback] }
          : p
      );
      savePairs(groupId, updated);
      setPairs(updated);
    },
    [groupId, pairs]
  );

  // 통계 계산
  const stats: MentoringStats = {
    activeCount: pairs.filter((p) => p.status === "active").length,
    completedCount: pairs.filter((p) => p.status === "completed").length,
    pausedCount: pairs.filter((p) => p.status === "paused").length,
    avgRating: (() => {
      const allRatings = pairs.flatMap((p) => p.feedbacks.map((f) => f.rating));
      if (allRatings.length === 0) return null;
      return Math.round((allRatings.reduce((a, b) => a + b, 0) / allRatings.length) * 10) / 10;
    })(),
    totalFeedbacks: pairs.reduce((acc, p) => acc + p.feedbacks.length, 0),
  };

  const activePairs = pairs.filter((p) => p.status === "active");
  const completedPairs = pairs.filter((p) => p.status === "completed");
  const pausedPairs = pairs.filter((p) => p.status === "paused");

  return {
    pairs,
    activePairs,
    completedPairs,
    pausedPairs,
    loading,
    stats,
    createPair,
    completePair,
    pausePair,
    resumePair,
    deletePair,
    addFeedback,
    refetch: reload,
  };
}
