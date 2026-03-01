"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  MemberGoalEntry,
  MemberGoalCategory,
  MemberGoalPriority,
} from "@/types";

// ============================================
// 스토리지 헬퍼
// ============================================

function storageKey(groupId: string): string {
  return `dancebase:member-goal:${groupId}`;
}

function loadEntries(groupId: string): MemberGoalEntry[] {
  return loadFromStorage<MemberGoalEntry[]>(storageKey(groupId), []);
}

function saveEntries(groupId: string, entries: MemberGoalEntry[]): void {
  saveToStorage(storageKey(groupId), entries);
}

// ============================================
// 훅
// ============================================

export function useMemberGoal(groupId: string) {
  const { data: entries = [], mutate } = useSWR<MemberGoalEntry[]>(
    groupId ? swrKeys.memberGoal(groupId) : null,
    () => loadEntries(groupId),
    { fallbackData: [] }
  );

  // 내부 업데이트 헬퍼
  function persist(next: MemberGoalEntry[]) {
    saveEntries(groupId, next);
    mutate(next, false);
  }

  // ============================================
  // 목표 추가
  // ============================================

  function addGoal(params: {
    memberName: string;
    category: MemberGoalCategory;
    title: string;
    description: string;
    priority: MemberGoalPriority;
    targetDate: string;
    milestones: string[]; // 제목 목록 → 내부에서 객체 변환
  }) {
    const newGoal: MemberGoalEntry = {
      id: crypto.randomUUID(),
      memberName: params.memberName,
      category: params.category,
      title: params.title,
      description: params.description,
      priority: params.priority,
      targetDate: params.targetDate,
      progress: 0,
      milestones: params.milestones
        .filter((t) => t.trim())
        .map((title) => ({
          id: crypto.randomUUID(),
          title: title.trim(),
          completed: false,
        })),
      status: "active",
      createdAt: new Date().toISOString(),
    };
    persist([...entries, newGoal]);
  }

  // ============================================
  // 목표 수정
  // ============================================

  function updateGoal(id: string, patch: Partial<MemberGoalEntry>) {
    persist(
      entries.map((g) => (g.id === id ? { ...g, ...patch } : g))
    );
  }

  // ============================================
  // 목표 삭제
  // ============================================

  function deleteGoal(id: string) {
    persist(entries.filter((g) => g.id !== id));
  }

  // ============================================
  // 진행률 업데이트
  // ============================================

  function updateProgress(id: string, progress: number) {
    const clamped = Math.min(100, Math.max(0, Math.round(progress)));
    persist(
      entries.map((g) => {
        if (g.id !== id) return g;
        // 진행률 100% 도달 시 완료 처리
        const status = clamped === 100 ? "completed" : g.status;
        return { ...g, progress: clamped, status };
      })
    );
  }

  // ============================================
  // 마일스톤 체크 토글
  // ============================================

  function toggleMilestone(goalId: string, milestoneId: string) {
    persist(
      entries.map((g) => {
        if (g.id !== goalId) return g;
        const updatedMilestones = g.milestones.map((m) =>
          m.id === milestoneId ? { ...m, completed: !m.completed } : m
        );
        // 모든 마일스톤 완료 시 진행률 자동 계산
        const total = updatedMilestones.length;
        const completedCount = updatedMilestones.filter((m) => m.completed).length;
        const progress =
          total > 0 ? Math.round((completedCount / total) * 100) : g.progress;
        const status = progress === 100 ? "completed" : g.status;
        return { ...g, milestones: updatedMilestones, progress, status };
      })
    );
  }

  // ============================================
  // 상태 변경
  // ============================================

  function completeGoal(id: string) {
    persist(
      entries.map((g) =>
        g.id === id ? { ...g, status: "completed", progress: 100 } : g
      )
    );
  }

  function abandonGoal(id: string) {
    persist(
      entries.map((g) =>
        g.id === id ? { ...g, status: "abandoned" } : g
      )
    );
  }

  // ============================================
  // 필터링
  // ============================================

  function getByMember(memberName: string): MemberGoalEntry[] {
    return entries.filter((g) => g.memberName === memberName);
  }

  function getByCategory(category: MemberGoalCategory): MemberGoalEntry[] {
    return entries.filter((g) => g.category === category);
  }

  // ============================================
  // 통계
  // ============================================

  const totalGoals = entries.length;
  const activeGoals = entries.filter((g) => g.status === "active").length;
  const completedGoals = entries.filter((g) => g.status === "completed").length;
  const averageProgress =
    totalGoals > 0
      ? Math.round(entries.reduce((sum, g) => sum + g.progress, 0) / totalGoals)
      : 0;

  const categoryDistribution: Record<MemberGoalCategory, number> = {
    technique: 0,
    flexibility: 0,
    stamina: 0,
    performance: 0,
    attendance: 0,
    leadership: 0,
    other: 0,
  };
  for (const g of entries) {
    categoryDistribution[g.category] = (categoryDistribution[g.category] ?? 0) + 1;
  }

  return {
    entries,
    totalGoals,
    activeGoals,
    completedGoals,
    averageProgress,
    categoryDistribution,
    addGoal,
    updateGoal,
    deleteGoal,
    updateProgress,
    toggleMilestone,
    completeGoal,
    abandonGoal,
    getByMember,
    getByCategory,
    refetch: () => mutate(),
  };
}
