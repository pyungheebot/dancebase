"use client";

import { useState, useCallback } from "react";
import type { MemberIntroCard } from "@/types";

// ============================================
// localStorage 키
// ============================================

function storageKey(groupId: string): string {
  return `member-intro-cards-${groupId}`;
}

// ============================================
// 내부 유틸
// ============================================

function persistCards(groupId: string, cards: MemberIntroCard[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId), JSON.stringify(cards));
  } catch {
    // 무시
  }
}

// ============================================
// 훅
// ============================================

export function useMemberIntroCards(groupId: string) {
  const [introCards, setIntroCards] = useState<MemberIntroCard[]>([]);

  // 특정 유저의 카드 조회
  const getCard = useCallback(
    (userId: string): MemberIntroCard | null => {
      return introCards.find((c) => c.userId === userId) ?? null;
    },
    [introCards]
  );

  // 카드 저장 (upsert)
  const saveCard = useCallback(
    (card: MemberIntroCard) => {
      setIntroCards((prev) => {
        const exists = prev.findIndex((c) => c.userId === card.userId);
        const updated =
          exists >= 0
            ? prev.map((c) => (c.userId === card.userId ? card : c))
            : [...prev, card];
        persistCards(groupId, updated);
        return updated;
      });
    },
    [groupId]
  );

  // 카드 삭제
  const deleteCard = useCallback(
    (userId: string) => {
      setIntroCards((prev) => {
        const updated = prev.filter((c) => c.userId !== userId);
        persistCards(groupId, updated);
        return updated;
      });
    },
    [groupId]
  );

  // 카드 존재 여부 확인
  const hasCard = useCallback(
    (userId: string): boolean => {
      return introCards.some((c) => c.userId === userId);
    },
    [introCards]
  );

  return {
    introCards,
    getCard,
    saveCard,
    deleteCard,
    hasCard,
  };
}
