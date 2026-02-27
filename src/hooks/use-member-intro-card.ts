"use client";

import { useState, useCallback, useEffect } from "react";
import type { MemberIntroCardV2 } from "@/types";

// ============================================
// localStorage 키
// ============================================

function storageKey(groupId: string, userId: string): string {
  return `dancebase:member-intro:${groupId}:${userId}`;
}

// ============================================
// 내부 유틸
// ============================================

function loadCard(groupId: string, userId: string): MemberIntroCardV2 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(groupId, userId));
    if (!raw) return null;
    return JSON.parse(raw) as MemberIntroCardV2;
  } catch {
    return null;
  }
}

function persistCard(groupId: string, userId: string, card: MemberIntroCardV2): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId, userId), JSON.stringify(card));
  } catch {
    // 무시
  }
}

function removeCard(groupId: string, userId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(storageKey(groupId, userId));
  } catch {
    // 무시
  }
}

// ============================================
// 유효성 검사 유틸
// ============================================

export function validateIntroCard(card: Partial<MemberIntroCardV2>): string | null {
  if (card.favoriteGenres && card.favoriteGenres.length > 3) {
    return "장르는 최대 3개까지 입력할 수 있습니다";
  }
  if (card.motto && card.motto.length > 50) {
    return "한마디는 최대 50자까지 입력할 수 있습니다";
  }
  if (card.joinReason && card.joinReason.length > 100) {
    return "가입 이유는 최대 100자까지 입력할 수 있습니다";
  }
  return null;
}

// ============================================
// 훅
// ============================================

export function useMemberIntroCard(groupId: string, userId: string) {
  const [intro, setIntro] = useState<MemberIntroCardV2 | null>(null);
  const [loaded, setLoaded] = useState(false);

  // 초기 로드
  useEffect(() => {
    if (!groupId || !userId) return;
    setIntro(loadCard(groupId, userId));
    setLoaded(true);
  }, [groupId, userId]);

  // 카드 저장
  const saveIntro = useCallback(
    (card: MemberIntroCardV2): string | null => {
      const error = validateIntroCard(card);
      if (error) return error;

      const normalized: MemberIntroCardV2 = {
        ...card,
        favoriteGenres: card.favoriteGenres.slice(0, 3),
        motto: card.motto.slice(0, 50),
        joinReason: card.joinReason.slice(0, 100),
        updatedAt: new Date().toISOString(),
      };

      persistCard(groupId, userId, normalized);
      setIntro(normalized);
      return null;
    },
    [groupId, userId]
  );

  // 카드 조회
  const getIntro = useCallback(
    (): MemberIntroCardV2 | null => {
      return intro;
    },
    [intro]
  );

  // 카드 삭제
  const clearIntro = useCallback((): void => {
    removeCard(groupId, userId);
    setIntro(null);
  }, [groupId, userId]);

  return {
    intro,
    loaded,
    saveIntro,
    getIntro,
    clearIntro,
  };
}
