"use client";

import { useState, useEffect, useCallback } from "react";
import type { PeerFeedback, PeerFeedbackType } from "@/types";

// ============================================
// 상수
// ============================================

export const TYPE_LABELS: Record<PeerFeedbackType, string> = {
  strength: "잘하는 점",
  improvement: "개선하면 좋을 점",
};

// ============================================
// localStorage 헬퍼
// ============================================

function storageKey(groupId: string): string {
  return `peer-feedback-${groupId}`;
}

function loadFeedbacks(groupId: string): PeerFeedback[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as PeerFeedback[];
  } catch {
    return [];
  }
}

function saveFeedbacks(groupId: string, feedbacks: PeerFeedback[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId), JSON.stringify(feedbacks));
  } catch {
    // 무시
  }
}

// ============================================
// 훅
// ============================================

export function usePeerFeedback(groupId: string) {
  const [feedbacks, setFeedbacks] = useState<PeerFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    if (!groupId) return;
    const data = loadFeedbacks(groupId);
    setFeedbacks(data);
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    reload();
  }, [reload]);

  /** 피드백 전송 */
  const sendFeedback = useCallback(
    (
      senderId: string,
      receiverId: string,
      receiverName: string,
      type: PeerFeedbackType,
      content: string
    ): PeerFeedback => {
      const newFeedback: PeerFeedback = {
        id: crypto.randomUUID(),
        senderId,
        receiverId,
        receiverName,
        type,
        content,
        createdAt: new Date().toISOString(),
      };
      const updated = [...feedbacks, newFeedback];
      saveFeedbacks(groupId, updated);
      setFeedbacks(updated);
      return newFeedback;
    },
    [groupId, feedbacks]
  );

  /** 내가 받은 피드백 목록 (senderId 숨김용 — 반환 시 senderId 노출 주의) */
  const getMyFeedback = useCallback(
    (userId: string): PeerFeedback[] => {
      return feedbacks.filter((f) => f.receiverId === userId);
    },
    [feedbacks]
  );

  /** 내가 보낸 피드백 목록 */
  const getSentFeedback = useCallback(
    (userId: string): PeerFeedback[] => {
      return feedbacks.filter((f) => f.senderId === userId);
    },
    [feedbacks]
  );

  /** 받은 "잘하는 점" 개수 */
  const getStrengthCount = useCallback(
    (userId: string): number => {
      return feedbacks.filter(
        (f) => f.receiverId === userId && f.type === "strength"
      ).length;
    },
    [feedbacks]
  );

  /** 받은 "개선점" 개수 */
  const getImprovementCount = useCallback(
    (userId: string): number => {
      return feedbacks.filter(
        (f) => f.receiverId === userId && f.type === "improvement"
      ).length;
    },
    [feedbacks]
  );

  /** 이미 보낸 피드백인지 확인 (중복 방지) */
  const hasSentTo = useCallback(
    (senderId: string, receiverId: string): boolean => {
      return feedbacks.some(
        (f) => f.senderId === senderId && f.receiverId === receiverId
      );
    },
    [feedbacks]
  );

  return {
    feedbacks,
    loading,
    sendFeedback,
    getMyFeedback,
    getSentFeedback,
    getStrengthCount,
    getImprovementCount,
    hasSentTo,
    TYPE_LABELS,
  };
}
