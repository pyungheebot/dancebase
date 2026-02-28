"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  PostShowReportData,
  PostShowReportEntry,
  PostShowReportSection,
  PostShowReportSectionScore,
} from "@/types";

// ============================================================
// 기본 섹션 점수 초기값
// ============================================================

export const POST_SHOW_SECTIONS: PostShowReportSection[] = [
  "choreography",
  "staging",
  "sound",
  "lighting",
  "costume",
  "audience_reaction",
];

export function makeDefaultSectionScores(): PostShowReportSectionScore[] {
  return POST_SHOW_SECTIONS.map((section) => ({
    section,
    score: 3,
    comment: "",
  }));
}

// ============================================================
// localStorage 유틸
// ============================================================

function storageKey(groupId: string, projectId: string): string {
  return `dancebase:post-show-report:${groupId}:${projectId}`;
}

function loadData(groupId: string, projectId: string): PostShowReportData {
  if (typeof window === "undefined") {
    return { groupId, projectId, entries: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(storageKey(groupId, projectId));
    if (!raw) {
      return { groupId, projectId, entries: [], updatedAt: new Date().toISOString() };
    }
    return JSON.parse(raw) as PostShowReportData;
  } catch {
    return { groupId, projectId, entries: [], updatedAt: new Date().toISOString() };
  }
}

function saveData(data: PostShowReportData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(data.groupId, data.projectId), JSON.stringify(data));
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

// ============================================================
// 훅
// ============================================================

export function usePostShowReport(groupId: string, projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.postShowReport(groupId, projectId),
    () => loadData(groupId, projectId),
    {
      fallbackData: {
        groupId,
        projectId,
        entries: [],
        updatedAt: new Date().toISOString(),
      },
    }
  );

  const entries: PostShowReportEntry[] = data?.entries ?? [];

  /** 보고서 추가 */
  const addEntry = useCallback(
    (params: {
      title: string;
      performanceDate: string;
      overallReview: string;
      sectionScores: PostShowReportSectionScore[];
      highlights: string[];
      improvements: string[];
      nextSuggestions: string[];
      audienceCount?: number;
      revenue?: number;
      author: string;
      notes?: string;
    }): PostShowReportEntry => {
      const current = loadData(groupId, projectId);
      const now = new Date().toISOString();
      const newEntry: PostShowReportEntry = {
        id: crypto.randomUUID(),
        title: params.title.trim(),
        performanceDate: params.performanceDate,
        overallReview: params.overallReview.trim(),
        sectionScores: params.sectionScores,
        highlights: params.highlights.filter((h) => h.trim() !== ""),
        improvements: params.improvements.filter((i) => i.trim() !== ""),
        nextSuggestions: params.nextSuggestions.filter((s) => s.trim() !== ""),
        audienceCount: params.audienceCount,
        revenue: params.revenue,
        author: params.author.trim(),
        notes: params.notes?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };
      const updated: PostShowReportData = {
        ...current,
        entries: [newEntry, ...current.entries],
        updatedAt: now,
      };
      saveData(updated);
      mutate(updated, false);
      return newEntry;
    },
    [groupId, projectId, mutate]
  );

  /** 보고서 수정 */
  const updateEntry = useCallback(
    (
      entryId: string,
      params: Partial<{
        title: string;
        performanceDate: string;
        overallReview: string;
        sectionScores: PostShowReportSectionScore[];
        highlights: string[];
        improvements: string[];
        nextSuggestions: string[];
        audienceCount: number;
        revenue: number;
        author: string;
        notes: string;
      }>
    ): boolean => {
      const current = loadData(groupId, projectId);
      const idx = current.entries.findIndex((e) => e.id === entryId);
      if (idx === -1) return false;

      const existing = current.entries[idx];
      const updatedEntry: PostShowReportEntry = {
        ...existing,
        ...(params.title !== undefined && { title: params.title.trim() }),
        ...(params.performanceDate !== undefined && { performanceDate: params.performanceDate }),
        ...(params.overallReview !== undefined && { overallReview: params.overallReview.trim() }),
        ...(params.sectionScores !== undefined && { sectionScores: params.sectionScores }),
        ...(params.highlights !== undefined && {
          highlights: params.highlights.filter((h) => h.trim() !== ""),
        }),
        ...(params.improvements !== undefined && {
          improvements: params.improvements.filter((i) => i.trim() !== ""),
        }),
        ...(params.nextSuggestions !== undefined && {
          nextSuggestions: params.nextSuggestions.filter((s) => s.trim() !== ""),
        }),
        ...(params.audienceCount !== undefined && { audienceCount: params.audienceCount }),
        ...(params.revenue !== undefined && { revenue: params.revenue }),
        ...(params.author !== undefined && { author: params.author.trim() }),
        notes:
          params.notes !== undefined
            ? params.notes.trim() || undefined
            : existing.notes,
        updatedAt: new Date().toISOString(),
      };

      const updated: PostShowReportData = {
        ...current,
        entries: current.entries.map((e) => (e.id === entryId ? updatedEntry : e)),
        updatedAt: new Date().toISOString(),
      };
      saveData(updated);
      mutate(updated, false);
      return true;
    },
    [groupId, projectId, mutate]
  );

  /** 보고서 삭제 */
  const deleteEntry = useCallback(
    (entryId: string): boolean => {
      const current = loadData(groupId, projectId);
      const exists = current.entries.some((e) => e.id === entryId);
      if (!exists) return false;

      const updated: PostShowReportData = {
        ...current,
        entries: current.entries.filter((e) => e.id !== entryId),
        updatedAt: new Date().toISOString(),
      };
      saveData(updated);
      mutate(updated, false);
      return true;
    },
    [groupId, projectId, mutate]
  );

  /** 종합 통계 */
  const stats = (() => {
    const totalReports = entries.length;
    const totalAudience = entries.reduce((sum, e) => sum + (e.audienceCount ?? 0), 0);
    const totalRevenue = entries.reduce((sum, e) => sum + (e.revenue ?? 0), 0);

    // 섹션별 평균 점수
    const sectionAvgMap: Partial<Record<PostShowReportSection, number>> = {};
    for (const section of POST_SHOW_SECTIONS) {
      const scores = entries
        .map((e) => e.sectionScores.find((s) => s.section === section)?.score)
        .filter((s): s is number => s !== undefined);
      if (scores.length > 0) {
        sectionAvgMap[section] =
          Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
      }
    }

    const avgValues = Object.values(sectionAvgMap).filter((v): v is number => v !== undefined);
    const overallAvg =
      avgValues.length > 0
        ? Math.round((avgValues.reduce((a, b) => a + b, 0) / avgValues.length) * 10) / 10
        : 0;

    return { totalReports, totalAudience, totalRevenue, sectionAvgMap, overallAvg };
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
