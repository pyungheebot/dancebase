"use client";

import {useState, useCallback} from "react";

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
  const [mounted] = useState(false);

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
