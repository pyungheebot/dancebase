"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { invalidateThankYouLetters } from "@/lib/swr/invalidate";
import type { ThankYouLetter, ThankYouCategory } from "@/types";

// 카테고리 레이블
export const THANK_YOU_CATEGORY_LABEL: Record<ThankYouCategory, string> = {
  help: "도움",
  motivation: "동기부여",
  teamwork: "팀워크",
  teaching: "가르침",
  creativity: "창의성",
  encouragement: "격려",
  effort: "노력",
  general: "감사",
};

// 카테고리 이모지
export const THANK_YOU_CATEGORY_EMOJI: Record<ThankYouCategory, string> = {
  help: "🤲",
  motivation: "🔥",
  teamwork: "🤝",
  teaching: "📚",
  creativity: "🎨",
  encouragement: "💪",
  effort: "⭐",
  general: "💖",
};

// 선택 가능한 이모지 목록
export const SELECTABLE_EMOJIS = [
  "💖", "🌟", "🙏", "🌸", "✨", "🎉", "🌈", "💐",
  "🥰", "🫶", "💌", "🌻", "🎁", "🤗", "💝", "🌷",
];

const ALL_CATEGORIES: ThankYouCategory[] = [
  "teamwork",
  "teaching",
  "encouragement",
  "effort",
  "general",
];

function getStorageKey(groupId: string): string {
  return `dancebase:thank-you:${groupId}`;
}

function loadLetters(groupId: string): ThankYouLetter[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as ThankYouLetter[];
  } catch {
    return [];
  }
}

function saveLetters(groupId: string, letters: ThankYouLetter[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(groupId), JSON.stringify(letters));
}

export type TopReceiver = {
  id: string;
  name: string;
  count: number;
};

export type CategoryStat = {
  category: ThankYouCategory;
  count: number;
};

export function useThankYouLetters(groupId: string) {
  const { data, mutate } = useSWR(
    groupId ? swrKeys.thankYouLetters(groupId) : null,
    () => loadLetters(groupId),
    { revalidateOnFocus: false }
  );

  const letters: ThankYouLetter[] = data ?? [];

  // 공개 편지만 반환
  const publicLetters = letters.filter((l) => l.isPublic);

  // 특정 멤버가 받은 편지
  function getReceivedLetters(userId: string): ThankYouLetter[] {
    return letters.filter(
      (l) => l.toId === userId && (l.isPublic || l.toId === userId)
    );
  }

  // 특정 멤버가 보낸 편지
  function getSentLetters(userId: string): ThankYouLetter[] {
    return letters.filter((l) => l.fromId === userId);
  }

  // TOP 3 가장 많이 받은 멤버
  function getTopReceivers(limit = 3): TopReceiver[] {
    const countMap = new Map<string, { name: string; count: number }>();

    publicLetters.forEach((l) => {
      const existing = countMap.get(l.toId);
      if (existing) {
        existing.count += 1;
      } else {
        countMap.set(l.toId, { name: l.toName, count: 1 });
      }
    });

    return Array.from(countMap.entries())
      .map(([id, { name, count }]) => ({ id, name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  // 카테고리별 통계
  function getCategoryStats(): CategoryStat[] {
    return ALL_CATEGORIES.map((category) => ({
      category,
      count: publicLetters.filter((l) => l.category === category).length,
    }));
  }

  // 편지 보내기
  function sendLetter(payload: {
    fromId: string;
    fromName: string;
    toId: string;
    toName: string;
    message: string;
    category: ThankYouCategory;
    isPublic: boolean;
    emoji: string;
  }): void {
    const newLetter: ThankYouLetter = {
      id: `letter-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      fromId: payload.fromId,
      fromName: payload.fromName,
      toId: payload.toId,
      toName: payload.toName,
      message: payload.message.slice(0, 200),
      category: payload.category,
      isPublic: payload.isPublic,
      emoji: payload.emoji,
      createdAt: new Date().toISOString(),
    };

    const updated = [newLetter, ...letters];
    saveLetters(groupId, updated);
    invalidateThankYouLetters(groupId);
    mutate(updated);
  }

  // 편지 삭제
  function deleteLetter(id: string): void {
    const updated = letters.filter((l) => l.id !== id);
    saveLetters(groupId, updated);
    invalidateThankYouLetters(groupId);
    mutate(updated);
  }

  return {
    letters,
    publicLetters,
    loading: false,
    refetch: () => mutate(),
    getReceivedLetters,
    getSentLetters,
    getTopReceivers,
    getCategoryStats,
    sendLetter,
    deleteLetter,
  };
}
