"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AuthResponse } from "@supabase/supabase-js";
import type { BookmarkItem, BookmarkTargetType } from "@/types";

const MAX_BOOKMARKS = 100;

function getStorageKey(userId: string): string {
  return `dancebase:bookmarks:${userId}`;
}

function loadBookmarks(userId: string): BookmarkItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return [];
    return JSON.parse(raw) as BookmarkItem[];
  } catch {
    return [];
  }
}

function saveBookmarks(userId: string, items: BookmarkItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(userId), JSON.stringify(items));
}

export function useBookmarks() {
  const [userId, setUserId] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);

  // 현재 유저 ID 로드
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then((response: AuthResponse) => {
      const user = response.data.user;
      if (user) {
        setUserId(user.id);
        setBookmarks(loadBookmarks(user.id));
      }
    });
  }, []);

  // 북마크 추가
  const addBookmark = useCallback(
    (item: Omit<BookmarkItem, "id" | "createdAt">) => {
      if (!userId) return;

      setBookmarks((prev) => {
        // 이미 북마크된 경우 중복 추가 방지
        const exists = prev.some(
          (b) => b.targetId === item.targetId && b.targetType === item.targetType
        );
        if (exists) return prev;

        const newItem: BookmarkItem = {
          ...item,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };

        let updated = [newItem, ...prev];

        // 최대 100개 제한: 초과 시 가장 오래된 것 자동 삭제
        if (updated.length > MAX_BOOKMARKS) {
          updated = updated.slice(0, MAX_BOOKMARKS);
        }

        saveBookmarks(userId, updated);
        return updated;
      });
    },
    [userId]
  );

  // 북마크 삭제
  const removeBookmark = useCallback(
    (targetId: string, targetType: BookmarkTargetType) => {
      if (!userId) return;

      setBookmarks((prev) => {
        const updated = prev.filter(
          (b) => !(b.targetId === targetId && b.targetType === targetType)
        );
        saveBookmarks(userId, updated);
        return updated;
      });
    },
    [userId]
  );

  // 북마크 여부 확인
  const isBookmarked = useCallback(
    (targetId: string, targetType: BookmarkTargetType): boolean => {
      return bookmarks.some(
        (b) => b.targetId === targetId && b.targetType === targetType
      );
    },
    [bookmarks]
  );

  // 타입별 필터
  const getBookmarksByType = useCallback(
    (targetType: BookmarkTargetType): BookmarkItem[] => {
      return bookmarks.filter((b) => b.targetType === targetType);
    },
    [bookmarks]
  );

  // 북마크 토글
  const toggleBookmark = useCallback(
    (item: Omit<BookmarkItem, "id" | "createdAt">): boolean => {
      const alreadyBookmarked = bookmarks.some(
        (b) => b.targetId === item.targetId && b.targetType === item.targetType
      );

      if (alreadyBookmarked) {
        removeBookmark(item.targetId, item.targetType);
        return false;
      } else {
        addBookmark(item);
        return true;
      }
    },
    [bookmarks, addBookmark, removeBookmark]
  );

  return {
    bookmarks,
    addBookmark,
    removeBookmark,
    isBookmarked,
    getBookmarksByType,
    toggleBookmark,
  };
}
