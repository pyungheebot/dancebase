"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { LearningPath, LearningStep, LearningStepStatus } from "@/types";

// -------------------------------------------------------
// localStorage 키
// -------------------------------------------------------
function storageKey(groupId: string, userId: string) {
  return `dancebase:learning-path:${groupId}:${userId}`;
}

// -------------------------------------------------------
// 기본 학습 단계 템플릿 (장르 + 현재→목표 레벨)
// -------------------------------------------------------

type StepTemplate = {
  order: number;
  title: string;
  description: string;
  skills: string[];
};

function buildSteps(genre: string, currentLevel: string, _targetLevel: string): LearningStep[] {
  const baseTemplates: StepTemplate[] = [
    {
      order: 1,
      title: "기초 스트레칭 & 워밍업",
      description: "부상 방지와 유연성 향상을 위한 기초 스트레칭 루틴을 익힙니다.",
      skills: ["스트레칭", "유연성", "워밍업"],
    },
    {
      order: 2,
      title: "리듬감 & 박자 훈련",
      description: "음악의 박자에 맞춰 몸을 움직이는 기본 리듬 감각을 기릅니다.",
      skills: ["리듬감", "박자", "그루브"],
    },
    {
      order: 3,
      title: "바디컨트롤 & 아이솔레이션",
      description: "머리, 어깨, 가슴, 힙 등 각 신체 부위를 독립적으로 조절하는 훈련입니다.",
      skills: ["아이솔레이션", "바디컨트롤", "웨이브"],
    },
    {
      order: 4,
      title: `${genre} 기본 테크닉`,
      description: `${genre} 장르의 핵심 기본기를 학습합니다. 대표 동작과 스타일을 이해합니다.`,
      skills: ["기본기", "스타일", `${genre} 무브`],
    },
    {
      order: 5,
      title: "표현력 & 무대 매너",
      description: "음악을 해석하고 감정을 동작으로 표현하는 능력을 키웁니다.",
      skills: ["표현력", "무대 매너", "퍼포먼스"],
    },
    {
      order: 6,
      title: "응용 콤비네이션",
      description: "배운 동작들을 연결하여 짧은 루틴을 만들고 응용합니다.",
      skills: ["콤비네이션", "연결 동작", "루틴 구성"],
    },
    {
      order: 7,
      title: "프리스타일 연습",
      description: "음악에 맞춰 즉흥적으로 움직이는 프리스타일 능력을 개발합니다.",
      skills: ["프리스타일", "즉흥성", "창의성"],
    },
    {
      order: 8,
      title: "완성 루틴 & 발표",
      description: "전체 학습 내용을 종합하여 완성된 루틴을 만들고 발표합니다.",
      skills: ["루틴 완성", "발표", "피드백"],
    },
  ];

  // 레벨에 따라 시작 단계 조정
  const levelOrder: Record<string, number> = {
    "입문": 1,
    "초급": 2,
    "중급": 4,
    "고급": 6,
    "마스터": 7,
  };

  const startOrder = levelOrder[currentLevel] ?? 1;

  const filtered = baseTemplates.filter((t) => t.order >= startOrder);

  // 첫 번째 단계는 in_progress, 나머지는 locked
  return filtered.map((t, idx): LearningStep => ({
    id: `step-${Date.now()}-${t.order}`,
    order: t.order,
    title: t.title,
    description: t.description,
    skills: t.skills,
    status: (idx === 0 ? "in_progress" : "locked") as LearningStepStatus,
    completedAt: undefined,
  }));
}

// -------------------------------------------------------
// localStorage 저장/로드
// -------------------------------------------------------
function loadPath(groupId: string, userId: string): LearningPath | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(groupId, userId));
    if (!raw) return null;
    return JSON.parse(raw) as LearningPath;
  } catch {
    return null;
  }
}

function savePath(groupId: string, userId: string, path: LearningPath) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId, userId), JSON.stringify(path));
  } catch { /* ignore */ }
}

function removePath(groupId: string, userId: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(storageKey(groupId, userId));
  } catch { /* ignore */ }
}

// -------------------------------------------------------
// 훅
// -------------------------------------------------------
export function useLearningPath(groupId: string, userId: string) {
  const [path, setPath] = useState<LearningPath | null>(null);

  useEffect(() => {
    setPath(loadPath(groupId, userId));
  }, [groupId, userId]);

  /** 새 학습 경로 생성 */
  const createPath = useCallback(
    (input: { currentLevel: string; targetLevel: string; genre: string }) => {
      const steps = buildSteps(input.genre, input.currentLevel, input.targetLevel);
      if (steps.length === 0) {
        toast.error("해당 레벨 조합에 맞는 단계를 생성할 수 없습니다.");
        return;
      }
      const now = new Date().toISOString();
      const newPath: LearningPath = {
        id: `lp-${Date.now()}`,
        userId,
        currentLevel: input.currentLevel,
        targetLevel: input.targetLevel,
        genre: input.genre,
        steps,
        createdAt: now,
        updatedAt: now,
      };
      setPath(newPath);
      savePath(groupId, userId, newPath);
      toast.success("학습 경로가 생성되었습니다.");
    },
    [groupId, userId]
  );

  /** 경로 삭제 */
  const deletePath = useCallback(() => {
    setPath(null);
    removePath(groupId, userId);
    toast.success("학습 경로가 삭제되었습니다.");
  }, [groupId, userId]);

  /** 단계 완료 처리 → 다음 단계 잠금 해제 */
  const completeStep = useCallback(
    (stepId: string) => {
      if (!path) return;
      const now = new Date().toISOString();
      const stepIndex = path.steps.findIndex((s) => s.id === stepId);
      if (stepIndex === -1) return;

      const updated: LearningStep[] = path.steps.map((s, idx) => {
        if (s.id === stepId) {
          return { ...s, status: "completed" as LearningStepStatus, completedAt: now };
        }
        // 다음 단계를 in_progress로 해제
        if (idx === stepIndex + 1 && s.status === "locked") {
          return { ...s, status: "in_progress" as LearningStepStatus };
        }
        return s;
      });

      const updatedPath: LearningPath = { ...path, steps: updated, updatedAt: now };
      setPath(updatedPath);
      savePath(groupId, userId, updatedPath);
      toast.success("단계를 완료했습니다! 다음 단계가 열렸습니다.");
    },
    [groupId, userId, path]
  );

  /** 단계 상태 초기화 (완료 → in_progress로 되돌리기) */
  const resetStep = useCallback(
    (stepId: string) => {
      if (!path) return;
      const now = new Date().toISOString();
      const stepIndex = path.steps.findIndex((s) => s.id === stepId);
      if (stepIndex === -1) return;

      const updated: LearningStep[] = path.steps.map((s, idx) => {
        if (s.id === stepId) {
          return { ...s, status: "in_progress" as LearningStepStatus, completedAt: undefined };
        }
        // 다음 단계가 in_progress였다면 다시 locked (단, 그 단계 이후가 completed인 경우엔 건드리지 않음)
        if (idx === stepIndex + 1 && s.status === "in_progress") {
          // 다음 단계 이후가 모두 locked이면 다시 locked으로
          const allAfterLocked = path.steps.slice(idx + 1).every((ss) => ss.status === "locked");
          if (allAfterLocked) {
            return { ...s, status: "locked" as LearningStepStatus };
          }
        }
        return s;
      });

      const updatedPath: LearningPath = { ...path, steps: updated, updatedAt: now };
      setPath(updatedPath);
      savePath(groupId, userId, updatedPath);
      toast.success("단계를 되돌렸습니다.");
    },
    [groupId, userId, path]
  );

  /** 진행률 계산 (0~100) */
  function getProgress(): number {
    if (!path || path.steps.length === 0) return 0;
    const completed = path.steps.filter((s) => s.status === "completed").length;
    return Math.round((completed / path.steps.length) * 100);
  }

  return {
    path,
    createPath,
    deletePath,
    completeStep,
    resetStep,
    getProgress,
  };
}
