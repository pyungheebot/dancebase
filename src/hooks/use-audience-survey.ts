"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  AudienceSurveyData,
  AudienceSurveyEntry,
  AudienceSurveyQuestion,
  AudienceSurveyQuestionStat,
} from "@/types";

// ============================================
// localStorage 유틸
// ============================================

function storageKey(groupId: string, projectId: string): string {
  return `dancebase:audience-survey:${groupId}:${projectId}`;
}

// ============================================
// 훅
// ============================================

export function useAudienceSurvey(groupId: string, projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.audienceSurvey(groupId, projectId),
    () => loadFromStorage<AudienceSurveyData>(storageKey(groupId, projectId), {} as AudienceSurveyData),
    {
      fallbackData: {
        groupId,
        projectId,
        entries: [],
        updatedAt: new Date().toISOString(),
      },
    }
  );

  const entries: AudienceSurveyEntry[] = data?.entries ?? [];

  /** 설문 엔트리 추가 */
  const addEntry = useCallback(
    (params: {
      title: string;
      date: string;
      responseCount: number;
      questionStats: AudienceSurveyQuestionStat[];
      freeComments: string[];
      notes?: string;
    }): AudienceSurveyEntry => {
      const current = loadFromStorage<AudienceSurveyData>(storageKey(groupId, projectId), {} as AudienceSurveyData);
      const now = new Date().toISOString();
      const newEntry: AudienceSurveyEntry = {
        id: crypto.randomUUID(),
        title: params.title.trim(),
        date: params.date,
        responseCount: params.responseCount,
        questionStats: params.questionStats,
        freeComments: params.freeComments.filter((c) => c.trim() !== ""),
        notes: params.notes?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };
      const updated: AudienceSurveyData = {
        ...current,
        entries: [newEntry, ...current.entries],
        updatedAt: now,
      };
      saveToStorage(storageKey(groupId, projectId), updated);
      mutate(updated, false);
      return newEntry;
    },
    [groupId, projectId, mutate]
  );

  /** 설문 엔트리 수정 */
  const updateEntry = useCallback(
    (
      entryId: string,
      params: Partial<{
        title: string;
        date: string;
        responseCount: number;
        questionStats: AudienceSurveyQuestionStat[];
        freeComments: string[];
        notes: string;
      }>
    ): boolean => {
      const current = loadFromStorage<AudienceSurveyData>(storageKey(groupId, projectId), {} as AudienceSurveyData);
      const idx = current.entries.findIndex((e) => e.id === entryId);
      if (idx === -1) return false;

      const existing = current.entries[idx];
      const updatedEntry: AudienceSurveyEntry = {
        ...existing,
        ...(params.title !== undefined && { title: params.title.trim() }),
        ...(params.date !== undefined && { date: params.date }),
        ...(params.responseCount !== undefined && {
          responseCount: params.responseCount,
        }),
        ...(params.questionStats !== undefined && {
          questionStats: params.questionStats,
        }),
        ...(params.freeComments !== undefined && {
          freeComments: params.freeComments.filter((c) => c.trim() !== ""),
        }),
        notes:
          params.notes !== undefined
            ? params.notes.trim() || undefined
            : existing.notes,
        updatedAt: new Date().toISOString(),
      };

      const updated: AudienceSurveyData = {
        ...current,
        entries: current.entries.map((e) =>
          e.id === entryId ? updatedEntry : e
        ),
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(storageKey(groupId, projectId), updated);
      mutate(updated, false);
      return true;
    },
    [groupId, projectId, mutate]
  );

  /** 설문 엔트리 삭제 */
  const deleteEntry = useCallback(
    (entryId: string): boolean => {
      const current = loadFromStorage<AudienceSurveyData>(storageKey(groupId, projectId), {} as AudienceSurveyData);
      const exists = current.entries.some((e) => e.id === entryId);
      if (!exists) return false;

      const updated: AudienceSurveyData = {
        ...current,
        entries: current.entries.filter((e) => e.id !== entryId),
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(storageKey(groupId, projectId), updated);
      mutate(updated, false);
      return true;
    },
    [groupId, projectId, mutate]
  );

  /** 전체 통계 */
  const stats = (() => {
    const totalEntries = entries.length;
    const totalResponses = entries.reduce((sum, e) => sum + e.responseCount, 0);

    // 항목별 가중 평균 (응답 수 기준)
    const questionAvgMap: Partial<Record<AudienceSurveyQuestion, number>> = {};
    const questions: AudienceSurveyQuestion[] = [
      "overall",
      "stage",
      "choreography",
      "music",
      "costume",
      "revisit",
    ];

    for (const q of questions) {
      let weightedSum = 0;
      let totalCount = 0;
      for (const entry of entries) {
        const stat = entry.questionStats.find((s) => s.question === q);
        if (stat) {
          weightedSum += stat.avg * stat.count;
          totalCount += stat.count;
        }
      }
      if (totalCount > 0) {
        questionAvgMap[q] = Math.round((weightedSum / totalCount) * 10) / 10;
      }
    }

    const overallAvg =
      questionAvgMap["overall"] ??
      (totalEntries > 0
        ? Math.round(
            (Object.values(questionAvgMap).reduce(
              (a, b) => a + (b ?? 0),
              0
            ) /
              Object.values(questionAvgMap).filter((v) => v !== undefined)
                .length) *
              10
          ) / 10
        : 0);

    return { totalEntries, totalResponses, questionAvgMap, overallAvg };
  })();

  return {
    entries,
    loading: isLoading,
    refetch: () => mutate(),
    addEntry,
    updateEntry,
    deleteEntry,
    stats,
  };
}
