"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  ScheduleFeedbackItem,
  ScheduleFeedbackMood,
} from "@/types";

const MAX_RECENT = 10;

function getStorageKey(groupId: string): string {
  return `dancebase:schedule-feedback:${groupId}`;
}

function loadAll(groupId: string): ScheduleFeedbackItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as ScheduleFeedbackItem[];
  } catch {
    return [];
  }
}

function saveAll(groupId: string, items: ScheduleFeedbackItem[]): void {
  try {
    localStorage.setItem(getStorageKey(groupId), JSON.stringify(items));
  } catch {
    // localStorage 저장 실패 무시
  }
}

function generateId(): string {
  return `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function useScheduleFeedbackLocal(
  groupId: string,
  scheduleId: string
) {
  const [allItems, setAllItems] = useState<ScheduleFeedbackItem[]>([]);

  // 마운트 시 localStorage에서 로드
  useEffect(() => {
    if (!groupId) return;
    setAllItems(loadAll(groupId));
  }, [groupId]);

  // 해당 scheduleId에 해당하는 피드백만 필터링 (최신순, 최대 10개)
  const feedbacks = allItems
    .filter((item) => item.scheduleId === scheduleId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, MAX_RECENT);

  // 평균 별점 계산
  const averageRating =
    feedbacks.length > 0
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
      : 0;

  // 무드 분포 계산
  const moodDistribution = (["great", "good", "ok", "bad"] as ScheduleFeedbackMood[]).map(
    (mood) => {
      const count = feedbacks.filter((f) => f.mood === mood).length;
      const percentage =
        feedbacks.length > 0 ? Math.round((count / feedbacks.length) * 100) : 0;
      return { mood, count, percentage };
    }
  );

  // 피드백 추가
  const addFeedback = useCallback(
    (rating: number, mood: ScheduleFeedbackMood, content: string) => {
      if (!groupId || !scheduleId) return;
      const newItem: ScheduleFeedbackItem = {
        id: generateId(),
        scheduleId,
        rating,
        mood,
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };
      const updated = [...allItems, newItem];
      saveAll(groupId, updated);
      setAllItems(updated);
    },
    [groupId, scheduleId, allItems]
  );

  // 피드백 삭제
  const removeFeedback = useCallback(
    (id: string) => {
      if (!groupId) return;
      const updated = allItems.filter((item) => item.id !== id);
      saveAll(groupId, updated);
      setAllItems(updated);
    },
    [groupId, allItems]
  );

  return {
    feedbacks,
    averageRating,
    moodDistribution,
    addFeedback,
    removeFeedback,
  };
}
