"use client";

import { useState, useCallback, useMemo } from "react";
import type { ProjectMilestone } from "@/types";

const STORAGE_KEY_PREFIX = "dancebase:milestones:";

// 기본 마일스톤 템플릿 (처음 생성 시 자동 생성)
const DEFAULT_MILESTONE_TITLES: string[] = [
  "안무 완성",
  "음악 선정",
  "포메이션 확정",
  "총 연습",
  "공연/발표",
];

function getStorageKey(projectId: string): string {
  return `${STORAGE_KEY_PREFIX}${projectId}`;
}

function loadMilestones(projectId: string): ProjectMilestone[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getStorageKey(projectId));
    return raw ? (JSON.parse(raw) as ProjectMilestone[]) : null;
  } catch {
    return null;
  }
}

function persistMilestones(
  projectId: string,
  milestones: ProjectMilestone[]
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      getStorageKey(projectId),
      JSON.stringify(milestones)
    );
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

/** 기본 목표일: 오늘로부터 index * 14일 후 (YYYY-MM-DD) */
function getDefaultTargetDate(index: number): string {
  const date = new Date();
  date.setDate(date.getDate() + (index + 1) * 14);
  return date.toISOString().split("T")[0];
}

function createDefaultMilestones(projectId: string): ProjectMilestone[] {
  const now = new Date().toISOString();
  return DEFAULT_MILESTONE_TITLES.map((title, index) => ({
    id: `${projectId}-default-${index}-${Math.random()
      .toString(36)
      .slice(2, 9)}`,
    projectId,
    title,
    description: undefined,
    targetDate: getDefaultTargetDate(index),
    completedAt: null,
    sortOrder: index,
    createdAt: now,
  }));
}

export function useProjectMilestones(projectId: string) {
  const [milestones, setMilestones] = useState<ProjectMilestone[]>(() => {
    const stored = loadMilestones(projectId);
    if (stored !== null) return stored;
    // 첫 사용 시 기본 템플릿 생성 및 저장
    const defaults = createDefaultMilestones(projectId);
    persistMilestones(projectId, defaults);
    return defaults;
  });

  /** 마일스톤 추가 */
  const addMilestone = useCallback(
    (title: string, targetDate: string, description?: string) => {
      const maxOrder = milestones.reduce(
        (acc, m) => Math.max(acc, m.sortOrder),
        -1
      );
      const newMilestone: ProjectMilestone = {
        id: `${projectId}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 9)}`,
        projectId,
        title,
        description,
        targetDate,
        completedAt: null,
        sortOrder: maxOrder + 1,
        createdAt: new Date().toISOString(),
      };
      setMilestones((prev) => {
        const next = [...prev, newMilestone];
        persistMilestones(projectId, next);
        return next;
      });
    },
    [projectId, milestones]
  );

  /** 마일스톤 수정 */
  const updateMilestone = useCallback(
    (id: string, updates: Partial<Omit<ProjectMilestone, "id" | "projectId" | "createdAt">>) => {
      setMilestones((prev) => {
        const next = prev.map((m) =>
          m.id === id ? { ...m, ...updates } : m
        );
        persistMilestones(projectId, next);
        return next;
      });
    },
    [projectId]
  );

  /** 마일스톤 삭제 */
  const deleteMilestone = useCallback(
    (id: string) => {
      setMilestones((prev) => {
        const next = prev.filter((m) => m.id !== id);
        persistMilestones(projectId, next);
        return next;
      });
    },
    [projectId]
  );

  /** 완료 토글 */
  const toggleComplete = useCallback(
    (id: string) => {
      setMilestones((prev) => {
        const next = prev.map((m) => {
          if (m.id !== id) return m;
          return {
            ...m,
            completedAt: m.completedAt ? null : new Date().toISOString(),
          };
        });
        persistMilestones(projectId, next);
        return next;
      });
    },
    [projectId]
  );

  /** 전체 진행률 (완료 / 전체 %) */
  const completionRate = useMemo(() => {
    if (milestones.length === 0) return 0;
    const doneCount = milestones.filter((m) => m.completedAt !== null).length;
    return Math.round((doneCount / milestones.length) * 100);
  }, [milestones]);

  /** 다음 마일스톤: 미완료 중 가장 빠른 targetDate */
  const nextMilestone = useMemo((): ProjectMilestone | null => {
    const incomplete = milestones.filter((m) => m.completedAt === null);
    if (incomplete.length === 0) return null;
    return incomplete.reduce((nearest, m) =>
      m.targetDate < nearest.targetDate ? m : nearest
    );
  }, [milestones]);

  /** sortOrder 기준 정렬된 마일스톤 목록 */
  const sortedMilestones = useMemo(
    () => [...milestones].sort((a, b) => a.sortOrder - b.sortOrder),
    [milestones]
  );

  return {
    milestones: sortedMilestones,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    toggleComplete,
    completionRate,
    nextMilestone,
  };
}
