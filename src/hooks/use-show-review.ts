"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { ShowReviewEntry, ShowReviewSource } from "@/types";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";

// ============================================
// localStorage 키
// ============================================

function storageKey(groupId: string, projectId: string): string {
  return `dancebase:show-review:${groupId}:${projectId}`;
}

// ============================================
// 통계 계산
// ============================================

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

function topFrequency(
  entries: ShowReviewEntry[],
  field: "highlights" | "improvements",
  topN = 5
): { text: string; count: number }[] {
  const freq: Record<string, number> = {};
  for (const entry of entries) {
    for (const item of entry[field]) {
      const trimmed = item.trim();
      if (!trimmed) continue;
      freq[trimmed] = (freq[trimmed] ?? 0) + 1;
    }
  }
  return Object.entries(freq)
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

// ============================================
// 훅
// ============================================

export function useShowReview(groupId: string, projectId: string) {
  const swrKey = swrKeys.showReview(groupId, projectId);

  const { data: reviews = [], mutate } = useSWR(swrKey, () =>
    loadFromStorage<ShowReviewEntry[]>(storageKey(groupId, projectId), [])
  );

  // 리뷰 추가
  const addReview = useCallback(
    (
      reviewerName: string,
      source: ShowReviewSource,
      rating: number,
      choreographyRating: number,
      stagePresenceRating: number,
      teamworkRating: number,
      comment: string,
      highlights: string[],
      improvements: string[]
    ) => {
      const newEntry: ShowReviewEntry = {
        id: crypto.randomUUID(),
        reviewerName: reviewerName.trim(),
        source,
        rating: Math.min(5, Math.max(1, rating)),
        choreographyRating: Math.min(5, Math.max(1, choreographyRating)),
        stagePresenceRating: Math.min(5, Math.max(1, stagePresenceRating)),
        teamworkRating: Math.min(5, Math.max(1, teamworkRating)),
        comment: comment.trim(),
        highlights: highlights.map((h) => h.trim()).filter(Boolean),
        improvements: improvements.map((i) => i.trim()).filter(Boolean),
        createdAt: new Date().toISOString(),
      };

      const updated = [newEntry, ...reviews];
      saveToStorage(storageKey(groupId, projectId), updated);
      mutate(updated, false);
      return true;
    },
    [groupId, projectId, reviews, mutate]
  );

  // 리뷰 삭제
  const deleteReview = useCallback(
    (id: string) => {
      const updated = reviews.filter((r) => r.id !== id);
      saveToStorage(storageKey(groupId, projectId), updated);
      mutate(updated, false);
    },
    [groupId, projectId, reviews, mutate]
  );

  // 출처별 조회
  const getBySource = useCallback(
    (source: ShowReviewSource): ShowReviewEntry[] =>
      reviews.filter((r) => r.source === source),
    [reviews]
  );

  // ============================================
  // 통계
  // ============================================

  const totalReviews = reviews.length;

  const averageRating = avg(reviews.map((r) => r.rating));
  const averageChoreography = avg(reviews.map((r) => r.choreographyRating));
  const averageStagePresence = avg(reviews.map((r) => r.stagePresenceRating));
  const averageTeamwork = avg(reviews.map((r) => r.teamworkRating));

  const sourceDistribution: Record<ShowReviewSource, number> = {
    audience: reviews.filter((r) => r.source === "audience").length,
    member: reviews.filter((r) => r.source === "member").length,
    judge: reviews.filter((r) => r.source === "judge").length,
    instructor: reviews.filter((r) => r.source === "instructor").length,
  };

  const highlightFrequency = topFrequency(reviews, "highlights", 5);
  const improvementFrequency = topFrequency(reviews, "improvements", 5);

  return {
    reviews,
    loading: false,
    // CRUD
    addReview,
    deleteReview,
    getBySource,
    // 통계
    totalReviews,
    averageRating,
    averageChoreography,
    averageStagePresence,
    averageTeamwork,
    sourceDistribution,
    highlightFrequency,
    improvementFrequency,
  };
}
