"use client";

import { useCallback, useState } from "react";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  DanceClassReview,
  DanceClassReviewData,
  DanceClassDifficulty,
} from "@/types";

// ============================================================
// 상수
// ============================================================

export const DIFFICULTY_LABELS: Record<DanceClassDifficulty, string> = {
  beginner: "입문",
  intermediate: "중급",
  advanced: "고급",
};

export const DIFFICULTY_ORDER: DanceClassDifficulty[] = [
  "beginner",
  "intermediate",
  "advanced",
];

export const DIFFICULTY_COLORS: Record<
  DanceClassDifficulty,
  { badge: string; text: string; bar: string }
> = {
  beginner: {
    badge: "bg-green-100 text-green-700 border-green-300",
    text: "text-green-600",
    bar: "bg-green-500",
  },
  intermediate: {
    badge: "bg-blue-100 text-blue-700 border-blue-300",
    text: "text-blue-600",
    bar: "bg-blue-500",
  },
  advanced: {
    badge: "bg-purple-100 text-purple-700 border-purple-300",
    text: "text-purple-600",
    bar: "bg-purple-500",
  },
};

export const SUGGESTED_GENRES = [
  "힙합",
  "팝핀",
  "왁킹",
  "하우스",
  "락킹",
  "크럼프",
  "브레이킹",
  "보깅",
  "재즈",
  "케이팝",
  "컨템포러리",
  "라틴",
  "살사",
];

// ============================================================
// localStorage 헬퍼
// ============================================================

function getStorageKey(memberId: string): string {
  return swrKeys.danceClassReview(memberId);
}

// ============================================================
// 훅
// ============================================================

export function useDanceClassReview(memberId: string) {
  const [reviews, setReviews] = useState<DanceClassReview[]>(() => loadFromStorage<DanceClassReviewData>(getStorageKey(memberId), {} as DanceClassReviewData).reviews);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    if (!memberId) {
      setLoading(false);
      return;
    }
    const data = loadFromStorage<DanceClassReviewData>(getStorageKey(memberId), {} as DanceClassReviewData);
    setReviews(data.reviews);
  }, [memberId]);

  // 내부 persist 헬퍼
  const persist = useCallback(
    (nextReviews: DanceClassReview[]) => {
      const data: DanceClassReviewData = {
        memberId,
        reviews: nextReviews,
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(getStorageKey(memberId), data);
      setReviews(nextReviews);
    },
    [memberId]
  );

  // ────────────────────────────────────────────
  // CRUD
  // ────────────────────────────────────────────

  /** 리뷰 추가 */
  const addReview = useCallback(
    (params: {
      className: string;
      instructorName: string | null;
      date: string;
      rating: number;
      difficulty: DanceClassDifficulty;
      genre: string | null;
      takeaways: string;
      wouldRepeat: boolean;
      cost: number | null;
    }): DanceClassReview => {
      const newReview: DanceClassReview = {
        id: crypto.randomUUID(),
        className: params.className.trim(),
        instructorName: params.instructorName?.trim() || null,
        date: params.date,
        rating: params.rating,
        difficulty: params.difficulty,
        genre: params.genre?.trim() || null,
        takeaways: params.takeaways.trim(),
        wouldRepeat: params.wouldRepeat,
        cost: params.cost,
        createdAt: new Date().toISOString(),
      };
      persist([newReview, ...reviews]);
      return newReview;
    },
    [reviews, persist]
  );

  /** 리뷰 수정 */
  const updateReview = useCallback(
    (
      reviewId: string,
      patch: Partial<
        Pick<
          DanceClassReview,
          | "className"
          | "instructorName"
          | "date"
          | "rating"
          | "difficulty"
          | "genre"
          | "takeaways"
          | "wouldRepeat"
          | "cost"
        >
      >
    ): void => {
      const next = reviews.map((r) =>
        r.id === reviewId ? { ...r, ...patch } : r
      );
      persist(next);
    },
    [reviews, persist]
  );

  /** 리뷰 삭제 */
  const deleteReview = useCallback(
    (reviewId: string): void => {
      persist(reviews.filter((r) => r.id !== reviewId));
    },
    [reviews, persist]
  );

  // ────────────────────────────────────────────
  // 통계
  // ────────────────────────────────────────────

  /** 총 리뷰 수 */
  const totalReviews = reviews.length;

  /** 평균 별점 (소수점 한 자리) */
  const averageRating =
    reviews.length === 0
      ? 0
      : Math.round(
          (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10
        ) / 10;

  /** 난이도별 분포 */
  const difficultyDistribution = DIFFICULTY_ORDER.reduce<
    Record<DanceClassDifficulty, number>
  >(
    (acc, d) => {
      acc[d] = reviews.filter((r) => r.difficulty === d).length;
      return acc;
    },
    {} as Record<DanceClassDifficulty, number>
  );

  /** 상위 강사 목록 (리뷰 수 기준 내림차순, 최대 5명) */
  const topInstructors = (() => {
    const map: Record<string, { name: string; count: number; totalRating: number }> = {};
    reviews.forEach((r) => {
      if (!r.instructorName) return;
      if (!map[r.instructorName]) {
        map[r.instructorName] = { name: r.instructorName, count: 0, totalRating: 0 };
      }
      map[r.instructorName].count += 1;
      map[r.instructorName].totalRating += r.rating;
    });
    return Object.values(map)
      .sort((a, b) => b.count - a.count || b.totalRating - a.totalRating)
      .slice(0, 5)
      .map((item) => ({
        name: item.name,
        count: item.count,
        avgRating: Math.round((item.totalRating / item.count) * 10) / 10,
      }));
  })();

  /** 장르별 분포 (등록된 리뷰 기준) */
  const genreDistribution = (() => {
    const map: Record<string, number> = {};
    reviews.forEach((r) => {
      if (!r.genre) return;
      map[r.genre] = (map[r.genre] ?? 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([genre, count]) => ({ genre, count }));
  })();

  /** 재수강 의향 있는 리뷰 수 */
  const wouldRepeatCount = reviews.filter((r) => r.wouldRepeat).length;

  /** 장르 목록 (중복 제거) */
  const genres = Array.from(
    new Set(reviews.map((r) => r.genre).filter(Boolean))
  ) as string[];

  return {
    reviews,
    loading,
    // 통계
    totalReviews,
    averageRating,
    difficultyDistribution,
    topInstructors,
    genreDistribution,
    wouldRepeatCount,
    genres,
    // CRUD
    addReview,
    updateReview,
    deleteReview,
    refetch: reload,
  };
}
