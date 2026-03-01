"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { OnboardingTasksData } from "@/types";
import { saveToStorage } from "@/lib/local-storage";

// ============================================
// localStorage 키
// ============================================

function getStorageKey(groupId: string, userId: string): string {
  return `dancebase:onboarding-tasks:${groupId}:${userId}`;
}

// ============================================
// 훅
// ============================================

export function useOnboardingTasks(groupId: string, userId: string) {
  const [data, setData] = useState<OnboardingTasksData | null>(null);
  const [mounted] = useState(false);

  // SSR 호환: 마운트 후 localStorage 읽기

  // 과제 완료 여부 토글
  const toggleTask = useCallback(
    (taskId: string) => {
      if (!groupId || !userId) return;

      setData((prev) => {
        if (!prev) return prev;

        const now = new Date().toISOString();
        const updatedTasks = prev.tasks.map((task) => {
          if (task.id !== taskId) return task;
          const nextCompleted = !task.completed;
          return {
            ...task,
            completed: nextCompleted,
            completedAt: nextCompleted ? now : null,
          };
        });

        const allDone = updatedTasks.every((t) => t.completed);
        const next: OnboardingTasksData = {
          ...prev,
          tasks: updatedTasks,
          completedAt: allDone && !prev.completedAt ? now : prev.completedAt,
        };

        saveToStorage(getStorageKey(groupId, userId), next);

        // 방금 완료된 과제인지 확인
        const justCompleted = updatedTasks.find((t) => t.id === taskId)?.completed;
        if (justCompleted) {
          if (allDone) {
            toast.success(TOAST.ONBOARDING.COMPLETED, {
              description: "모든 과제를 완료했습니다. 그룹 활동을 즐겨보세요!",
              duration: 4000,
            });
          } else {
            toast.success(TOAST.ONBOARDING.TASK_COMPLETED, {
              description: updatedTasks.find((t) => t.id === taskId)?.title,
              duration: 2000,
            });
          }
        }

        return next;
      });
    },
    [groupId, userId],
  );

  // 온보딩 카드 건너뛰기(숨김)
  const dismiss = useCallback(() => {
    if (!groupId || !userId) return;

    setData((prev) => {
      if (!prev) return prev;
      const next: OnboardingTasksData = { ...prev, dismissed: true };
      saveToStorage(getStorageKey(groupId, userId), next);
      return next;
    });
  }, [groupId, userId]);

  // 파생 값
  const tasks = data?.tasks ?? [];
  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const completionRate =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isAllDone = totalCount > 0 && completedCount === totalCount;
  const isDismissed = data?.dismissed ?? false;

  return {
    tasks,
    completedCount,
    totalCount,
    completionRate,
    isAllDone,
    isDismissed,
    mounted,
    toggleTask,
    dismiss,
  };
}
