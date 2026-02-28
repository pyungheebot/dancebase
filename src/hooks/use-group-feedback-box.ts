"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  AnonFeedbackData,
  AnonFeedbackItem,
  AnonFeedbackCategory,
} from "@/types";

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(groupId: string): string {
  return `dancebase:group-feedback-box:${groupId}`;
}

function loadData(groupId: string): AnonFeedbackData {
  if (typeof window === "undefined") {
    return { groupId, feedbacks: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) {
      return { groupId, feedbacks: [], updatedAt: new Date().toISOString() };
    }
    return JSON.parse(raw) as AnonFeedbackData;
  } catch {
    return { groupId, feedbacks: [], updatedAt: new Date().toISOString() };
  }
}

function saveData(groupId: string, data: AnonFeedbackData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId), JSON.stringify(data));
  } catch {
    // 무시
  }
}

// ============================================================
// 훅
// ============================================================

export function useGroupFeedbackBox(groupId: string) {
  const { data, mutate, isLoading } = useSWR(
    groupId ? swrKeys.groupFeedbackBox(groupId) : null,
    () => loadData(groupId)
  );

  const current: AnonFeedbackData = data ?? {
    groupId,
    feedbacks: [],
    updatedAt: new Date().toISOString(),
  };

  const persist = useCallback(
    (next: AnonFeedbackData) => {
      saveData(groupId, next);
      mutate(next, false);
    },
    [groupId, mutate]
  );

  // ── 피드백 제출 ────────────────────────────────────────────

  const addFeedback = useCallback(
    (content: string, category: AnonFeedbackCategory): AnonFeedbackItem => {
      const item: AnonFeedbackItem = {
        id: crypto.randomUUID(),
        content: content.trim(),
        category,
        createdAt: new Date().toISOString(),
        resolved: false,
      };
      persist({
        ...current,
        feedbacks: [item, ...current.feedbacks],
        updatedAt: new Date().toISOString(),
      });
      return item;
    },
    [current, persist]
  );

  // ── 해결/미해결 토글 ──────────────────────────────────────

  const toggleResolved = useCallback(
    (feedbackId: string): boolean => {
      const idx = current.feedbacks.findIndex((f) => f.id === feedbackId);
      if (idx === -1) return false;
      const updated = current.feedbacks.map((f) =>
        f.id === feedbackId ? { ...f, resolved: !f.resolved } : f
      );
      persist({
        ...current,
        feedbacks: updated,
        updatedAt: new Date().toISOString(),
      });
      return true;
    },
    [current, persist]
  );

  // ── 관리자 답변 등록/수정 ────────────────────────────────

  const setReply = useCallback(
    (feedbackId: string, replyText: string): boolean => {
      const idx = current.feedbacks.findIndex((f) => f.id === feedbackId);
      if (idx === -1) return false;
      const updated = current.feedbacks.map((f) =>
        f.id === feedbackId
          ? {
              ...f,
              replyText: replyText.trim(),
              repliedAt: new Date().toISOString(),
            }
          : f
      );
      persist({
        ...current,
        feedbacks: updated,
        updatedAt: new Date().toISOString(),
      });
      return true;
    },
    [current, persist]
  );

  // ── 피드백 삭제 ───────────────────────────────────────────

  const deleteFeedback = useCallback(
    (feedbackId: string): boolean => {
      const filtered = current.feedbacks.filter((f) => f.id !== feedbackId);
      if (filtered.length === current.feedbacks.length) return false;
      persist({
        ...current,
        feedbacks: filtered,
        updatedAt: new Date().toISOString(),
      });
      return true;
    },
    [current, persist]
  );

  // ── 통계 ──────────────────────────────────────────────────

  const total = current.feedbacks.length;
  const resolved = current.feedbacks.filter((f) => f.resolved).length;
  const unresolved = total - resolved;
  const resolveRate = total === 0 ? 0 : Math.round((resolved / total) * 100);

  const CATEGORIES: AnonFeedbackCategory[] = [
    "칭찬",
    "건의",
    "불만",
    "아이디어",
    "기타",
  ];

  const categoryStats = CATEGORIES.map((cat) => {
    const count = current.feedbacks.filter((f) => f.category === cat).length;
    const percent = total === 0 ? 0 : Math.round((count / total) * 100);
    return { category: cat, count, percent };
  });

  const stats = { total, resolved, unresolved, resolveRate, categoryStats };

  return {
    data: current,
    loading: isLoading,
    addFeedback,
    toggleResolved,
    setReply,
    deleteFeedback,
    stats,
    refetch: () => mutate(),
  };
}
