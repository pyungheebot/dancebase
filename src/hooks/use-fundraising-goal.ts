"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { toast } from "sonner";
import type {
  FundraisingGoal,
  FundraisingContribution,
  FundraisingMilestone,
} from "@/types";

// ─── localStorage 헬퍼 ────────────────────────────────────────

function loadData(groupId: string): FundraisingGoal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`dancebase:fundraising:${groupId}`);
    if (!raw) return [];
    return JSON.parse(raw) as FundraisingGoal[];
  } catch {
    return [];
  }
}

function saveData(groupId: string, data: FundraisingGoal[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `dancebase:fundraising:${groupId}`,
      JSON.stringify(data)
    );
  } catch {
    /* ignore */
  }
}

// ─── 마일스톤 체크 헬퍼 ──────────────────────────────────────

const MILESTONE_PERCENTS = [25, 50, 75, 100] as const;

function checkMilestones(
  goal: FundraisingGoal,
  prevAmount: number
): FundraisingGoal {
  const newPercent =
    goal.targetAmount > 0
      ? (goal.currentAmount / goal.targetAmount) * 100
      : 0;
  const prevPercent =
    goal.targetAmount > 0 ? (prevAmount / goal.targetAmount) * 100 : 0;

  const now = new Date().toISOString();

  const updatedMilestones: FundraisingMilestone[] = MILESTONE_PERCENTS.map(
    (mp) => {
      const existing = goal.milestones.find((m) => m.percent === mp);
      if (existing?.reachedAt) return existing;
      if (newPercent >= mp && prevPercent < mp) {
        return { percent: mp, reachedAt: now };
      }
      return existing ?? { percent: mp };
    }
  );

  // 100% 도달 시 자동 완료
  const isCompleted = newPercent >= 100 && goal.status === "active";

  return {
    ...goal,
    milestones: updatedMilestones,
    status: isCompleted ? "completed" : goal.status,
  };
}

// ─── 훅 ─────────────────────────────────────────────────────

export function useFundraisingGoal(groupId: string) {
  const { data, mutate } = useSWR(
    groupId ? swrKeys.fundraisingGoal(groupId) : null,
    () => loadData(groupId),
    { revalidateOnFocus: false }
  );

  const goals = data ?? [];

  // ── 목표 추가 ────────────────────────────────────────────

  function addGoal(input: {
    title: string;
    description: string;
    targetAmount: number;
    deadline: string;
  }): boolean {
    if (!input.title.trim()) {
      toast.error("목표 제목을 입력해주세요.");
      return false;
    }
    if (input.targetAmount <= 0) {
      toast.error("목표 금액은 0보다 커야 합니다.");
      return false;
    }
    if (!input.deadline) {
      toast.error("마감일을 선택해주세요.");
      return false;
    }
    try {
      const stored = loadData(groupId);
      const newGoal: FundraisingGoal = {
        id: crypto.randomUUID(),
        title: input.title.trim(),
        description: input.description.trim(),
        targetAmount: input.targetAmount,
        currentAmount: 0,
        deadline: input.deadline,
        contributions: [],
        milestones: MILESTONE_PERCENTS.map((p) => ({ percent: p })),
        status: "active",
        createdAt: new Date().toISOString(),
      };
      const next = [...stored, newGoal];
      saveData(groupId, next);
      mutate(next, false);
      toast.success("모금 목표가 추가되었습니다.");
      return true;
    } catch {
      toast.error("모금 목표 추가에 실패했습니다.");
      return false;
    }
  }

  // ── 목표 삭제 ────────────────────────────────────────────

  function deleteGoal(goalId: string): boolean {
    try {
      const stored = loadData(groupId);
      const next = stored.filter((g) => g.id !== goalId);
      if (next.length === stored.length) return false;
      saveData(groupId, next);
      mutate(next, false);
      toast.success("모금 목표가 삭제되었습니다.");
      return true;
    } catch {
      toast.error("모금 목표 삭제에 실패했습니다.");
      return false;
    }
  }

  // ── 목표 수정 ────────────────────────────────────────────

  function updateGoal(
    goalId: string,
    patch: Partial<
      Pick<FundraisingGoal, "title" | "description" | "targetAmount" | "deadline">
    >
  ): boolean {
    try {
      const stored = loadData(groupId);
      const idx = stored.findIndex((g) => g.id === goalId);
      if (idx === -1) {
        toast.error("목표를 찾을 수 없습니다.");
        return false;
      }
      const updated = { ...stored[idx], ...patch };
      const next = stored.map((g) => (g.id === goalId ? updated : g));
      saveData(groupId, next);
      mutate(next, false);
      toast.success("모금 목표가 수정되었습니다.");
      return true;
    } catch {
      toast.error("모금 목표 수정에 실패했습니다.");
      return false;
    }
  }

  // ── 기부금 추가 ──────────────────────────────────────────

  function addContribution(
    goalId: string,
    contribution: Omit<FundraisingContribution, "id">
  ): boolean {
    if (!contribution.donorName.trim()) {
      toast.error("기부자 이름을 입력해주세요.");
      return false;
    }
    if (contribution.amount <= 0) {
      toast.error("기부 금액은 0보다 커야 합니다.");
      return false;
    }
    try {
      const stored = loadData(groupId);
      const idx = stored.findIndex((g) => g.id === goalId);
      if (idx === -1) {
        toast.error("목표를 찾을 수 없습니다.");
        return false;
      }
      const goal = stored[idx];
      if (goal.status !== "active") {
        toast.error("활성 상태의 목표에만 기부를 추가할 수 있습니다.");
        return false;
      }
      const newContribution: FundraisingContribution = {
        id: crypto.randomUUID(),
        donorName: contribution.donorName.trim(),
        amount: contribution.amount,
        date: contribution.date || new Date().toISOString().slice(0, 10),
        note: contribution.note.trim(),
      };
      const prevAmount = goal.currentAmount;
      const updatedGoal: FundraisingGoal = {
        ...goal,
        currentAmount: goal.currentAmount + newContribution.amount,
        contributions: [...goal.contributions, newContribution],
      };
      const withMilestones = checkMilestones(updatedGoal, prevAmount);
      const next = stored.map((g) => (g.id === goalId ? withMilestones : g));
      saveData(groupId, next);
      mutate(next, false);

      // 마일스톤 도달 알림
      const reachedMilestone = MILESTONE_PERCENTS.find((mp) => {
        const prev =
          goal.targetAmount > 0 ? (prevAmount / goal.targetAmount) * 100 : 0;
        const curr =
          goal.targetAmount > 0
            ? (withMilestones.currentAmount / goal.targetAmount) * 100
            : 0;
        return curr >= mp && prev < mp;
      });
      if (reachedMilestone === 100) {
        toast.success("목표 금액을 달성했습니다! 모금이 완료되었습니다.");
      } else if (reachedMilestone) {
        toast.success(`${reachedMilestone}% 달성! 기부가 추가되었습니다.`);
      } else {
        toast.success("기부금이 추가되었습니다.");
      }
      return true;
    } catch {
      toast.error("기부금 추가에 실패했습니다.");
      return false;
    }
  }

  // ── 모금 취소 ────────────────────────────────────────────

  function cancelGoal(goalId: string): boolean {
    try {
      const stored = loadData(groupId);
      const idx = stored.findIndex((g) => g.id === goalId);
      if (idx === -1) {
        toast.error("목표를 찾을 수 없습니다.");
        return false;
      }
      if (stored[idx].status === "cancelled") {
        toast.error("이미 취소된 목표입니다.");
        return false;
      }
      const next = stored.map((g) =>
        g.id === goalId ? { ...g, status: "cancelled" as const } : g
      );
      saveData(groupId, next);
      mutate(next, false);
      toast.success("모금이 취소되었습니다.");
      return true;
    } catch {
      toast.error("모금 취소에 실패했습니다.");
      return false;
    }
  }

  // ── 통계 ─────────────────────────────────────────────────

  const totalGoals = goals.length;
  const activeGoals = goals.filter((g) => g.status === "active").length;
  const completedGoals = goals.filter((g) => g.status === "completed").length;

  const totalTarget = goals
    .filter((g) => g.status !== "cancelled")
    .reduce((sum, g) => sum + g.targetAmount, 0);
  const totalCurrent = goals
    .filter((g) => g.status !== "cancelled")
    .reduce((sum, g) => sum + g.currentAmount, 0);
  const overallProgress =
    totalTarget > 0 ? Math.min((totalCurrent / totalTarget) * 100, 100) : 0;

  return {
    goals,
    // CRUD
    addGoal,
    deleteGoal,
    updateGoal,
    // 기부금
    addContribution,
    // 취소
    cancelGoal,
    // 통계
    totalGoals,
    activeGoals,
    completedGoals,
    overallProgress,
    totalTarget,
    totalCurrent,
    // SWR
    refetch: () => mutate(),
  };
}
