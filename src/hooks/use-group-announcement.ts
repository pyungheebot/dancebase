"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { GroupAnnouncementEntry, AnnouncementPriority } from "@/types";

// ─── localStorage 키 ──────────────────────────────────────────
const STORAGE_KEY = (groupId: string) =>
  `dancebase:announcement:${groupId}`;

// ─── localStorage 헬퍼 ────────────────────────────────────────
function loadAnnouncements(groupId: string): GroupAnnouncementEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY(groupId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as GroupAnnouncementEntry[]) : [];
  } catch {
    return [];
  }
}

function saveAnnouncements(groupId: string, list: GroupAnnouncementEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY(groupId), JSON.stringify(list));
}

// ─── 훅 ──────────────────────────────────────────────────────
export function useGroupAnnouncement(groupId: string) {
  const [announcements, setAnnouncements] = useState<GroupAnnouncementEntry[]>([]);

  // 초기 로드
  useEffect(() => {
    if (!groupId) return;
    setAnnouncements(loadAnnouncements(groupId));
  }, [groupId]);

  // 저장 + 상태 갱신
  const persist = useCallback(
    (updated: GroupAnnouncementEntry[]) => {
      saveAnnouncements(groupId, updated);
      setAnnouncements(updated);
    },
    [groupId]
  );

  // 공지 추가
  const addAnnouncement = useCallback(
    (
      title: string,
      content: string,
      author: string,
      priority: AnnouncementPriority,
      tags: string[]
    ): GroupAnnouncementEntry => {
      const current = loadAnnouncements(groupId);
      const now = new Date().toISOString();
      const newEntry: GroupAnnouncementEntry = {
        id: crypto.randomUUID(),
        title: title.trim(),
        content: content.trim(),
        author: author.trim() || "익명",
        priority,
        pinned: false,
        readBy: [],
        tags: tags.map((t) => t.trim()).filter(Boolean),
        createdAt: now,
        updatedAt: now,
      };
      persist([newEntry, ...current]);
      return newEntry;
    },
    [groupId, persist]
  );

  // 공지 수정
  const updateAnnouncement = useCallback(
    (
      id: string,
      patch: Partial<Omit<GroupAnnouncementEntry, "id" | "createdAt">>
    ): boolean => {
      const current = loadAnnouncements(groupId);
      const target = current.find((a) => a.id === id);
      if (!target) return false;
      persist(
        current.map((a) =>
          a.id === id
            ? { ...a, ...patch, updatedAt: new Date().toISOString() }
            : a
        )
      );
      return true;
    },
    [groupId, persist]
  );

  // 공지 삭제
  const deleteAnnouncement = useCallback(
    (id: string): void => {
      const current = loadAnnouncements(groupId);
      persist(current.filter((a) => a.id !== id));
    },
    [groupId, persist]
  );

  // 고정/해제 토글
  const togglePin = useCallback(
    (id: string): void => {
      const current = loadAnnouncements(groupId);
      persist(
        current.map((a) =>
          a.id === id
            ? { ...a, pinned: !a.pinned, updatedAt: new Date().toISOString() }
            : a
        )
      );
    },
    [groupId, persist]
  );

  // 읽음 처리
  const markAsRead = useCallback(
    (id: string, memberName: string): void => {
      if (!memberName.trim()) return;
      const current = loadAnnouncements(groupId);
      persist(
        current.map((a) =>
          a.id === id && !a.readBy.includes(memberName)
            ? {
                ...a,
                readBy: [...a.readBy, memberName],
                updatedAt: new Date().toISOString(),
              }
            : a
        )
      );
    },
    [groupId, persist]
  );

  // 미읽은 공지 수 (memberName 기준)
  const getUnreadCount = useCallback(
    (memberName: string): number => {
      if (!memberName) return 0;
      return announcements.filter((a) => !a.readBy.includes(memberName)).length;
    },
    [announcements]
  );

  // 고정 공지 목록 (최신순)
  const getPinned = useCallback((): GroupAnnouncementEntry[] => {
    return [...announcements]
      .filter((a) => a.pinned)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [announcements]);

  // 통계
  const totalAnnouncements = announcements.length;

  const pinnedCount = useMemo(
    () => announcements.filter((a) => a.pinned).length,
    [announcements]
  );

  const urgentCount = useMemo(
    () => announcements.filter((a) => a.priority === "urgent").length,
    [announcements]
  );

  return {
    announcements,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    togglePin,
    markAsRead,
    getUnreadCount,
    getPinned,
    totalAnnouncements,
    pinnedCount,
    urgentCount,
  };
}
