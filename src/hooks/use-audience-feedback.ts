"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  AudienceFeedbackSurvey,
  AudienceFeedbackEntry,
  AudienceFeedbackRating,
} from "@/types";

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(groupId: string, projectId: string): string {
  return `dancebase:audience-feedback:${groupId}:${projectId}`;
}

function loadData(groupId: string, projectId: string): AudienceFeedbackSurvey[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(groupId, projectId));
    if (!raw) return [];
    return JSON.parse(raw) as AudienceFeedbackSurvey[];
  } catch {
    return [];
  }
}

function saveData(
  groupId: string,
  projectId: string,
  data: AudienceFeedbackSurvey[]
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId, projectId), JSON.stringify(data));
  } catch {
    // 무시
  }
}

// ============================================================
// 통계 타입
// ============================================================

export type AudienceFeedbackStats = {
  totalResponses: number;
  averageRatings: AudienceFeedbackRating;
  recommendRate: number; // 0~100 (%)
  ratingDistribution: Record<keyof AudienceFeedbackRating, number[]>; // 각 축별 1~5 분포 [1점수,2점수,3점수,4점수,5점수]
};

function computeStats(entries: AudienceFeedbackEntry[]): AudienceFeedbackStats {
  const total = entries.length;

  if (total === 0) {
    const emptyDist: number[] = [0, 0, 0, 0, 0];
    return {
      totalResponses: 0,
      averageRatings: {
        choreography: 0,
        music: 0,
        costumes: 0,
        stagePresence: 0,
        overall: 0,
      },
      recommendRate: 0,
      ratingDistribution: {
        choreography: [...emptyDist],
        music: [...emptyDist],
        costumes: [...emptyDist],
        stagePresence: [...emptyDist],
        overall: [...emptyDist],
      },
    };
  }

  const axes: (keyof AudienceFeedbackRating)[] = [
    "choreography",
    "music",
    "costumes",
    "stagePresence",
    "overall",
  ];

  const sums: Record<keyof AudienceFeedbackRating, number> = {
    choreography: 0,
    music: 0,
    costumes: 0,
    stagePresence: 0,
    overall: 0,
  };
  const distribution: Record<keyof AudienceFeedbackRating, number[]> = {
    choreography: [0, 0, 0, 0, 0],
    music: [0, 0, 0, 0, 0],
    costumes: [0, 0, 0, 0, 0],
    stagePresence: [0, 0, 0, 0, 0],
    overall: [0, 0, 0, 0, 0],
  };

  let recommendCount = 0;

  for (const entry of entries) {
    if (entry.wouldRecommend) recommendCount++;
    for (const axis of axes) {
      const score = entry.ratings[axis];
      sums[axis] += score;
      const idx = Math.min(Math.max(Math.round(score), 1), 5) - 1;
      distribution[axis][idx]++;
    }
  }

  const averageRatings: AudienceFeedbackRating = {
    choreography: Math.round((sums.choreography / total) * 10) / 10,
    music: Math.round((sums.music / total) * 10) / 10,
    costumes: Math.round((sums.costumes / total) * 10) / 10,
    stagePresence: Math.round((sums.stagePresence / total) * 10) / 10,
    overall: Math.round((sums.overall / total) * 10) / 10,
  };

  return {
    totalResponses: total,
    averageRatings,
    recommendRate: Math.round((recommendCount / total) * 100),
    ratingDistribution: distribution,
  };
}

// ============================================================
// 훅
// ============================================================

export function useAudienceFeedback(groupId: string, projectId: string) {
  const [surveys, setSurveys] = useState<AudienceFeedbackSurvey[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    if (!groupId || !projectId) return;
    const data = loadData(groupId, projectId);
    setSurveys(data);
    setLoading(false);
  }, [groupId, projectId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const persist = useCallback(
    (next: AudienceFeedbackSurvey[]) => {
      saveData(groupId, projectId, next);
      setSurveys(next);
    },
    [groupId, projectId]
  );

  // 설문 생성
  const createSurvey = useCallback(
    (title: string): AudienceFeedbackSurvey => {
      const survey: AudienceFeedbackSurvey = {
        id: crypto.randomUUID(),
        projectId,
        title,
        isActive: false,
        entries: [],
        createdAt: new Date().toISOString(),
      };
      persist([...surveys, survey]);
      return survey;
    },
    [surveys, persist, projectId]
  );

  // 설문 삭제
  const deleteSurvey = useCallback(
    (surveyId: string): boolean => {
      const next = surveys.filter((s) => s.id !== surveyId);
      if (next.length === surveys.length) return false;
      persist(next);
      return true;
    },
    [surveys, persist]
  );

  // 설문 활성화 토글
  const toggleActive = useCallback(
    (surveyId: string): boolean => {
      const idx = surveys.findIndex((s) => s.id === surveyId);
      if (idx === -1) return false;
      // 활성화 시 다른 설문 비활성화
      const next = surveys.map((s, i) => ({
        ...s,
        isActive: i === idx ? !s.isActive : false,
      }));
      persist(next);
      return true;
    },
    [surveys, persist]
  );

  // 피드백 추가
  const addFeedback = useCallback(
    (
      surveyId: string,
      entry: Omit<AudienceFeedbackEntry, "id" | "submittedAt">
    ): boolean => {
      const idx = surveys.findIndex((s) => s.id === surveyId);
      if (idx === -1) return false;

      const newEntry: AudienceFeedbackEntry = {
        ...entry,
        id: crypto.randomUUID(),
        submittedAt: new Date().toISOString(),
      };

      const next = [...surveys];
      next[idx] = {
        ...next[idx],
        entries: [...next[idx].entries, newEntry],
      };
      persist(next);
      return true;
    },
    [surveys, persist]
  );

  // 피드백 삭제
  const deleteFeedback = useCallback(
    (surveyId: string, entryId: string): boolean => {
      const idx = surveys.findIndex((s) => s.id === surveyId);
      if (idx === -1) return false;

      const filtered = surveys[idx].entries.filter((e) => e.id !== entryId);
      if (filtered.length === surveys[idx].entries.length) return false;

      const next = [...surveys];
      next[idx] = { ...next[idx], entries: filtered };
      persist(next);
      return true;
    },
    [surveys, persist]
  );

  // 설문별 통계 계산
  const getStats = useCallback(
    (surveyId: string): AudienceFeedbackStats => {
      const survey = surveys.find((s) => s.id === surveyId);
      if (!survey) return computeStats([]);
      return computeStats(survey.entries);
    },
    [surveys]
  );

  // 전체 통계 (모든 설문 엔트리 합산)
  const allEntries = surveys.flatMap((s) => s.entries);
  const totalStats = computeStats(allEntries);

  return {
    surveys,
    loading,
    createSurvey,
    deleteSurvey,
    toggleActive,
    addFeedback,
    deleteFeedback,
    getStats,
    totalStats,
    refetch: reload,
  };
}
