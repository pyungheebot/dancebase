"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { ThankYouCategory, ThankYouMessage } from "@/types";

// ============================================
// localStorage 유틸
// ============================================

function storageKey(groupId: string): string {
  return `dancebase:thank-you-board:${groupId}`;
}

function loadMessages(groupId: string): ThankYouMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as ThankYouMessage[];
  } catch {
    return [];
  }
}

function saveMessages(groupId: string, messages: ThankYouMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId), JSON.stringify(messages));
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

// ============================================
// 훅
// ============================================

export function useThankYouBoard(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.thankYouBoard(groupId),
    () => loadMessages(groupId),
    { fallbackData: [] }
  );

  const messages = useMemo(() => data ?? [], [data]);

  // 메시지 보내기
  const sendMessage = useCallback(
    (
      fromMember: string,
      toMember: string,
      category: ThankYouCategory,
      message: string,
      emoji?: string,
      isPublic: boolean = true
    ): void => {
      const current = loadMessages(groupId);
      const newMessage: ThankYouMessage = {
        id: crypto.randomUUID(),
        fromMember,
        toMember,
        category,
        message,
        emoji,
        likes: [],
        isPublic,
        createdAt: new Date().toISOString(),
      };
      const updated = [newMessage, ...current];
      saveMessages(groupId, updated);
      mutate(updated, false);
    },
    [groupId, mutate]
  );

  // 메시지 삭제
  const deleteMessage = useCallback(
    (id: string): void => {
      const current = loadMessages(groupId);
      const updated = current.filter((m) => m.id !== id);
      saveMessages(groupId, updated);
      mutate(updated, false);
    },
    [groupId, mutate]
  );

  // 좋아요 토글
  const toggleLike = useCallback(
    (id: string, memberName: string): void => {
      const current = loadMessages(groupId);
      const updated = current.map((m) => {
        if (m.id !== id) return m;
        const alreadyLiked = m.likes.includes(memberName);
        return {
          ...m,
          likes: alreadyLiked
            ? m.likes.filter((n) => n !== memberName)
            : [...m.likes, memberName],
        };
      });
      saveMessages(groupId, updated);
      mutate(updated, false);
    },
    [groupId, mutate]
  );

  // 받은 메시지 필터
  const getMessagesTo = useCallback(
    (memberName: string): ThankYouMessage[] => {
      return messages.filter((m) => m.toMember === memberName);
    },
    [messages]
  );

  // 보낸 메시지 필터
  const getMessagesFrom = useCallback(
    (memberName: string): ThankYouMessage[] => {
      return messages.filter((m) => m.fromMember === memberName);
    },
    [messages]
  );

  // 통계: 전체 메시지 수
  const totalMessages = messages.length;

  // 통계: 가장 많이 받은 멤버
  const topReceiver: string | null = (() => {
    if (messages.length === 0) return null;
    const countMap: Record<string, number> = {};
    for (const m of messages) {
      countMap[m.toMember] = (countMap[m.toMember] ?? 0) + 1;
    }
    return Object.entries(countMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  })();

  // 통계: 가장 많이 보낸 멤버
  const topSender: string | null = (() => {
    if (messages.length === 0) return null;
    const countMap: Record<string, number> = {};
    for (const m of messages) {
      countMap[m.fromMember] = (countMap[m.fromMember] ?? 0) + 1;
    }
    return Object.entries(countMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  })();

  // 통계: 카테고리별 분포
  const categoryDistribution: Record<ThankYouCategory, number> = (() => {
    const dist: Record<ThankYouCategory, number> = {
      help: 0,
      motivation: 0,
      teaching: 0,
      teamwork: 0,
      creativity: 0,
      encouragement: 0,
      effort: 0,
      general: 0,
    };
    for (const m of messages) {
      dist[m.category] = (dist[m.category] ?? 0) + 1;
    }
    return dist;
  })();

  return {
    messages,
    loading: isLoading,
    refetch: () => mutate(),
    sendMessage,
    deleteMessage,
    toggleLike,
    getMessagesTo,
    getMessagesFrom,
    totalMessages,
    topReceiver,
    topSender,
    categoryDistribution,
  };
}
