"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { StageTransitionEntry, StageTransitionTask } from "@/types";

// ─── localStorage 헬퍼 ────────────────────────────────────────

function getStorageKey(groupId: string, projectId: string) {
  return `dancebase:stage-transition:${groupId}:${projectId}`;
}

function loadEntries(groupId: string, projectId: string): StageTransitionEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId, projectId));
    return raw ? (JSON.parse(raw) as StageTransitionEntry[]) : [];
  } catch {
    return [];
  }
}

function saveEntries(
  groupId: string,
  projectId: string,
  entries: StageTransitionEntry[]
) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(groupId, projectId), JSON.stringify(entries));
}

// ─── 유틸리티 ─────────────────────────────────────────────────

function calcTotalDuration(tasks: StageTransitionTask[]): number {
  return tasks.reduce((sum, t) => sum + t.durationSeconds, 0);
}

// ─── 훅 ──────────────────────────────────────────────────────

export function useStageTransition(groupId: string, projectId: string) {
  const { data, mutate } = useSWR(
    swrKeys.stageTransition(groupId, projectId),
    () => loadEntries(groupId, projectId),
    { fallbackData: [] }
  );

  const entries: StageTransitionEntry[] = data ?? [];

  // ─── 전환 CRUD ───────────────────────────────────────────

  async function addTransition(
    payload: Omit<StageTransitionEntry, "id" | "tasks" | "totalDuration" | "createdAt" | "transitionOrder">
  ): Promise<string> {
    const newEntry: StageTransitionEntry = {
      ...payload,
      id: crypto.randomUUID(),
      tasks: [],
      totalDuration: 0,
      transitionOrder: entries.length,
      createdAt: new Date().toISOString(),
    };
    const updated = [...entries, newEntry];
    saveEntries(groupId, projectId, updated);
    await mutate(updated, false);
    return newEntry.id;
  }

  async function updateTransition(
    entryId: string,
    patch: Partial<
      Omit<StageTransitionEntry, "id" | "tasks" | "totalDuration" | "createdAt" | "transitionOrder">
    >
  ) {
    const updated = entries.map((e) =>
      e.id === entryId ? { ...e, ...patch } : e
    );
    saveEntries(groupId, projectId, updated);
    await mutate(updated, false);
  }

  async function deleteTransition(entryId: string) {
    const filtered = entries
      .filter((e) => e.id !== entryId)
      .map((e, i) => ({ ...e, transitionOrder: i }));
    saveEntries(groupId, projectId, filtered);
    await mutate(filtered, false);
  }

  // ─── 태스크 CRUD ─────────────────────────────────────────

  async function addTask(
    entryId: string,
    payload: Omit<StageTransitionTask, "id" | "isCompleted">
  ): Promise<string> {
    const newTask: StageTransitionTask = {
      ...payload,
      id: crypto.randomUUID(),
      isCompleted: false,
    };
    const updated = entries.map((e) => {
      if (e.id !== entryId) return e;
      const tasks = [...e.tasks, newTask];
      return { ...e, tasks, totalDuration: calcTotalDuration(tasks) };
    });
    saveEntries(groupId, projectId, updated);
    await mutate(updated, false);
    return newTask.id;
  }

  async function updateTask(
    entryId: string,
    taskId: string,
    patch: Partial<Omit<StageTransitionTask, "id">>
  ) {
    const updated = entries.map((e) => {
      if (e.id !== entryId) return e;
      const tasks = e.tasks.map((t) =>
        t.id === taskId ? { ...t, ...patch } : t
      );
      return { ...e, tasks, totalDuration: calcTotalDuration(tasks) };
    });
    saveEntries(groupId, projectId, updated);
    await mutate(updated, false);
  }

  async function deleteTask(entryId: string, taskId: string) {
    const updated = entries.map((e) => {
      if (e.id !== entryId) return e;
      const tasks = e.tasks.filter((t) => t.id !== taskId);
      return { ...e, tasks, totalDuration: calcTotalDuration(tasks) };
    });
    saveEntries(groupId, projectId, updated);
    await mutate(updated, false);
  }

  async function toggleTaskComplete(entryId: string, taskId: string) {
    const updated = entries.map((e) => {
      if (e.id !== entryId) return e;
      const tasks = e.tasks.map((t) =>
        t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
      );
      return { ...e, tasks };
    });
    saveEntries(groupId, projectId, updated);
    await mutate(updated, false);
  }

  // ─── 순서 변경 ────────────────────────────────────────────

  async function reorderTransitions(fromIndex: number, toIndex: number) {
    const sorted = [...entries].sort((a, b) => a.transitionOrder - b.transitionOrder);
    const [moved] = sorted.splice(fromIndex, 1);
    sorted.splice(toIndex, 0, moved);
    const updated = sorted.map((e, i) => ({ ...e, transitionOrder: i }));
    saveEntries(groupId, projectId, updated);
    await mutate(updated, false);
  }

  // ─── 파생 데이터 ──────────────────────────────────────────

  const sorted = [...entries].sort((a, b) => a.transitionOrder - b.transitionOrder);

  const stats = {
    totalTransitions: entries.length,
    completedTasks: entries.reduce(
      (sum, e) => sum + e.tasks.filter((t) => t.isCompleted).length,
      0
    ),
    totalTasks: entries.reduce((sum, e) => sum + e.tasks.length, 0),
    totalTransitionTime: entries.reduce((sum, e) => sum + e.totalDuration, 0),
  };

  return {
    entries: sorted,
    addTransition,
    updateTransition,
    deleteTransition,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    reorderTransitions,
    stats,
    refetch: () => mutate(),
  };
}
