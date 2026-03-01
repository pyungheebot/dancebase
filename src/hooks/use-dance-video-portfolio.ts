"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { DanceVideoItem, DanceVideoPortfolioData } from "@/types";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";

// ============================================================
// localStorage 헬퍼
// ============================================================

function makeEmpty(memberId: string): DanceVideoPortfolioData {
  return {
    memberId,
    videos: [],
    updatedAt: new Date().toISOString(),
  };
}

// ============================================================
// 통계 타입
// ============================================================

export type TagCloudItem = {
  tag: string;
  count: number;
  /** 폰트 크기 레벨 (1~5) */
  level: 1 | 2 | 3 | 4 | 5;
};

export type GenreDistributionItem = {
  genre: string;
  count: number;
  percentage: number;
};

export type VideoStats = {
  totalVideos: number;
  featuredCount: number;
  tagCloud: TagCloudItem[];
  genreDistribution: GenreDistributionItem[];
};

// ============================================================
// 통계 계산
// ============================================================

function computeStats(videos: DanceVideoItem[]): VideoStats {
  const totalVideos = videos.length;
  const featuredCount = videos.filter((v) => v.isFeatured).length;

  // 태그 클라우드
  const tagCounter: Record<string, number> = {};
  for (const v of videos) {
    for (const tag of v.tags) {
      tagCounter[tag] = (tagCounter[tag] ?? 0) + 1;
    }
  }
  const tagEntries = Object.entries(tagCounter).sort((a, b) => b[1] - a[1]);
  const maxCount = tagEntries.length > 0 ? tagEntries[0][1] : 1;
  const tagCloud: TagCloudItem[] = tagEntries.map(([tag, count]) => {
    const ratio = count / maxCount;
    const level: 1 | 2 | 3 | 4 | 5 =
      ratio >= 0.8
        ? 5
        : ratio >= 0.6
        ? 4
        : ratio >= 0.4
        ? 3
        : ratio >= 0.2
        ? 2
        : 1;
    return { tag, count, level };
  });

  // 장르 분포
  const genreCounter: Record<string, number> = {};
  for (const v of videos) {
    if (v.genre) {
      genreCounter[v.genre] = (genreCounter[v.genre] ?? 0) + 1;
    }
  }
  const totalWithGenre = Object.values(genreCounter).reduce((s, c) => s + c, 0);
  const genreDistribution: GenreDistributionItem[] = Object.entries(genreCounter)
    .sort((a, b) => b[1] - a[1])
    .map(([genre, count]) => ({
      genre,
      count,
      percentage:
        totalWithGenre > 0 ? Math.round((count / totalWithGenre) * 100) : 0,
    }));

  return { totalVideos, featuredCount, tagCloud, genreDistribution };
}

// ============================================================
// 훅
// ============================================================

const STORAGE_KEY = (id: string) => `dancebase:dance-video-portfolio:${id}`;

export function useDanceVideoPortfolio(memberId: string) {
  const { data, mutate } = useSWR(
    memberId ? swrKeys.danceVideoPortfolio(memberId) : null,
    () => loadFromStorage<DanceVideoPortfolioData>(STORAGE_KEY(memberId), {} as DanceVideoPortfolioData),
    {
      fallbackData: makeEmpty(memberId),
      revalidateOnFocus: false,
    }
  );

  const portfolioData = data ?? makeEmpty(memberId);

  // ──────────────────────────────────────────
  // CRUD
  // ──────────────────────────────────────────

  /** 영상 추가 */
  const addVideo = useCallback(
    (payload: Omit<DanceVideoItem, "id" | "createdAt">) => {
      const newVideo: DanceVideoItem = {
        ...payload,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      const next: DanceVideoPortfolioData = {
        ...portfolioData,
        videos: [newVideo, ...portfolioData.videos],
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(STORAGE_KEY(memberId), next);
      mutate(next, false);
    },
    [portfolioData, memberId, mutate]
  );

  /** 영상 수정 */
  const updateVideo = useCallback(
    (
      videoId: string,
      patch: Partial<Omit<DanceVideoItem, "id" | "createdAt">>
    ) => {
      const next: DanceVideoPortfolioData = {
        ...portfolioData,
        videos: portfolioData.videos.map((v) =>
          v.id === videoId ? { ...v, ...patch } : v
        ),
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(STORAGE_KEY(memberId), next);
      mutate(next, false);
    },
    [portfolioData, memberId, mutate]
  );

  /** 영상 삭제 */
  const deleteVideo = useCallback(
    (videoId: string) => {
      const next: DanceVideoPortfolioData = {
        ...portfolioData,
        videos: portfolioData.videos.filter((v) => v.id !== videoId),
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(STORAGE_KEY(memberId), next);
      mutate(next, false);
    },
    [portfolioData, memberId, mutate]
  );

  /** 대표 영상 토글 */
  const toggleFeatured = useCallback(
    (videoId: string) => {
      const next: DanceVideoPortfolioData = {
        ...portfolioData,
        videos: portfolioData.videos.map((v) =>
          v.id === videoId ? { ...v, isFeatured: !v.isFeatured } : v
        ),
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(STORAGE_KEY(memberId), next);
      mutate(next, false);
    },
    [portfolioData, memberId, mutate]
  );

  // ──────────────────────────────────────────
  // 통계 (파생 데이터)
  // ──────────────────────────────────────────

  const stats = computeStats(portfolioData.videos);

  return {
    portfolioData,
    videos: portfolioData.videos,
    addVideo,
    updateVideo,
    deleteVideo,
    toggleFeatured,
    stats,
    refetch: () => mutate(),
  };
}
