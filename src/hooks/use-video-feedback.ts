"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { VideoFeedbackItem, VideoFeedbackTimestamp } from "@/types";

// ============================================
// localStorage 유틸리티
// ============================================

function getStorageKey(groupId: string, projectId: string): string {
  return `dancebase:video-feedback:${groupId}:${projectId}`;
}

function loadData(groupId: string, projectId: string): VideoFeedbackItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId, projectId));
    return raw ? (JSON.parse(raw) as VideoFeedbackItem[]) : [];
  } catch {
    return [];
  }
}

function persistData(
  groupId: string,
  projectId: string,
  data: VideoFeedbackItem[]
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      getStorageKey(groupId, projectId),
      JSON.stringify(data)
    );
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

// ============================================
// 훅
// ============================================

export function useVideoFeedback(groupId: string, projectId: string) {
  const key = swrKeys.videoFeedback(groupId, projectId);

  const { data, mutate } = useSWR<VideoFeedbackItem[]>(key, () =>
    loadData(groupId, projectId)
  );

  const videos: VideoFeedbackItem[] = data ?? [];

  /** 내부 상태 + localStorage 동기 업데이트 */
  const update = useCallback(
    (next: VideoFeedbackItem[]) => {
      persistData(groupId, projectId, next);
      mutate(next, false);
    },
    [groupId, projectId, mutate]
  );

  // ============================================
  // 영상 CRUD
  // ============================================

  /** 영상 추가 */
  const addVideo = useCallback(
    (title: string, videoUrl: string) => {
      const newItem: VideoFeedbackItem = {
        id: crypto.randomUUID(),
        title: title.trim(),
        videoUrl: videoUrl.trim(),
        timestamps: [],
        createdAt: new Date().toISOString(),
      };
      update([...videos, newItem]);
    },
    [videos, update]
  );

  /** 영상 삭제 */
  const deleteVideo = useCallback(
    (videoId: string) => {
      update(videos.filter((v) => v.id !== videoId));
    },
    [videos, update]
  );

  // ============================================
  // 타임스탬프 CRUD
  // ============================================

  /** 타임스탬프 코멘트 추가 */
  const addTimestamp = useCallback(
    (
      videoId: string,
      time: string,
      authorName: string,
      comment: string,
      category: VideoFeedbackTimestamp["category"]
    ) => {
      const newTs: VideoFeedbackTimestamp = {
        id: crypto.randomUUID(),
        time: time.trim(),
        authorName: authorName.trim(),
        comment: comment.trim(),
        category,
        createdAt: new Date().toISOString(),
      };
      const next = videos.map((v) => {
        if (v.id !== videoId) return v;
        return { ...v, timestamps: [...v.timestamps, newTs] };
      });
      update(next);
    },
    [videos, update]
  );

  /** 타임스탬프 코멘트 삭제 */
  const deleteTimestamp = useCallback(
    (videoId: string, timestampId: string) => {
      const next = videos.map((v) => {
        if (v.id !== videoId) return v;
        return {
          ...v,
          timestamps: v.timestamps.filter((ts) => ts.id !== timestampId),
        };
      });
      update(next);
    },
    [videos, update]
  );

  // ============================================
  // 필터
  // ============================================

  /** 카테고리별 타임스탬프 필터 */
  function filterByCategory(
    videoId: string,
    category: VideoFeedbackTimestamp["category"] | null
  ): VideoFeedbackTimestamp[] {
    const video = videos.find((v) => v.id === videoId);
    if (!video) return [];
    const sorted = [...video.timestamps].sort((a, b) => {
      const toSec = (t: string) => {
        const [m, s] = t.split(":").map(Number);
        return (m || 0) * 60 + (s || 0);
      };
      return toSec(a.time) - toSec(b.time);
    });
    if (!category) return sorted;
    return sorted.filter((ts) => ts.category === category);
  }

  // ============================================
  // 통계
  // ============================================

  const totalVideos = videos.length;
  const totalComments = videos.reduce(
    (sum, v) => sum + v.timestamps.length,
    0
  );

  return {
    videos,
    totalVideos,
    totalComments,
    addVideo,
    deleteVideo,
    addTimestamp,
    deleteTimestamp,
    filterByCategory,
    refetch: () => mutate(),
  };
}
