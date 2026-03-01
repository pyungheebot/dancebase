"use client";

import { useState, useCallback } from "react";
import { saveToStorage } from "@/lib/local-storage";
import type { AnonymousFeedback, FeedbackCategory } from "@/types";

// ============================================
// 상수
// ============================================

export const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  praise: "칭찬",
  encouragement: "격려",
  improvement: "개선 제안",
  other: "기타",
};

// ============================================
// localStorage 키
// ============================================

function storageKey(groupId: string): string {
  return `dancebase:anon-feedback:${groupId}`;
}

// ============================================
// localStorage 유틸
// ============================================

function saveAll(groupId: string, feedbacks: AnonymousFeedback[]): void {
  saveToStorage(storageKey(groupId), feedbacks);
}

// ============================================
// 훅
// ============================================

export function useAnonymousFeedback(groupId: string) {
  const [feedbacks, setFeedbacks] = useState<AnonymousFeedback[]>([]);


  // 피드백 작성 (익명으로 대상 멤버에게 전송)
  const sendFeedback = useCallback(
    (
      senderId: string,
      targetUserId: string,
      category: FeedbackCategory,
      content: string
    ): AnonymousFeedback => {
      const newFeedback: AnonymousFeedback = {
        id: crypto.randomUUID(),
        groupId,
        targetUserId,
        senderId, // 로컬에만 저장, UI에 절대 표시하지 않음
        category,
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };

      const updated = [...feedbacks, newFeedback];
      saveAll(groupId, updated);
      setFeedbacks(updated);

      return newFeedback;
    },
    [groupId, feedbacks]
  );

  // 받은 피드백 조회 (자기 것만, senderId 제외한 안전한 뷰)
  const getReceivedFeedbacks = useCallback(
    (userId: string): Omit<AnonymousFeedback, "senderId">[] => {
      return feedbacks
        .filter((fb) => fb.targetUserId === userId)
        .map(({ senderId: _omit, ...safe }) => safe)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    },
    [feedbacks]
  );

  // 보낸 피드백 이력 (작성자 본인만, 자신이 보낸 것)
  const getSentFeedbacks = useCallback(
    (senderId: string): AnonymousFeedback[] => {
      return feedbacks
        .filter((fb) => fb.senderId === senderId)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    },
    [feedbacks]
  );

  // 카테고리별 피드백 수 집계 (받은 피드백 기준)
  const getCategoryDistribution = useCallback(
    (userId: string): Record<FeedbackCategory, number> => {
      const received = feedbacks.filter((fb) => fb.targetUserId === userId);
      return {
        praise: received.filter((fb) => fb.category === "praise").length,
        encouragement: received.filter((fb) => fb.category === "encouragement")
          .length,
        improvement: received.filter((fb) => fb.category === "improvement")
          .length,
        other: received.filter((fb) => fb.category === "other").length,
      };
    },
    [feedbacks]
  );

  // 이미 보냈는지 확인 (중복 방지용)
  const hasSentTo = useCallback(
    (senderId: string, targetUserId: string): boolean => {
      return feedbacks.some(
        (fb) => fb.senderId === senderId && fb.targetUserId === targetUserId
      );
    },
    [feedbacks]
  );

  return {
    loading: false,
    sendFeedback,
    getReceivedFeedbacks,
    getSentFeedbacks,
    getCategoryDistribution,
    hasSentTo,
  };
}
