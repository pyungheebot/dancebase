"use client";

import { useState, useCallback, useEffect } from "react";
import type { VideoCategory, VideoLibraryItem, VideoLibraryStore } from "@/types";

const MAX_VIDEOS = 50;

// ============================================
// localStorage 키
// ============================================

function getStorageKey(groupId: string, projectId: string): string {
  return `dancebase:video-lib:${groupId}:${projectId}`;
}

// ============================================
// localStorage 헬퍼
// ============================================

function loadStore(groupId: string, projectId: string): VideoLibraryStore {
  if (typeof window === "undefined") {
    return { items: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(getStorageKey(groupId, projectId));
    if (!raw) return { items: [], updatedAt: new Date().toISOString() };
    return JSON.parse(raw) as VideoLibraryStore;
  } catch {
    return { items: [], updatedAt: new Date().toISOString() };
  }
}

function saveStore(groupId: string, projectId: string, store: VideoLibraryStore): void {
  localStorage.setItem(getStorageKey(groupId, projectId), JSON.stringify(store));
}

// ============================================
// URL 유효성 기본 검사
// ============================================

export function isValidVideoUrl(url: string): boolean {
  const trimmed = url.trim();
  return trimmed.startsWith("https://");
}

// ============================================
// 훅
// ============================================

export function useVideoLibrary(groupId: string, projectId: string) {
  const [store, setStore] = useState<VideoLibraryStore>(() =>
    loadStore(groupId, projectId)
  );

  // groupId / projectId가 변경되면 재로드
  useEffect(() => {
    setStore(loadStore(groupId, projectId));
  }, [groupId, projectId]);

  // 상태 업데이트 + localStorage 동기화
  const updateStore = useCallback(
    (updater: (prev: VideoLibraryStore) => VideoLibraryStore) => {
      setStore((prev) => {
        const next = updater(prev);
        saveStore(groupId, projectId, next);
        return next;
      });
    },
    [groupId, projectId]
  );

  // 영상 추가
  const addVideo = useCallback(
    (videoData: Omit<VideoLibraryItem, "id" | "createdAt">): boolean => {
      if (!isValidVideoUrl(videoData.url)) return false;
      let added = false;
      updateStore((prev) => {
        if (prev.items.length >= MAX_VIDEOS) return prev;
        const newItem: VideoLibraryItem = {
          ...videoData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
        added = true;
        return {
          items: [...prev.items, newItem],
          updatedAt: new Date().toISOString(),
        };
      });
      return added;
    },
    [updateStore]
  );

  // 영상 삭제
  const deleteVideo = useCallback(
    (videoId: string) => {
      updateStore((prev) => ({
        items: prev.items.filter((v) => v.id !== videoId),
        updatedAt: new Date().toISOString(),
      }));
    },
    [updateStore]
  );

  // 영상 수정
  const updateVideo = useCallback(
    (videoId: string, updates: Partial<Omit<VideoLibraryItem, "id" | "createdAt">>) => {
      if (updates.url !== undefined && !isValidVideoUrl(updates.url)) return false;
      updateStore((prev) => ({
        items: prev.items.map((v) =>
          v.id === videoId ? { ...v, ...updates } : v
        ),
        updatedAt: new Date().toISOString(),
      }));
      return true;
    },
    [updateStore]
  );

  // 카테고리별 필터
  const getVideosByCategory = useCallback(
    (category: VideoCategory | "all"): VideoLibraryItem[] => {
      if (category === "all") return store.items;
      return store.items.filter((v) => v.category === category);
    },
    [store.items]
  );

  return {
    items: store.items,
    itemCount: store.items.length,
    maxVideos: MAX_VIDEOS,
    addVideo,
    deleteVideo,
    updateVideo,
    getVideosByCategory,
  };
}
