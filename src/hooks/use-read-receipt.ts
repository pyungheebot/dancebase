"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  ReadReceiptData,
  ReadReceiptAnnouncement,
  ReadReceiptPriority,
} from "@/types";

// ============================================
// localStorage 유틸
// ============================================

function storageKey(groupId: string): string {
  return `dancebase:read-receipt:${groupId}`;
}

// ============================================
// 훅
// ============================================

export function useReadReceipt(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.readReceipt(groupId),
    () => loadFromStorage<ReadReceiptData>(storageKey(groupId), {} as ReadReceiptData),
    {
      fallbackData: {
        groupId,
        announcements: [],
        updatedAt: new Date().toISOString(),
      },
    }
  );

  const announcements: ReadReceiptAnnouncement[] = useMemo(() => data?.announcements ?? [], [data?.announcements]);

  // 공지 추가
  const addAnnouncement = useCallback(
    (params: {
      title: string;
      content: string;
      author: string;
      priority: ReadReceiptPriority;
      targetMembers: string[];
    }): ReadReceiptAnnouncement => {
      const current = loadFromStorage<ReadReceiptData>(storageKey(groupId), {} as ReadReceiptData);
      const now = new Date().toISOString();
      const newItem: ReadReceiptAnnouncement = {
        id: crypto.randomUUID(),
        title: params.title.trim(),
        content: params.content.trim(),
        author: params.author.trim(),
        priority: params.priority,
        targetMembers: params.targetMembers.map((m) => m.trim()).filter(Boolean),
        readers: [],
        createdAt: now,
        updatedAt: now,
      };
      const updated: ReadReceiptData = {
        ...current,
        announcements: [newItem, ...current.announcements],
        updatedAt: now,
      };
      saveToStorage(storageKey(groupId), updated);
      mutate(updated, false);
      return newItem;
    },
    [groupId, mutate]
  );

  // 공지 수정
  const updateAnnouncement = useCallback(
    (
      announcementId: string,
      params: Partial<{
        title: string;
        content: string;
        priority: ReadReceiptPriority;
        targetMembers: string[];
      }>
    ): boolean => {
      const current = loadFromStorage<ReadReceiptData>(storageKey(groupId), {} as ReadReceiptData);
      const idx = current.announcements.findIndex((a) => a.id === announcementId);
      if (idx === -1) return false;

      const existing = current.announcements[idx];
      const updatedItem: ReadReceiptAnnouncement = {
        ...existing,
        ...params,
        title: params.title?.trim() ?? existing.title,
        content: params.content?.trim() ?? existing.content,
        targetMembers: params.targetMembers?.map((m) => m.trim()).filter(Boolean) ?? existing.targetMembers,
        updatedAt: new Date().toISOString(),
      };

      const updatedList = current.announcements.map((a) =>
        a.id === announcementId ? updatedItem : a
      );
      const updated: ReadReceiptData = {
        ...current,
        announcements: updatedList,
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(storageKey(groupId), updated);
      mutate(updated, false);
      return true;
    },
    [groupId, mutate]
  );

  // 공지 삭제
  const deleteAnnouncement = useCallback(
    (announcementId: string): boolean => {
      const current = loadFromStorage<ReadReceiptData>(storageKey(groupId), {} as ReadReceiptData);
      const exists = current.announcements.some((a) => a.id === announcementId);
      if (!exists) return false;

      const updated: ReadReceiptData = {
        ...current,
        announcements: current.announcements.filter((a) => a.id !== announcementId),
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(storageKey(groupId), updated);
      mutate(updated, false);
      return true;
    },
    [groupId, mutate]
  );

  // 읽음 처리
  const markAsRead = useCallback(
    (announcementId: string, memberName: string): boolean => {
      const current = loadFromStorage<ReadReceiptData>(storageKey(groupId), {} as ReadReceiptData);
      const idx = current.announcements.findIndex((a) => a.id === announcementId);
      if (idx === -1) return false;

      const item = current.announcements[idx];
      const alreadyRead = item.readers.some((r) => r.memberName === memberName);
      if (alreadyRead) return false;

      const updatedItem: ReadReceiptAnnouncement = {
        ...item,
        readers: [
          ...item.readers,
          { memberName, readAt: new Date().toISOString() },
        ],
        updatedAt: new Date().toISOString(),
      };
      const updatedList = current.announcements.map((a) =>
        a.id === announcementId ? updatedItem : a
      );
      const updated: ReadReceiptData = {
        ...current,
        announcements: updatedList,
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(storageKey(groupId), updated);
      mutate(updated, false);
      return true;
    },
    [groupId, mutate]
  );

  // 읽음 취소
  const unmarkAsRead = useCallback(
    (announcementId: string, memberName: string): boolean => {
      const current = loadFromStorage<ReadReceiptData>(storageKey(groupId), {} as ReadReceiptData);
      const idx = current.announcements.findIndex((a) => a.id === announcementId);
      if (idx === -1) return false;

      const item = current.announcements[idx];
      const updatedItem: ReadReceiptAnnouncement = {
        ...item,
        readers: item.readers.filter((r) => r.memberName !== memberName),
        updatedAt: new Date().toISOString(),
      };
      const updatedList = current.announcements.map((a) =>
        a.id === announcementId ? updatedItem : a
      );
      const updated: ReadReceiptData = {
        ...current,
        announcements: updatedList,
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(storageKey(groupId), updated);
      mutate(updated, false);
      return true;
    },
    [groupId, mutate]
  );

  // 특정 공지의 읽음률 계산 (0~100)
  const getReadRate = useCallback(
    (announcementId: string): number => {
      const item = announcements.find((a) => a.id === announcementId);
      if (!item || item.targetMembers.length === 0) return 0;
      const readCount = item.readers.filter((r) =>
        item.targetMembers.includes(r.memberName)
      ).length;
      return Math.round((readCount / item.targetMembers.length) * 100);
    },
    [announcements]
  );

  // 특정 공지의 미읽음 멤버 목록
  const getUnreadMembers = useCallback(
    (announcementId: string): string[] => {
      const item = announcements.find((a) => a.id === announcementId);
      if (!item) return [];
      const readNames = new Set(item.readers.map((r) => r.memberName));
      return item.targetMembers.filter((m) => !readNames.has(m));
    },
    [announcements]
  );

  // 특정 공지의 읽음 멤버 목록 (시각 포함)
  const getReadMembers = useCallback(
    (announcementId: string) => {
      const item = announcements.find((a) => a.id === announcementId);
      if (!item) return [];
      const targetSet = new Set(item.targetMembers);
      return item.readers.filter((r) => targetSet.has(r.memberName));
    },
    [announcements]
  );

  // 특정 멤버가 읽었는지 여부
  const isReadByMember = useCallback(
    (announcementId: string, memberName: string): boolean => {
      const item = announcements.find((a) => a.id === announcementId);
      if (!item) return false;
      return item.readers.some((r) => r.memberName === memberName);
    },
    [announcements]
  );

  // 전체 통계
  const stats = (() => {
    const total = announcements.length;
    const urgentCount = announcements.filter((a) => a.priority === "urgent").length;
    const importantCount = announcements.filter((a) => a.priority === "important").length;
    const normalCount = announcements.filter((a) => a.priority === "normal").length;
    const avgReadRate =
      total === 0
        ? 0
        : Math.round(
            announcements.reduce((sum, a) => {
              if (a.targetMembers.length === 0) return sum;
              const readCount = a.readers.filter((r) =>
                a.targetMembers.includes(r.memberName)
              ).length;
              return sum + readCount / a.targetMembers.length;
            }, 0) /
              total *
              100
          );
    return { total, urgentCount, importantCount, normalCount, avgReadRate };
  })();

  return {
    announcements,
    loading: isLoading,
    refetch: () => mutate(),
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    markAsRead,
    unmarkAsRead,
    getReadRate,
    getUnreadMembers,
    getReadMembers,
    isReadByMember,
    stats,
  };
}
