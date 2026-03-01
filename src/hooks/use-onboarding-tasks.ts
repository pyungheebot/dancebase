"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { OnboardingTaskItem, OnboardingTasksData } from "@/types";

// ============================================
// 기본 온보딩 과제 6개
// ============================================

const DEFAULT_TASKS: Omit<OnboardingTaskItem, "completed" | "completedAt">[] = [
  {
    id: "profile-photo",
    title: "프로필 사진 설정",
    description: "프로필 페이지에서 나를 나타내는 사진을 등록해보세요.",
    order: 1,
  },
  {
    id: "self-intro",
    title: "자기소개 작성",
    description: "프로필에 간단한 자기소개를 작성해보세요.",
    order: 2,
  },
  {
    id: "dance-genre",
    title: "댄스 장르 선택",
    description: "내가 즐기는 댄스 장르를 프로필에 설정해보세요.",
    order: 3,
  },
  {
    id: "first-rsvp",
    title: "첫 일정 RSVP 응답",
    description: "일정 탭에서 다가오는 일정에 참석 여부를 응답해보세요.",
    order: 4,
  },
  {
    id: "greeting-post",
    title: "게시판에 인사글 작성",
    description: "게시판에 그룹 멤버들에게 인사글을 남겨보세요.",
    order: 5,
  },
  {
    id: "first-attendance",
    title: "첫 출석 완료",
    description: "연습 또는 모임에 참석하고 첫 출석을 기록해보세요.",
    order: 6,
  },
];

// ============================================
// localStorage 키
// ============================================

function getStorageKey(groupId: string, userId: string): string {
  return `dancebase:onboarding-tasks:${groupId}:${userId}`;
}

// ============================================
// 초기 데이터 생성
// ============================================

function buildInitialData(): OnboardingTasksData {
  return {
    tasks: DEFAULT_TASKS.map((task) => ({
      ...task,
      completed: false,
      completedAt: null,
    })),
    dismissed: false,
    completedAt: null,
  };
}

// ============================================
// localStorage 읽기/쓰기 헬퍼
// ============================================

function loadData(groupId: string, userId: string): OnboardingTasksData {
  try {
    const key = getStorageKey(groupId, userId);
    const raw = localStorage.getItem(key);
    if (!raw) return buildInitialData();

    const parsed = JSON.parse(raw) as Partial<OnboardingTasksData>;

    // 저장된 완료 상태를 기본 과제 목록에 병합
    const savedMap: Record<string, Pick<OnboardingTaskItem, "completed" | "completedAt">> = {};
    if (Array.isArray(parsed.tasks)) {
      for (const t of parsed.tasks) {
        if (t.id) {
          savedMap[t.id] = {
            completed: t.completed ?? false,
            completedAt: t.completedAt ?? null,
          };
        }
      }
    }

    const tasks = DEFAULT_TASKS.map((task) => ({
      ...task,
      completed: savedMap[task.id]?.completed ?? false,
      completedAt: savedMap[task.id]?.completedAt ?? null,
    }));

    return {
      tasks,
      dismissed: parsed.dismissed ?? false,
      completedAt: parsed.completedAt ?? null,
    };
  } catch {
    return buildInitialData();
  }
}

function saveData(groupId: string, userId: string, data: OnboardingTasksData): void {
  try {
    localStorage.setItem(getStorageKey(groupId, userId), JSON.stringify(data));
  } catch {
    // localStorage 쓰기 실패 시 무시
  }
}

// ============================================
// 훅
// ============================================

export function useOnboardingTasks(groupId: string, userId: string) {
  const [data, setData] = useState<OnboardingTasksData | null>(null);
  const [mounted, setMounted] = useState(false);

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

        saveData(groupId, userId, next);

        // 방금 완료된 과제인지 확인
        const justCompleted = updatedTasks.find((t) => t.id === taskId)?.completed;
        if (justCompleted) {
          if (allDone) {
            toast.success("온보딩 완료!", {
              description: "모든 과제를 완료했습니다. 그룹 활동을 즐겨보세요!",
              duration: 4000,
            });
          } else {
            toast.success("과제 완료!", {
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
      saveData(groupId, userId, next);
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
