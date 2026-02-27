"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { ShowTimeline, ShowMilestone, ShowMilestoneStatus } from "@/types";

// ============================================
// localStorage 키
// ============================================

const LS_KEY = (groupId: string, projectId: string) =>
  `dancebase:show-timeline:${groupId}:${projectId}`;

// ============================================
// localStorage 헬퍼
// ============================================

function loadData(groupId: string, projectId: string): ShowTimeline | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_KEY(groupId, projectId));
    return raw ? (JSON.parse(raw) as ShowTimeline) : null;
  } catch {
    return null;
  }
}

function saveData(
  groupId: string,
  projectId: string,
  data: ShowTimeline
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY(groupId, projectId), JSON.stringify(data));
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

function removeData(groupId: string, projectId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LS_KEY(groupId, projectId));
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

// ============================================
// ID 생성 헬퍼
// ============================================

function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ============================================
// 훅
// ============================================

export function useShowTimeline(groupId: string, projectId: string) {
  const swrKey =
    groupId && projectId
      ? swrKeys.showTimeline(groupId, projectId)
      : null;

  const { data, mutate } = useSWR(
    swrKey,
    () => loadData(groupId, projectId),
    { revalidateOnFocus: false }
  );

  const timeline: ShowTimeline | null = data ?? null;

  // ── 타임라인 생성 ──────────────────────────────────────────

  function createTimeline(showName: string, showDate: string): void {
    const newTimeline: ShowTimeline = {
      id: genId("timeline"),
      showName: showName.trim(),
      showDate,
      milestones: [],
      createdAt: new Date().toISOString(),
    };
    saveData(groupId, projectId, newTimeline);
    mutate(newTimeline, false);
  }

  // ── 타임라인 삭제 ──────────────────────────────────────────

  function deleteTimeline(): void {
    removeData(groupId, projectId);
    mutate(null, false);
  }

  // ── 마일스톤 추가 ──────────────────────────────────────────

  function addMilestone(
    title: string,
    description: string,
    dueDate: string,
    assignee: string
  ): void {
    if (!timeline) return;
    const newMilestone: ShowMilestone = {
      id: genId("milestone"),
      title: title.trim(),
      description: description.trim(),
      dueDate,
      status: "pending",
      assignee: assignee.trim(),
      order: timeline.milestones.length,
    };
    const updated: ShowTimeline = {
      ...timeline,
      milestones: [...timeline.milestones, newMilestone],
    };
    saveData(groupId, projectId, updated);
    mutate(updated, false);
  }

  // ── 마일스톤 수정 ──────────────────────────────────────────

  function updateMilestone(
    milestoneId: string,
    patch: Partial<Omit<ShowMilestone, "id" | "order">>
  ): void {
    if (!timeline) return;
    const now = new Date().toISOString();
    const updated: ShowTimeline = {
      ...timeline,
      milestones: timeline.milestones.map((m) => {
        if (m.id !== milestoneId) return m;
        const next = { ...m, ...patch };
        // 완료 상태로 변경 시 completedAt 자동 설정
        if (patch.status === "completed" && !m.completedAt) {
          next.completedAt = now;
        }
        // 완료 취소 시 completedAt 제거
        if (patch.status && patch.status !== "completed") {
          next.completedAt = undefined;
        }
        return next;
      }),
    };
    saveData(groupId, projectId, updated);
    mutate(updated, false);
  }

  // ── 마일스톤 삭제 ──────────────────────────────────────────

  function deleteMilestone(milestoneId: string): void {
    if (!timeline) return;
    const filtered = timeline.milestones
      .filter((m) => m.id !== milestoneId)
      .map((m, i) => ({ ...m, order: i }));
    const updated: ShowTimeline = { ...timeline, milestones: filtered };
    saveData(groupId, projectId, updated);
    mutate(updated, false);
  }

  // ── 마일스톤 순서 변경 ─────────────────────────────────────

  function reorderMilestone(milestoneId: string, direction: "up" | "down"): void {
    if (!timeline) return;
    const idx = timeline.milestones.findIndex((m) => m.id === milestoneId);
    if (idx === -1) return;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= timeline.milestones.length) return;

    const reordered = [...timeline.milestones];
    [reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]];
    const withOrder = reordered.map((m, i) => ({ ...m, order: i }));

    const updated: ShowTimeline = { ...timeline, milestones: withOrder };
    saveData(groupId, projectId, updated);
    mutate(updated, false);
  }

  // ── 통계 ──────────────────────────────────────────────────

  const milestones = timeline?.milestones ?? [];
  const totalMilestones = milestones.length;
  const completedCount = milestones.filter(
    (m) => m.status === "completed"
  ).length;
  const delayedCount = milestones.filter(
    (m) => m.status === "delayed"
  ).length;
  const progressRate =
    totalMilestones > 0
      ? Math.round((completedCount / totalMilestones) * 100)
      : 0;

  return {
    timeline,
    loading: data === undefined,
    // 액션
    createTimeline,
    deleteTimeline,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    reorderMilestone,
    // 통계
    totalMilestones,
    completedCount,
    delayedCount,
    progressRate,
    refetch: () => mutate(),
  };
}
