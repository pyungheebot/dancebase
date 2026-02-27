"use client";

import { useState, useCallback } from "react";
import type {
  PracticeAssignment,
  AssignmentPriority,
  AssignmentProgress,
  AssignmentMemberStatus,
} from "@/types";

// ============================================
// localStorage 키 및 헬퍼
// ============================================

function storageKey(groupId: string): string {
  return `dancebase:practice-assignments:${groupId}`;
}

function loadAssignments(groupId: string): PracticeAssignment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as PracticeAssignment[];
  } catch {
    return [];
  }
}

function saveAssignments(groupId: string, assignments: PracticeAssignment[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId), JSON.stringify(assignments));
  } catch {
    // 무시
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ============================================
// 전체 진행률 계산
// ============================================

/**
 * 과제 목록 전체에서 완료 상태 비율(0~100)을 반환한다.
 */
export function calcOverallProgress(assignments: PracticeAssignment[]): number {
  const allStatuses = assignments.flatMap((a) => a.memberStatuses);
  if (allStatuses.length === 0) return 0;
  const completed = allStatuses.filter((s) => s.progress === "completed").length;
  return Math.round((completed / allStatuses.length) * 100);
}

/**
 * 단일 과제의 완료 비율(0~100)을 반환한다.
 */
export function calcAssignmentProgress(assignment: PracticeAssignment): number {
  if (assignment.memberStatuses.length === 0) return 0;
  const completed = assignment.memberStatuses.filter(
    (s) => s.progress === "completed"
  ).length;
  return Math.round((completed / assignment.memberStatuses.length) * 100);
}

// ============================================
// usePracticeAssignments 훅
// ============================================

export function usePracticeAssignments(groupId: string) {
  const [assignments, setAssignments] = useState<PracticeAssignment[]>(() =>
    loadAssignments(groupId)
  );

  // 상태 업데이트 헬퍼 — 저장 포함
  const update = useCallback(
    (updater: (prev: PracticeAssignment[]) => PracticeAssignment[]) => {
      setAssignments((prev) => {
        const next = updater(prev);
        saveAssignments(groupId, next);
        return next;
      });
    },
    [groupId]
  );

  // ============================================
  // CRUD
  // ============================================

  /** 새 과제 생성 */
  const createAssignment = useCallback(
    (params: {
      title: string;
      description: string;
      memberIds: { userId: string; userName: string }[];
      priority: AssignmentPriority;
      dueDate: string | null;
      createdBy: string;
    }) => {
      const now = new Date().toISOString();
      const memberStatuses: AssignmentMemberStatus[] = params.memberIds.map(
        (m) => ({
          userId: m.userId,
          userName: m.userName,
          progress: "not_started",
          note: "",
          updatedAt: now,
        })
      );

      const assignment: PracticeAssignment = {
        id: generateId(),
        groupId,
        title: params.title,
        description: params.description,
        memberStatuses,
        priority: params.priority,
        dueDate: params.dueDate,
        createdBy: params.createdBy,
        createdAt: now,
      };

      update((prev) => [assignment, ...prev]);
      return assignment;
    },
    [groupId, update]
  );

  /** 과제 수정 */
  const updateAssignment = useCallback(
    (
      assignmentId: string,
      params: Partial<
        Pick<PracticeAssignment, "title" | "description" | "priority" | "dueDate">
      >
    ) => {
      update((prev) =>
        prev.map((a) =>
          a.id === assignmentId ? { ...a, ...params } : a
        )
      );
    },
    [update]
  );

  /** 과제 삭제 */
  const deleteAssignment = useCallback(
    (assignmentId: string) => {
      update((prev) => prev.filter((a) => a.id !== assignmentId));
    },
    [update]
  );

  // ============================================
  // 멤버별 진행 상태 업데이트
  // ============================================

  /** 특정 멤버의 진행 상태 및 메모 업데이트 */
  const updateMemberStatus = useCallback(
    (
      assignmentId: string,
      userId: string,
      progress: AssignmentProgress,
      note?: string
    ) => {
      const now = new Date().toISOString();
      update((prev) =>
        prev.map((a) => {
          if (a.id !== assignmentId) return a;
          return {
            ...a,
            memberStatuses: a.memberStatuses.map((s) =>
              s.userId === userId
                ? {
                    ...s,
                    progress,
                    note: note !== undefined ? note : s.note,
                    updatedAt: now,
                  }
                : s
            ),
          };
        })
      );
    },
    [update]
  );

  // ============================================
  // 파생 데이터
  // ============================================

  /** 진행 중인 과제 수 (not_started + in_progress 포함) */
  const activeCount = assignments.filter((a) =>
    a.memberStatuses.some((s) => s.progress !== "completed")
  ).length;

  /** 전체 진행률 (0~100) */
  const overallProgress = calcOverallProgress(assignments);

  return {
    assignments,
    activeCount,
    overallProgress,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    updateMemberStatus,
  };
}
