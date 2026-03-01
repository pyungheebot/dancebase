"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { OnboardingStep, OnboardingProgress } from "@/types";

// ============================================
// 기본 6단계 정의
// ============================================

const DEFAULT_STEPS: Omit<OnboardingStep, "completed" | "completedAt">[] = [
  {
    id: "profile-photo",
    title: "프로필 사진 등록",
    description: "나를 나타내는 사진을 프로필에 등록해보세요.",
  },
  {
    id: "self-intro",
    title: "자기소개 작성",
    description: "프로필에 간단한 자기소개를 작성해보세요.",
  },
  {
    id: "first-attendance",
    title: "첫 출석 완료",
    description: "연습 또는 모임에 참석하고 첫 출석을 기록해보세요.",
  },
  {
    id: "board-first-post",
    title: "게시판 첫 글 작성",
    description: "게시판에 그룹 멤버들에게 인사글을 남겨보세요.",
  },
  {
    id: "greet-members",
    title: "멤버 3명 이상과 인사",
    description: "그룹 내 멤버 3명 이상과 댓글이나 반응으로 소통해보세요.",
  },
  {
    id: "group-rules",
    title: "그룹 규칙 확인",
    description: "그룹 설정에서 규칙과 주의사항을 확인해보세요.",
  },
];

// ============================================
// localStorage 키 헬퍼
// ============================================

function getStorageKey(groupId: string, userId: string): string {
  return `dancebase:onboarding:${groupId}:${userId}`;
}

// ============================================
// 초기 데이터 생성
// ============================================

function buildInitialProgress(userId: string): OnboardingProgress {
  return {
    userId,
    steps: DEFAULT_STEPS.map((step) => ({
      ...step,
      completed: false,
    })),
    startedAt: new Date().toISOString(),
    completionRate: 0,
  };
}

// ============================================
// localStorage 읽기/쓰기 헬퍼
// ============================================

function loadProgress(groupId: string, userId: string): OnboardingProgress {
  try {
    const raw = localStorage.getItem(getStorageKey(groupId, userId));
    if (!raw) return buildInitialProgress(userId);

    const parsed = JSON.parse(raw) as Partial<OnboardingProgress>;

    // 저장된 완료 상태를 기본 단계 목록에 병합 (단계 추가/변경 시 안전하게 처리)
    const savedMap: Record<string, Pick<OnboardingStep, "completed" | "completedAt">> = {};
    if (Array.isArray(parsed.steps)) {
      for (const s of parsed.steps) {
        if (s.id) {
          savedMap[s.id] = {
            completed: s.completed ?? false,
            completedAt: s.completedAt,
          };
        }
      }
    }

    const steps: OnboardingStep[] = DEFAULT_STEPS.map((step) => ({
      ...step,
      completed: savedMap[step.id]?.completed ?? false,
      completedAt: savedMap[step.id]?.completedAt,
    }));

    const completedCount = steps.filter((s) => s.completed).length;
    const completionRate =
      steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

    return {
      userId,
      steps,
      startedAt: parsed.startedAt ?? new Date().toISOString(),
      completionRate,
    };
  } catch {
    return buildInitialProgress(userId);
  }
}

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
  const [mounted, setMounted] = useState(false);

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
