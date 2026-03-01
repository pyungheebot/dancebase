"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { CurtainCallPlan, CurtainCallStep } from "@/types";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";

// ============================================================
// localStorage 유틸
// ============================================================

function getStorageKey(groupId: string, projectId: string): string {
  return `dancebase:curtain-call:${groupId}:${projectId}`;
}

function loadPlans(groupId: string, projectId: string): CurtainCallPlan[] {
  return loadFromStorage<CurtainCallPlan[]>(getStorageKey(groupId, projectId), []);
}

function savePlans(
  groupId: string,
  projectId: string,
  plans: CurtainCallPlan[]
): void {
  saveToStorage(getStorageKey(groupId, projectId), plans);
}

// ============================================================
// 훅
// ============================================================

export function useCurtainCall(groupId: string, projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.curtainCall(groupId, projectId),
    async () => loadPlans(groupId, projectId)
  );

  const plans = data ?? [];

  // ── 플랜 추가 ──
  async function addPlan(
    input: Omit<CurtainCallPlan, "id" | "createdAt" | "steps">
  ): Promise<CurtainCallPlan> {
    const newPlan: CurtainCallPlan = {
      ...input,
      id: crypto.randomUUID(),
      steps: [],
      createdAt: new Date().toISOString(),
    };
    const updated = [...plans, newPlan];
    savePlans(groupId, projectId, updated);
    await mutate(updated, false);
    return newPlan;
  }

  // ── 플랜 수정 ──
  async function updatePlan(
    planId: string,
    changes: Partial<Omit<CurtainCallPlan, "id" | "createdAt" | "steps">>
  ): Promise<void> {
    const updated = plans.map((p) =>
      p.id === planId ? { ...p, ...changes } : p
    );
    savePlans(groupId, projectId, updated);
    await mutate(updated, false);
  }

  // ── 플랜 삭제 ──
  async function deletePlan(planId: string): Promise<void> {
    const updated = plans.filter((p) => p.id !== planId);
    savePlans(groupId, projectId, updated);
    await mutate(updated, false);
  }

  // ── 스텝 추가 ──
  async function addStep(
    planId: string,
    input: Omit<CurtainCallStep, "id" | "order">
  ): Promise<void> {
    const updated = plans.map((p) => {
      if (p.id !== planId) return p;
      const newStep: CurtainCallStep = {
        ...input,
        id: crypto.randomUUID(),
        order: p.steps.length + 1,
      };
      const newSteps = [...p.steps, newStep];
      const totalDuration = newSteps.reduce(
        (sum, s) => sum + (s.durationSeconds ?? 0),
        0
      );
      return { ...p, steps: newSteps, totalDuration };
    });
    savePlans(groupId, projectId, updated);
    await mutate(updated, false);
  }

  // ── 스텝 수정 ──
  async function updateStep(
    planId: string,
    stepId: string,
    changes: Partial<Omit<CurtainCallStep, "id" | "order">>
  ): Promise<void> {
    const updated = plans.map((p) => {
      if (p.id !== planId) return p;
      const newSteps = p.steps.map((s) =>
        s.id === stepId ? { ...s, ...changes } : s
      );
      const totalDuration = newSteps.reduce(
        (sum, s) => sum + (s.durationSeconds ?? 0),
        0
      );
      return { ...p, steps: newSteps, totalDuration };
    });
    savePlans(groupId, projectId, updated);
    await mutate(updated, false);
  }

  // ── 스텝 삭제 ──
  async function deleteStep(planId: string, stepId: string): Promise<void> {
    const updated = plans.map((p) => {
      if (p.id !== planId) return p;
      const newSteps = p.steps
        .filter((s) => s.id !== stepId)
        .map((s, idx) => ({ ...s, order: idx + 1 }));
      const totalDuration = newSteps.reduce(
        (sum, s) => sum + (s.durationSeconds ?? 0),
        0
      );
      return { ...p, steps: newSteps, totalDuration };
    });
    savePlans(groupId, projectId, updated);
    await mutate(updated, false);
  }

  // ── 스텝 순서 변경 ──
  async function reorderSteps(
    planId: string,
    stepIds: string[]
  ): Promise<void> {
    const updated = plans.map((p) => {
      if (p.id !== planId) return p;
      const stepMap = new Map(p.steps.map((s) => [s.id, s]));
      const newSteps = stepIds
        .map((id, idx) => {
          const step = stepMap.get(id);
          if (!step) return null;
          return { ...step, order: idx + 1 };
        })
        .filter((s): s is CurtainCallStep => s !== null);
      return { ...p, steps: newSteps };
    });
    savePlans(groupId, projectId, updated);
    await mutate(updated, false);
  }

  // ── 통계 ──
  const totalPlans = plans.length;
  const totalSteps = plans.reduce((sum, p) => sum + p.steps.length, 0);

  const stats = {
    totalPlans,
    totalSteps,
  };

  return {
    plans,
    loading: isLoading,
    refetch: () => mutate(),
    addPlan,
    updatePlan,
    deletePlan,
    addStep,
    updateStep,
    deleteStep,
    reorderSteps,
    stats,
  };
}
