"use client";

import {useCallback, useMemo} from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { MilestoneTask, ProjectMilestoneCard } from "@/types";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";

const MAX_MILESTONES = 10;
const MAX_TASKS = 10;

function getStorageKey(groupId: string, projectId: string): string {
  return `dancebase:milestones:${groupId}:${projectId}`;
}

export function useProjectMilestoneCard(groupId: string, projectId: string) {
  const swrKey = swrKeys.projectMilestones(groupId, projectId);

  const { data: milestones = [], mutate } = useSWR<ProjectMilestoneCard[]>(
    swrKey,
    () => loadFromStorage<ProjectMilestoneCard[]>(getStorageKey(groupId, projectId), []),
    { revalidateOnFocus: false }
  );

  /** 마일스톤 추가 (최대 10개) */
  const addMilestone = useCallback(
    (title: string, description: string, dueDate: string) => {
      if (milestones.length >= MAX_MILESTONES) return false;
      const newMilestone: ProjectMilestoneCard = {
        id: crypto.randomUUID(),
        title,
        description,
        dueDate,
        tasks: [],
        createdAt: new Date().toISOString(),
      };
      const next = [...milestones, newMilestone];
      saveToStorage(getStorageKey(groupId, projectId), next);
      mutate(next, false);
      return true;
    },
    [groupId, projectId, milestones, mutate]
  );

  /** 마일스톤 삭제 */
  const deleteMilestone = useCallback(
    (milestoneId: string) => {
      const next = milestones.filter((m) => m.id !== milestoneId);
      saveToStorage(getStorageKey(groupId, projectId), next);
      mutate(next, false);
    },
    [groupId, projectId, milestones, mutate]
  );

  /** 세부 작업 추가 (마일스톤당 최대 10개) */
  const addTask = useCallback(
    (milestoneId: string, taskTitle: string) => {
      const milestone = milestones.find((m) => m.id === milestoneId);
      if (!milestone) return false;
      if (milestone.tasks.length >= MAX_TASKS) return false;
      const newTask: MilestoneTask = {
        id: crypto.randomUUID(),
        title: taskTitle,
        completed: false,
      };
      const next = milestones.map((m) =>
        m.id === milestoneId ? { ...m, tasks: [...m.tasks, newTask] } : m
      );
      saveToStorage(getStorageKey(groupId, projectId), next);
      mutate(next, false);
      return true;
    },
    [groupId, projectId, milestones, mutate]
  );

  /** 세부 작업 완료 토글 */
  const toggleTask = useCallback(
    (milestoneId: string, taskId: string) => {
      const next = milestones.map((m) => {
        if (m.id !== milestoneId) return m;
        return {
          ...m,
          tasks: m.tasks.map((t) =>
            t.id === taskId ? { ...t, completed: !t.completed } : t
          ),
        };
      });
      saveToStorage(getStorageKey(groupId, projectId), next);
      mutate(next, false);
    },
    [groupId, projectId, milestones, mutate]
  );

  /** 마일스톤별 완료율 계산 */
  const getCompletionRate = useCallback(
    (milestoneId: string): number => {
      const milestone = milestones.find((m) => m.id === milestoneId);
      if (!milestone || milestone.tasks.length === 0) return 0;
      const done = milestone.tasks.filter((t) => t.completed).length;
      return Math.round((done / milestone.tasks.length) * 100);
    },
    [milestones]
  );

  /** 전체 완료된 마일스톤 수 (tasks가 모두 완료된 경우) */
  const completedCount = useMemo(
    () =>
      milestones.filter(
        (m) => m.tasks.length > 0 && m.tasks.every((t) => t.completed)
      ).length,
    [milestones]
  );

  /** 전체 진행률 */
  const overallRate = useMemo(() => {
    if (milestones.length === 0) return 0;
    const totalTasks = milestones.reduce((acc, m) => acc + m.tasks.length, 0);
    if (totalTasks === 0) return 0;
    const doneTasks = milestones.reduce(
      (acc, m) => acc + m.tasks.filter((t) => t.completed).length,
      0
    );
    return Math.round((doneTasks / totalTasks) * 100);
  }, [milestones]);

  return {
    milestones,
    addMilestone,
    deleteMilestone,
    addTask,
    toggleTask,
    getCompletionRate,
    completedCount,
    overallRate,
    maxMilestones: MAX_MILESTONES,
    maxTasks: MAX_TASKS,
    refetch: () => mutate(),
  };
}
