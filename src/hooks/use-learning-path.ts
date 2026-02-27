"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { LearningPathItem, LearningStep, LearningLevel } from "@/types";

const STORAGE_KEY_PREFIX = "dancebase:learning-paths:";
const MAX_PATHS = 10;
const MAX_STEPS = 15;

function getKey(groupId: string) {
  return `${STORAGE_KEY_PREFIX}${groupId}`;
}

function loadPaths(groupId: string): LearningPathItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as LearningPathItem[];
  } catch {
    return [];
  }
}

function savePaths(groupId: string, items: LearningPathItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getKey(groupId), JSON.stringify(items));
  } catch { /* ignore */ }
}

export function useLearningPath(groupId: string) {
  const [paths, setPaths] = useState<LearningPathItem[]>([]);

  useEffect(() => {
    setPaths(loadPaths(groupId));
  }, [groupId]);

  const addPath = useCallback(
    (input: { title: string; level: LearningLevel; steps: { title: string; description: string }[] }) => {
      if (paths.length >= MAX_PATHS) {
        toast.error(`학습 경로는 최대 ${MAX_PATHS}개까지 생성할 수 있습니다.`);
        return;
      }
      if (input.steps.length === 0 || input.steps.length > MAX_STEPS) {
        toast.error(`스텝은 1~${MAX_STEPS}개 사이여야 합니다.`);
        return;
      }
      const newPath: LearningPathItem = {
        id: `lp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: input.title,
        level: input.level,
        steps: input.steps.map((s, i) => ({
          id: `step-${Date.now()}-${i}`,
          title: s.title,
          description: s.description,
          completed: false,
          completedAt: null,
        })),
        createdAt: new Date().toISOString(),
      };
      const updated = [...paths, newPath];
      setPaths(updated);
      savePaths(groupId, updated);
      toast.success("학습 경로가 생성되었습니다.");
    },
    [groupId, paths]
  );

  const deletePath = useCallback(
    (id: string) => {
      const updated = paths.filter((p) => p.id !== id);
      if (updated.length === paths.length) return;
      setPaths(updated);
      savePaths(groupId, updated);
      toast.success("학습 경로가 삭제되었습니다.");
    },
    [groupId, paths]
  );

  const toggleStep = useCallback(
    (pathId: string, stepId: string) => {
      const updated = paths.map((p) => {
        if (p.id !== pathId) return p;
        return {
          ...p,
          steps: p.steps.map((s) => {
            if (s.id !== stepId) return s;
            return {
              ...s,
              completed: !s.completed,
              completedAt: !s.completed ? new Date().toISOString() : null,
            };
          }),
        };
      });
      setPaths(updated);
      savePaths(groupId, updated);
    },
    [groupId, paths]
  );

  function getCompletionRate(path: LearningPathItem): number {
    if (path.steps.length === 0) return 0;
    const completed = path.steps.filter((s) => s.completed).length;
    return Math.round((completed / path.steps.length) * 100);
  }

  return { paths, addPath, deletePath, toggleStep, getCompletionRate };
}
