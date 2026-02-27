"use client";

import { useState, useEffect, useCallback } from "react";
import type { VenueEntry, VenueReview, VenueFeature } from "@/types";

const STORAGE_KEY = (groupId: string) => `dancebase:venues:${groupId}`;

// ─── 저장/로드 헬퍼 ─────────────────────────────────────────

type VenueStore = {
  venues: VenueEntry[];
  reviews: VenueReview[];
};

function loadStore(groupId: string): VenueStore {
  if (typeof window === "undefined") return { venues: [], reviews: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY(groupId));
    if (!raw) return { venues: [], reviews: [] };
    return JSON.parse(raw) as VenueStore;
  } catch {
    return { venues: [], reviews: [] };
  }
}

function saveStore(groupId: string, store: VenueStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY(groupId), JSON.stringify(store));
}

// ─── 평균 평점 계산 ────────────────────────────────────────

export function calcAverageRating(reviews: VenueReview[], venueId: string): number {
  const venueReviews = reviews.filter((r) => r.venueId === venueId);
  if (venueReviews.length === 0) return 0;
  const sum = venueReviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / venueReviews.length) * 10) / 10;
}

// ─── 정렬 유형 ────────────────────────────────────────────

export type VenueSortType = "rating" | "price";

// ─── 훅 ──────────────────────────────────────────────────

export function useVenueReview(groupId: string) {
  const [venues, setVenues] = useState<VenueEntry[]>([]);
  const [reviews, setReviews] = useState<VenueReview[]>([]);

  // 초기 로드
  useEffect(() => {
    if (!groupId) return;
    const store = loadStore(groupId);
    setVenues(store.venues);
    setReviews(store.reviews);
  }, [groupId]);

  // 상태 동기화 + 저장
  const persist = useCallback(
    (nextVenues: VenueEntry[], nextReviews: VenueReview[]) => {
      saveStore(groupId, { venues: nextVenues, reviews: nextReviews });
      setVenues(nextVenues);
      setReviews(nextReviews);
    },
    [groupId]
  );

  // ── 장소 추가 ────────────────────────────────────────────

  const addVenue = useCallback(
    (params: Omit<VenueEntry, "id" | "createdAt">): boolean => {
      const store = loadStore(groupId);
      const newVenue: VenueEntry = {
        id: crypto.randomUUID(),
        ...params,
        createdAt: new Date().toISOString(),
      };
      persist([...store.venues, newVenue], store.reviews);
      return true;
    },
    [groupId, persist]
  );

  // ── 장소 삭제 (연결된 리뷰도 함께 삭제) ────────────────────

  const deleteVenue = useCallback(
    (venueId: string) => {
      const store = loadStore(groupId);
      persist(
        store.venues.filter((v) => v.id !== venueId),
        store.reviews.filter((r) => r.venueId !== venueId)
      );
    },
    [groupId, persist]
  );

  // ── 리뷰 추가 ────────────────────────────────────────────

  const addReview = useCallback(
    (params: Omit<VenueReview, "id" | "createdAt">): boolean => {
      const store = loadStore(groupId);
      const newReview: VenueReview = {
        id: crypto.randomUUID(),
        ...params,
        createdAt: new Date().toISOString(),
      };
      persist(store.venues, [...store.reviews, newReview]);
      return true;
    },
    [groupId, persist]
  );

  // ── 리뷰 삭제 ────────────────────────────────────────────

  const deleteReview = useCallback(
    (reviewId: string) => {
      const store = loadStore(groupId);
      persist(store.venues, store.reviews.filter((r) => r.id !== reviewId));
    },
    [groupId, persist]
  );

  // ── 장소별 리뷰 조회 ────────────────────────────────────

  const getVenueReviews = useCallback(
    (venueId: string): VenueReview[] =>
      reviews.filter((r) => r.venueId === venueId),
    [reviews]
  );

  // ── 장소별 평균 평점 ────────────────────────────────────

  const getAverageRating = useCallback(
    (venueId: string): number => calcAverageRating(reviews, venueId),
    [reviews]
  );

  // ── 장소별 리뷰 수 ───────────────────────────────────────

  const getReviewCount = useCallback(
    (venueId: string): number =>
      reviews.filter((r) => r.venueId === venueId).length,
    [reviews]
  );

  // ── 추천 장소 (평균 평점 4.0 이상) ───────────────────────

  const recommendedVenues = venues.filter(
    (v) => calcAverageRating(reviews, v.id) >= 4.0
  );

  // ── 시설 필터링 ──────────────────────────────────────────

  const filterByFeature = useCallback(
    (feature: VenueFeature): VenueEntry[] =>
      venues.filter((v) => v.features.includes(feature)),
    [venues]
  );

  // ── 정렬 ─────────────────────────────────────────────────

  const sortedVenues = useCallback(
    (sort: VenueSortType): VenueEntry[] => {
      const copy = [...venues];
      if (sort === "rating") {
        return copy.sort(
          (a, b) =>
            calcAverageRating(reviews, b.id) -
            calcAverageRating(reviews, a.id)
        );
      }
      // price: 낮은 순
      return copy.sort((a, b) => a.hourlyRate - b.hourlyRate);
    },
    [venues, reviews]
  );

  return {
    venues,
    reviews,
    addVenue,
    deleteVenue,
    addReview,
    deleteReview,
    getVenueReviews,
    getAverageRating,
    getReviewCount,
    recommendedVenues,
    filterByFeature,
    sortedVenues,
  };
}
