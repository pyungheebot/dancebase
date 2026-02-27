"use client";

import { useState, useEffect, useCallback } from "react";

// ============================================
// 타입 정의
// ============================================

export type OnboardingItem = {
  id: string;
  title: string;
  description: string;
  isDone: boolean;
  link?: string;
};

// ============================================
// 기본 체크리스트 항목
// ============================================

const DEFAULT_ITEMS: Omit<OnboardingItem, "isDone">[] = [
  {
    id: "intro-card",
    title: "자기소개 카드 작성",
    description: "멤버 탭에서 자기소개를 작성해보세요",
    link: "members",
  },
  {
    id: "check-schedule",
    title: "첫 일정 확인하기",
    description: "일정 탭에서 다가오는 연습을 확인하세요",
    link: "schedule",
  },
  {
    id: "first-rsvp",
    title: "첫 RSVP 응답하기",
    description: "일정에 참석 여부를 응답해보세요",
    link: "schedule",
  },
  {
    id: "group-rules",
    title: "그룹 규칙 확인하기",
    description: "그룹 규칙을 확인해보세요",
    link: "settings",
  },
  {
    id: "first-post",
    title: "첫 게시글 작성하기",
    description: "게시판에 인사글을 남겨보세요",
    link: "board",
  },
];

// ============================================
// localStorage 키 헬퍼
// ============================================

function getItemsKey(groupId: string, userId: string) {
  return `member-onboarding-${groupId}-${userId}`;
}

function getDismissedKey(groupId: string, userId: string) {
  return `member-onboarding-${groupId}-${userId}-dismissed`;
}

// ============================================
// 훅
// ============================================

export function useMemberOnboarding(
  groupId: string,
  userId: string | null,
  joinedAt: string | null,
) {
  const [items, setItems] = useState<OnboardingItem[]>([]);
  const [isDismissed, setIsDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 가입 후 7일 이내인지 확인
  const isNewMember = (() => {
    if (!joinedAt) return false;
    const joinDate = new Date(joinedAt);
    const now = new Date();
    const diffMs = now.getTime() - joinDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  })();

  // SSR 호환: useEffect에서 localStorage 읽기
  useEffect(() => {
    if (!groupId || !userId) return;

    const dismissedKey = getDismissedKey(groupId, userId);
    const itemsKey = getItemsKey(groupId, userId);

    const dismissed = localStorage.getItem(dismissedKey) === "true";
    setIsDismissed(dismissed);

    try {
      const stored = localStorage.getItem(itemsKey);
      if (stored) {
        const storedDoneMap: Record<string, boolean> = JSON.parse(stored);
        setItems(
          DEFAULT_ITEMS.map((item) => ({
            ...item,
            isDone: storedDoneMap[item.id] ?? false,
          })),
        );
      } else {
        setItems(DEFAULT_ITEMS.map((item) => ({ ...item, isDone: false })));
      }
    } catch {
      setItems(DEFAULT_ITEMS.map((item) => ({ ...item, isDone: false })));
    }

    setMounted(true);
  }, [groupId, userId]);

  // 항목 완료 토글
  const toggleItem = useCallback(
    (id: string) => {
      if (!userId) return;
      setItems((prev) => {
        const next = prev.map((item) =>
          item.id === id ? { ...item, isDone: !item.isDone } : item,
        );
        // localStorage 저장
        try {
          const doneMap = Object.fromEntries(
            next.map((item) => [item.id, item.isDone]),
          );
          localStorage.setItem(getItemsKey(groupId, userId), JSON.stringify(doneMap));
        } catch {
          // 저장 실패 무시
        }
        return next;
      });
    },
    [groupId, userId],
  );

  // 온보딩 완전 숨기기
  const dismissOnboarding = useCallback(() => {
    if (!userId) return;
    try {
      localStorage.setItem(getDismissedKey(groupId, userId), "true");
    } catch {
      // 저장 실패 무시
    }
    setIsDismissed(true);
  }, [groupId, userId]);

  const doneCount = items.filter((item) => item.isDone).length;
  const totalCount = items.length;
  const completionRate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const isAllDone = totalCount > 0 && doneCount === totalCount;

  return {
    items,
    toggleItem,
    dismissOnboarding,
    isNewMember,
    completionRate,
    isAllDone,
    isDismissed,
    mounted,
  };
}
