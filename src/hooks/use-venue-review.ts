"use client";

import useSWR from "swr";
import { useCallback, useMemo } from "react";
import { swrKeys } from "@/lib/swr/keys";
import type { VenueReviewEntry } from "@/types";

// ─── localStorage 헬퍼 ────────────────────────────────────────

const STORAGE_KEY = (groupId: string) =>
  `dancebase:venue-review:${groupId}`;

function loadReviews(groupId: string): VenueReviewEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as VenueReviewEntry[];
  } catch {
    return [];
  }
}

function saveReviews(groupId: string, reviews: VenueReviewEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY(groupId), JSON.stringify(reviews));
}

// ─── 훅 ──────────────────────────────────────────────────────

export function useVenueReview(groupId: string) {
  const { data, mutate } = useSWR(
    swrKeys.venueReview(groupId),
    () => loadReviews(groupId),
    { fallbackData: [] }
  );

  const reviews: VenueReviewEntry[] = useMemo(() => data ?? [], [data]);

  // ── 저장 헬퍼 ─────────────────────────────────────────────

  const persist = useCallback(
    (next: VenueReviewEntry[]) => {
      saveReviews(groupId, next);
      mutate(next, false);
    },
    [groupId, mutate]
  );

  // ── 리뷰 추가 ─────────────────────────────────────────────

  const addReview = useCallback(
    (
      params: Omit<VenueReviewEntry, "id" | "createdAt">
    ): void => {
      const current = loadReviews(groupId);
      const newEntry: VenueReviewEntry = {
        id: crypto.randomUUID(),
        ...params,
        createdAt: new Date().toISOString(),
      };
      persist([...current, newEntry]);
    },
    [groupId, persist]
  );

  // ── 리뷰 수정 ─────────────────────────────────────────────

  const updateReview = useCallback(
    (id: string, patch: Partial<Omit<VenueReviewEntry, "id" | "createdAt">>): void => {
      const current = loadReviews(groupId);
      persist(
        current.map((r) => (r.id === id ? { ...r, ...patch } : r))
      );
    },
    [groupId, persist]
  );

  // ── 리뷰 삭제 ─────────────────────────────────────────────

  const deleteReview = useCallback(
    (id: string): void => {
      const current = loadReviews(groupId);
      persist(current.filter((r) => r.id !== id));
    },
    [groupId, persist]
  );

  // ── 장소별 리뷰 조회 ──────────────────────────────────────

  const getByVenue = useCallback(
    (venueName: string): VenueReviewEntry[] =>
      reviews.filter(
        (r) => r.venueName.trim().toLowerCase() === venueName.trim().toLowerCase()
      ),
    [reviews]
  );

  // ── 장소별 평균 점수 통계 ─────────────────────────────────

  const getVenueStats = useCallback(
    (venueName: string) => {
      const vr = reviews.filter(
        (r) => r.venueName.trim().toLowerCase() === venueName.trim().toLowerCase()
      );
      if (vr.length === 0) {
        return {
          count: 0,
          avgRating: 0,
          avgFloor: 0,
          avgMirror: 0,
          avgSound: 0,
          avgAccess: 0,
          avgPrice: null as number | null,
        };
      }
      const avg = (arr: number[]) =>
        Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;

      const prices = vr
        .map((r) => r.pricePerHour)
        .filter((p): p is number => typeof p === "number");

      return {
        count: vr.length,
        avgRating: avg(vr.map((r) => r.rating)),
        avgFloor: avg(vr.map((r) => r.floorRating)),
        avgMirror: avg(vr.map((r) => r.mirrorRating)),
        avgSound: avg(vr.map((r) => r.soundRating)),
        avgAccess: avg(vr.map((r) => r.accessRating)),
        avgPrice: prices.length > 0 ? avg(prices) : null,
      };
    },
    [reviews]
  );

  // ── 장소 랭킹 (평균 평점 내림차순) ────────────────────────

  const getVenueRanking = useCallback((): Array<{
    venueName: string;
    avgRating: number;
    count: number;
    avgPrice: number | null;
  }> => {
    const venueMap = new Map<string, VenueReviewEntry[]>();
    reviews.forEach((r) => {
      const key = r.venueName.trim();
      if (!venueMap.has(key)) venueMap.set(key, []);
      venueMap.get(key)!.push(r);
    });

    return Array.from(venueMap.entries())
      .map(([venueName, vr]) => {
        const stats = getVenueStats(venueName);
        return {
          venueName,
          avgRating: stats.avgRating,
          count: vr.length,
          avgPrice: stats.avgPrice,
        };
      })
      .sort((a, b) => b.avgRating - a.avgRating);
  }, [reviews, getVenueStats]);

  // ── 통계 ──────────────────────────────────────────────────

  const totalReviews = reviews.length;

  const uniqueVenues = Array.from(
    new Set(reviews.map((r) => r.venueName.trim()))
  );

  const ranking = getVenueRanking();
  const topRatedVenue = ranking.length > 0 ? ranking[0].venueName : null;

  const allPrices = reviews
    .map((r) => r.pricePerHour)
    .filter((p): p is number => typeof p === "number");
  const averagePrice =
    allPrices.length > 0
      ? Math.round(allPrices.reduce((a, b) => a + b, 0) / allPrices.length)
      : null;

  return {
    reviews,
    addReview,
    updateReview,
    deleteReview,
    getByVenue,
    getVenueStats,
    getVenueRanking,
    // 통계
    totalReviews,
    uniqueVenues,
    topRatedVenue,
    averagePrice,
    refetch: () => mutate(),
  };
}
