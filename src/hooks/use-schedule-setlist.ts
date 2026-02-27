"use client";

import { useState, useCallback } from "react";
import type { SetlistItem } from "@/types";

function getStorageKey(scheduleId: string): string {
  return `schedule-setlist-${scheduleId}`;
}

function loadSetlist(scheduleId: string): SetlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(scheduleId));
    return raw ? (JSON.parse(raw) as SetlistItem[]) : [];
  } catch {
    return [];
  }
}

function persistSetlist(scheduleId: string, items: SetlistItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(scheduleId), JSON.stringify(items));
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

export function useScheduleSetlist(scheduleId: string) {
  const [items, setItems] = useState<SetlistItem[]>(() =>
    loadSetlist(scheduleId)
  );

  /** 내부 상태 + localStorage 동기 업데이트 */
  const updateItems = useCallback(
    (next: SetlistItem[]) => {
      // orderIndex 재정렬
      const reindexed = next.map((item, idx) => ({
        ...item,
        orderIndex: idx,
      }));
      persistSetlist(scheduleId, reindexed);
      setItems(reindexed);
    },
    [scheduleId]
  );

  /** 곡 추가 (이미 추가된 곡이면 추가 안 함) */
  const addSong = useCallback(
    (song: { songId: string; songTitle: string; artist: string | null }) => {
      setItems((prev) => {
        if (prev.some((item) => item.songId === song.songId)) return prev;
        const newItem: SetlistItem = {
          songId: song.songId,
          songTitle: song.songTitle,
          artist: song.artist,
          orderIndex: prev.length,
          plannedMinutes: 10,
        };
        const next = [...prev, newItem];
        persistSetlist(scheduleId, next);
        return next;
      });
    },
    [scheduleId]
  );

  /** 곡 삭제 */
  const removeSong = useCallback(
    (songId: string) => {
      setItems((prev) => {
        const next = prev
          .filter((item) => item.songId !== songId)
          .map((item, idx) => ({ ...item, orderIndex: idx }));
        persistSetlist(scheduleId, next);
        return next;
      });
    },
    [scheduleId]
  );

  /** 위로 이동 */
  const moveUp = useCallback(
    (songId: string) => {
      setItems((prev) => {
        const idx = prev.findIndex((item) => item.songId === songId);
        if (idx <= 0) return prev;
        const next = [...prev];
        [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
        const reindexed = next.map((item, i) => ({ ...item, orderIndex: i }));
        persistSetlist(scheduleId, reindexed);
        return reindexed;
      });
    },
    [scheduleId]
  );

  /** 아래로 이동 */
  const moveDown = useCallback(
    (songId: string) => {
      setItems((prev) => {
        const idx = prev.findIndex((item) => item.songId === songId);
        if (idx < 0 || idx >= prev.length - 1) return prev;
        const next = [...prev];
        [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
        const reindexed = next.map((item, i) => ({ ...item, orderIndex: i }));
        persistSetlist(scheduleId, reindexed);
        return reindexed;
      });
    },
    [scheduleId]
  );

  /** 예상 시간 수정 */
  const updateMinutes = useCallback(
    (songId: string, minutes: number) => {
      setItems((prev) => {
        const next = prev.map((item) =>
          item.songId === songId
            ? { ...item, plannedMinutes: Math.max(1, Math.floor(minutes)) }
            : item
        );
        persistSetlist(scheduleId, next);
        return next;
      });
    },
    [scheduleId]
  );

  /** 전체 삭제 */
  const clearAll = useCallback(() => {
    persistSetlist(scheduleId, []);
    setItems([]);
  }, [scheduleId]);

  /** 합계 시간 (분) */
  const totalMinutes = items.reduce(
    (sum, item) => sum + item.plannedMinutes,
    0
  );

  return {
    items,
    totalMinutes,
    addSong,
    removeSong,
    moveUp,
    moveDown,
    updateMinutes,
    updateItems,
    clearAll,
  };
}
