"use client";

import { useState, useEffect, useCallback } from "react";
import type { VideoTimestamp } from "@/types";

function getStorageKey(groupId: string): string {
  return `video-timestamps-${groupId}`;
}

function loadAll(groupId: string): VideoTimestamp[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as VideoTimestamp[];
  } catch {
    return [];
  }
}

function saveAll(groupId: string, items: VideoTimestamp[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(groupId), JSON.stringify(items));
  } catch {
    // localStorage 쓰기 실패 무시
  }
}

/**
 * 초 단위 → "M:SS" 또는 "H:MM:SS" 형식으로 포맷
 * 예: 32 → "0:32", 65 → "1:05", 3932 → "1:05:32"
 */
export function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const mm = String(m).padStart(h > 0 ? 2 : 1, "0");
  const ss = String(s).padStart(2, "0");

  if (h > 0) {
    return `${h}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

/**
 * 문자열 → 초 단위 파싱
 * 예: "0:32" → 32, "1:05" → 65, "1:05:32" → 3932
 * 파싱 실패 시 0 반환
 */
export function parseTimestamp(str: string): number {
  const parts = str.trim().split(":").map((p) => parseInt(p, 10));
  if (parts.some((p) => isNaN(p))) return 0;
  if (parts.length === 2) {
    // M:SS
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    // H:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

export function useVideoTimestamps(groupId: string, videoId: string) {
  const [all, setAll] = useState<VideoTimestamp[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setAll(loadAll(groupId));
  }, [groupId]);

  // 특정 videoId 필터 후 시간순 정렬
  const timestamps = all
    .filter((t) => t.videoId === videoId)
    .sort((a, b) => a.seconds - b.seconds);

  const addTimestamp = useCallback(
    (params: {
      videoId: string;
      seconds: number;
      comment: string;
      authorName: string;
      authorId: string;
    }): void => {
      const item: VideoTimestamp = {
        id: crypto.randomUUID(),
        videoId: params.videoId,
        seconds: params.seconds,
        comment: params.comment.trim(),
        authorName: params.authorName,
        authorId: params.authorId,
        createdAt: new Date().toISOString(),
      };
      setAll((prev) => {
        const updated = [...prev, item];
        saveAll(groupId, updated);
        return updated;
      });
    },
    [groupId]
  );

  const deleteTimestamp = useCallback(
    (timestampId: string): void => {
      setAll((prev) => {
        const updated = prev.filter((t) => t.id !== timestampId);
        saveAll(groupId, updated);
        return updated;
      });
    },
    [groupId]
  );

  const updateTimestamp = useCallback(
    (timestampId: string, comment: string): void => {
      setAll((prev) => {
        const updated = prev.map((t) =>
          t.id === timestampId ? { ...t, comment: comment.trim() } : t
        );
        saveAll(groupId, updated);
        return updated;
      });
    },
    [groupId]
  );

  return {
    timestamps,
    loading: !mounted,
    addTimestamp,
    deleteTimestamp,
    updateTimestamp,
    formatTimestamp,
    parseTimestamp,
  };
}
