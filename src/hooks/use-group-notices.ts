"use client";

import { useState, useCallback } from "react";
import { type GroupNotice, type NoticePriority } from "@/types";

const NOTICES_KEY_PREFIX = "dancebase:group-notices:";
const READ_KEY_PREFIX = "dancebase:notices-read:";

const PRIORITY_ORDER: Record<NoticePriority, number> = {
  urgent: 0,
  important: 1,
  normal: 2,
};

function getNoticesStorageKey(groupId: string) {
  return `${NOTICES_KEY_PREFIX}${groupId}`;
}

function getReadStorageKey(groupId: string, userId: string) {
  return `${READ_KEY_PREFIX}${groupId}:${userId}`;
}

function saveNotices(groupId: string, notices: GroupNotice[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getNoticesStorageKey(groupId), JSON.stringify(notices));
}

function saveReadSet(groupId: string, userId: string, readSet: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    getReadStorageKey(groupId, userId),
    JSON.stringify(Array.from(readSet))
  );
}

function isExpired(notice: GroupNotice): boolean {
  if (!notice.expiresAt) return false;
  return new Date(notice.expiresAt) < new Date();
}

export function useGroupNotices(groupId: string, userId: string) {
  const [notices, setNotices] = useState<GroupNotice[]>([]);
  const [readSet, setReadSet] = useState<Set<string>>(new Set());

  const activeNotices = notices
    .filter((n) => !isExpired(n))
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  const unreadCount = activeNotices.filter((n) => !readSet.has(n.id)).length;

  const addNotice = useCallback(
    (
      title: string,
      content: string,
      priority: NoticePriority,
      expiresAt: string | null
    ) => {
      const newNotice: GroupNotice = {
        id: crypto.randomUUID(),
        title: title.trim(),
        content: content.trim(),
        priority,
        createdAt: new Date().toISOString(),
        expiresAt,
      };
      setNotices((prev) => {
        const updated = [...prev, newNotice];
        saveNotices(groupId, updated);
        return updated;
      });
    },
    [groupId]
  );

  const updateNotice = useCallback(
    (
      id: string,
      title: string,
      content: string,
      priority: NoticePriority,
      expiresAt: string | null
    ) => {
      setNotices((prev) => {
        const updated = prev.map((n) =>
          n.id === id
            ? { ...n, title: title.trim(), content: content.trim(), priority, expiresAt }
            : n
        );
        saveNotices(groupId, updated);
        return updated;
      });
    },
    [groupId]
  );

  const deleteNotice = useCallback(
    (id: string) => {
      setNotices((prev) => {
        const updated = prev.filter((n) => n.id !== id);
        saveNotices(groupId, updated);
        return updated;
      });
    },
    [groupId]
  );

  const markAsRead = useCallback(
    (noticeId: string) => {
      setReadSet((prev) => {
        const updated = new Set(prev);
        updated.add(noticeId);
        saveReadSet(groupId, userId, updated);
        return updated;
      });
    },
    [groupId, userId]
  );

  return {
    notices,
    activeNotices,
    unreadCount,
    readSet,
    addNotice,
    updateNotice,
    deleteNotice,
    markAsRead,
  };
}
