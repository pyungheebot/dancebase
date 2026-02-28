"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { GroupAnnouncementItem, GroupAnnouncementData, GroupAnnouncementPriority } from "@/types";

// ─── localStorage 헬퍼 ────────────────────────────────────────

function loadData(groupId: string): GroupAnnouncementData {
  if (typeof window === "undefined") {
    return { groupId, announcements: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(
      swrKeys.groupAnnouncementBoard(groupId)
    );
    if (!raw) return { groupId, announcements: [], updatedAt: new Date().toISOString() };
    const parsed = JSON.parse(raw) as GroupAnnouncementData;
    return parsed;
  } catch {
    return { groupId, announcements: [], updatedAt: new Date().toISOString() };
  }
}

function saveData(data: GroupAnnouncementData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      swrKeys.groupAnnouncementBoard(data.groupId),
      JSON.stringify(data)
    );
  } catch {
    // localStorage 용량 초과 등 무시
  }
}

// ─── 만료 여부 판별 ───────────────────────────────────────────

function isExpired(item: GroupAnnouncementItem): boolean {
  if (!item.expiresAt) return false;
  return new Date(item.expiresAt).getTime() < Date.now();
}

// ─── 훅 ──────────────────────────────────────────────────────

export function useGroupAnnouncement(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.groupAnnouncementBoard(groupId),
    () => loadData(groupId)
  );

  const allAnnouncements: GroupAnnouncementItem[] = data?.announcements ?? [];

  // 만료되지 않은 공지 (활성)
  const activeAnnouncements = allAnnouncements.filter((a) => !isExpired(a));

  // 만료된 공지
  const expiredAnnouncements = allAnnouncements.filter((a) => isExpired(a));

  // 공지 생성
  const createAnnouncement = useCallback(
    (params: {
      title: string;
      content: string;
      authorName: string;
      priority: GroupAnnouncementPriority;
      expiresAt: string | null;
      attachmentUrl: string | null;
    }): GroupAnnouncementItem => {
      const current = loadData(groupId);
      const now = new Date().toISOString();
      const newItem: GroupAnnouncementItem = {
        id: crypto.randomUUID(),
        title: params.title.trim(),
        content: params.content.trim(),
        authorName: params.authorName.trim() || "익명",
        isPinned: false,
        priority: params.priority,
        expiresAt: params.expiresAt ?? null,
        attachmentUrl: params.attachmentUrl ?? null,
        createdAt: now,
        updatedAt: now,
      };
      const updated: GroupAnnouncementData = {
        ...current,
        announcements: [newItem, ...current.announcements],
        updatedAt: now,
      };
      saveData(updated);
      mutate(updated);
      return newItem;
    },
    [groupId, mutate]
  );

  // 공지 수정
  const updateAnnouncement = useCallback(
    (
      id: string,
      patch: Partial<Omit<GroupAnnouncementItem, "id" | "createdAt">>
    ): boolean => {
      const current = loadData(groupId);
      const target = current.announcements.find((a) => a.id === id);
      if (!target) return false;
      const now = new Date().toISOString();
      const updated: GroupAnnouncementData = {
        ...current,
        announcements: current.announcements.map((a) =>
          a.id === id ? { ...a, ...patch, updatedAt: now } : a
        ),
        updatedAt: now,
      };
      saveData(updated);
      mutate(updated);
      return true;
    },
    [groupId, mutate]
  );

  // 공지 삭제
  const deleteAnnouncement = useCallback(
    (id: string): void => {
      const current = loadData(groupId);
      const now = new Date().toISOString();
      const updated: GroupAnnouncementData = {
        ...current,
        announcements: current.announcements.filter((a) => a.id !== id),
        updatedAt: now,
      };
      saveData(updated);
      mutate(updated);
    },
    [groupId, mutate]
  );

  // 고정/해제 토글
  const togglePin = useCallback(
    (id: string): void => {
      const current = loadData(groupId);
      const now = new Date().toISOString();
      const updated: GroupAnnouncementData = {
        ...current,
        announcements: current.announcements.map((a) =>
          a.id === id
            ? { ...a, isPinned: !a.isPinned, updatedAt: now }
            : a
        ),
        updatedAt: now,
      };
      saveData(updated);
      mutate(updated);
    },
    [groupId, mutate]
  );

  // 통계
  const totalAnnouncements = activeAnnouncements.length;
  const pinnedCount = activeAnnouncements.filter((a) => a.isPinned).length;
  const urgentCount = activeAnnouncements.filter(
    (a) => a.priority === "urgent"
  ).length;
  const expiredCount = expiredAnnouncements.length;

  return {
    announcements: activeAnnouncements,
    expiredAnnouncements,
    loading: isLoading,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    togglePin,
    totalAnnouncements,
    pinnedCount,
    urgentCount,
    expiredCount,
    refetch: () => mutate(),
  };
}
