"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import type {
  GroupAnnouncementItem,
  GroupAnnouncementInput,
} from "@/types";

const ANNOUNCEMENTS_KEY_PREFIX = "dancebase:announcements:";
const READ_KEY_PREFIX = "dancebase:announcements-read:";
const MAX_ANNOUNCEMENTS = 50;

function getAnnouncementsKey(groupId: string) {
  return `${ANNOUNCEMENTS_KEY_PREFIX}${groupId}`;
}

function getReadKey(groupId: string) {
  return `${READ_KEY_PREFIX}${groupId}`;
}

function saveAnnouncements(
  groupId: string,
  items: GroupAnnouncementItem[]
) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      getAnnouncementsKey(groupId),
      JSON.stringify(items)
    );
  } catch {
    // localStorage 용량 초과 등의 경우 무시
  }
}

function saveReadIds(groupId: string, ids: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getReadKey(groupId), JSON.stringify([...ids]));
  } catch {
    // 무시
  }
}

function sortAnnouncements(
  items: GroupAnnouncementItem[]
): GroupAnnouncementItem[] {
  return [...items].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function useGroupAnnouncements(groupId: string) {
  const [announcements, setAnnouncements] = useState<GroupAnnouncementItem[]>(
    []
  );
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const persistAndUpdate = useCallback(
    (newItems: GroupAnnouncementItem[]) => {
      const sorted = sortAnnouncements(newItems);
      saveAnnouncements(groupId, sorted);
      setAnnouncements(sorted);
    },
    [groupId]
  );

  // 공지 추가
  const addAnnouncement = useCallback(
    (input: GroupAnnouncementInput): boolean => {
      if (announcements.length >= MAX_ANNOUNCEMENTS) {
        toast.error(
          `공지사항은 최대 ${MAX_ANNOUNCEMENTS}개까지 작성할 수 있습니다.`
        );
        return false;
      }
      if (!input.title.trim()) {
        toast.error("제목을 입력해주세요.");
        return false;
      }
      if (!input.content.trim()) {
        toast.error("내용을 입력해주세요.");
        return false;
      }

      const now = new Date().toISOString();
      const newItem: GroupAnnouncementItem = {
        id: crypto.randomUUID(),
        title: input.title.trim(),
        content: input.content.trim(),
        authorName: '',
        isPinned: input.pinned,
        priority: input.priority,
        expiresAt: null,
        attachmentUrl: null,
        createdAt: now,
        updatedAt: now,
      };

      persistAndUpdate([...announcements, newItem]);
      toast.success("공지사항이 등록되었습니다.");
      return true;
    },
    [announcements, persistAndUpdate]
  );

  // 공지 삭제
  const deleteAnnouncement = useCallback(
    (id: string): void => {
      const updated = announcements.filter((item) => item.id !== id);
      persistAndUpdate(updated);

      // 읽음 목록에서도 제거
      const newReadIds = new Set(readIds);
      newReadIds.delete(id);
      saveReadIds(groupId, newReadIds);
      setReadIds(newReadIds);

      toast.success("공지사항이 삭제되었습니다.");
    },
    [announcements, groupId, persistAndUpdate, readIds]
  );

  // 고정 토글
  const togglePin = useCallback(
    (id: string): void => {
      const updated = announcements.map((item) =>
        item.id === id ? { ...item, isPinned: !item.isPinned } : item
      );
      persistAndUpdate(updated);
    },
    [announcements, persistAndUpdate]
  );

  // 읽음 처리
  const markAsRead = useCallback(
    (id: string): void => {
      if (readIds.has(id)) return;
      const newReadIds = new Set(readIds);
      newReadIds.add(id);
      saveReadIds(groupId, newReadIds);
      setReadIds(newReadIds);
    },
    [groupId, readIds]
  );

  // 전체 읽음 처리
  const markAllAsRead = useCallback((): void => {
    const allIds = new Set(announcements.map((item) => item.id));
    saveReadIds(groupId, allIds);
    setReadIds(allIds);
  }, [announcements, groupId]);

  // 읽지 않은 수
  const unreadCount = announcements.filter(
    (item) => !readIds.has(item.id)
  ).length;

  return {
    announcements,
    loading: false,
    unreadCount,
    readIds,
    addAnnouncement,
    deleteAnnouncement,
    togglePin,
    markAsRead,
    markAllAsRead,
    totalCount: announcements.length,
    maxReached: announcements.length >= MAX_ANNOUNCEMENTS,
  };
}
