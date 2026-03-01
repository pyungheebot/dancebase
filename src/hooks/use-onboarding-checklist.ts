"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { OnboardingProgress } from "@/types";

// ============================================
// localStorage 키 헬퍼
// ============================================

function getStorageKey(groupId: string, userId: string): string {
  return `dancebase:onboarding:${groupId}:${userId}`;
}

// ============================================
// localStorage 읽기/쓰기 헬퍼
// ============================================

function saveProgress(groupId: string, progress: OnboardingProgress): void {
  try {
    localStorage.setItem(
      getStorageKey(groupId, progress.userId),
      JSON.stringify(progress)
    );
  } catch {
    // localStorage 쓰기 실패 시 무시
  }
}

// ============================================
// 훅
// ============================================

export function useOnboardingChecklist(groupId: string, userId: string) {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [mounted] = useState(false);

  // SSR 호환: 마운트 후 localStorage 읽기

  // 단계 완료 여부 토글
  const toggleStep = useCallback(
    (stepId: string) => {
      if (!groupId || !userId) return;

      setProgress((prev) => {
        if (!prev) return prev;

        const now = new Date().toISOString();
        const updatedSteps = prev.steps.map((step) => {
          if (step.id !== stepId) return step;
          const nextCompleted = !step.completed;
          return {
            ...step,
            completed: nextCompleted,
            completedAt: nextCompleted ? now : undefined,
          };
        });

        const completedCount = updatedSteps.filter((s) => s.completed).length;
        const completionRate =
          updatedSteps.length > 0
            ? Math.round((completedCount / updatedSteps.length) * 100)
            : 0;
        const allDone = completedCount === updatedSteps.length;

        const next: OnboardingProgress = {
          ...prev,
          steps: updatedSteps,
          completionRate,
        };

        saveProgress(groupId, next);

        // 토스트 알림
        const justCompleted = updatedSteps.find((s) => s.id === stepId)?.completed;
        if (justCompleted) {
          if (allDone) {
            toast.success("온보딩 완료!", {
              description: "모든 단계를 완료했습니다. 그룹 활동을 마음껏 즐겨보세요!",
              duration: 4000,
            });
          } else {
            const stepTitle = updatedSteps.find((s) => s.id === stepId)?.title;
            toast.success("단계 완료!", {
              description: stepTitle,
              duration: 2000,
            });
          }
        }

        return next;
      });
    },
    [groupId, userId]
  );

  // 파생 값 계산
  const steps = progress?.steps ?? [];
  const completedCount = steps.filter((s) => s.completed).length;
  const totalCount = steps.length;
  const completionRate = progress?.completionRate ?? 0;

  // 완료율 반환 함수
  const getCompletionRate = useCallback(() => completionRate, [completionRate]);

  // 전체 완료 여부 함수
  const isFullyOnboarded = useCallback(
    () => totalCount > 0 && completedCount === totalCount,
    [totalCount, completedCount]
  );

  return {
    progress,
    steps,
    completedCount,
    totalCount,
    completionRate,
    mounted,
    toggleStep,
    getCompletionRate,
    isFullyOnboarded,
  };
}
