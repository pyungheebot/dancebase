"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { swrKeys } from "@/lib/swr/keys";
import type {
  RehearsalScheduleData,
  RehearsalScheduleItem,
  RehearsalScheduleCheckItem as RehearsalCheckItem,
  RehearsalScheduleType as RehearsalType,
  RehearsalScheduleStatus as RehearsalStatus,
} from "@/types";

// ——————————————————————————————
// localStorage 헬퍼
// ——————————————————————————————

function loadData(projectId: string): RehearsalScheduleData {
  if (typeof window === "undefined") {
    return {
      projectId,
      rehearsals: [],
      updatedAt: new Date().toISOString(),
    };
  }
  try {
    const raw = localStorage.getItem(`rehearsal-schedule-${projectId}`);
    if (!raw) {
      return {
        projectId,
        rehearsals: [],
        updatedAt: new Date().toISOString(),
      };
    }
    return JSON.parse(raw) as RehearsalScheduleData;
  } catch {
    return {
      projectId,
      rehearsals: [],
      updatedAt: new Date().toISOString(),
    };
  }
}

function persistData(data: RehearsalScheduleData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `rehearsal-schedule-${data.projectId}`,
      JSON.stringify({ ...data, updatedAt: new Date().toISOString() })
    );
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

// ——————————————————————————————
// 파라미터 타입
// ——————————————————————————————

export type AddRehearsalParams = {
  title: string;
  date: string;
  startTime: string;
  endTime: string | null;
  location: string | null;
  type: RehearsalType;
  participants: string[];
  notes: string;
};

export type UpdateRehearsalParams = Partial<
  Omit<RehearsalScheduleItem, "id" | "createdAt" | "checklist">
>;

// ——————————————————————————————
// 훅
// ——————————————————————————————

export function useRehearsalSchedule(projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.rehearsalSchedule(projectId),
    () => loadData(projectId),
    { revalidateOnFocus: false }
  );

  const scheduleData: RehearsalScheduleData = data ?? {
    projectId,
    rehearsals: [],
    updatedAt: new Date().toISOString(),
  };

  // ——— 리허설 추가 ———
  const addRehearsal = useCallback(
    (params: AddRehearsalParams) => {
      const current = loadData(projectId);
      const newRehearsal: RehearsalScheduleItem = {
        id: crypto.randomUUID(),
        title: params.title,
        date: params.date,
        startTime: params.startTime,
        endTime: params.endTime,
        location: params.location,
        type: params.type,
        participants: params.participants,
        checklist: [],
        notes: params.notes,
        status: "scheduled",
        createdAt: new Date().toISOString(),
      };
      const updated: RehearsalScheduleData = {
        ...current,
        rehearsals: [...current.rehearsals, newRehearsal],
        updatedAt: new Date().toISOString(),
      };
      persistData(updated);
      mutate(updated, false);
    },
    [projectId, mutate]
  );

  // ——— 리허설 수정 ———
  const updateRehearsal = useCallback(
    (rehearsalId: string, params: UpdateRehearsalParams) => {
      const current = loadData(projectId);
      const updated: RehearsalScheduleData = {
        ...current,
        rehearsals: current.rehearsals.map((r) =>
          r.id !== rehearsalId ? r : { ...r, ...params }
        ),
        updatedAt: new Date().toISOString(),
      };
      persistData(updated);
      mutate(updated, false);
    },
    [projectId, mutate]
  );

  // ——— 리허설 삭제 ———
  const deleteRehearsal = useCallback(
    (rehearsalId: string) => {
      const current = loadData(projectId);
      const updated: RehearsalScheduleData = {
        ...current,
        rehearsals: current.rehearsals.filter((r) => r.id !== rehearsalId),
        updatedAt: new Date().toISOString(),
      };
      persistData(updated);
      mutate(updated, false);
    },
    [projectId, mutate]
  );

  // ——— 체크리스트 항목 토글 ———
  const toggleCheckItem = useCallback(
    (rehearsalId: string, itemId: string) => {
      const current = loadData(projectId);
      const updated: RehearsalScheduleData = {
        ...current,
        rehearsals: current.rehearsals.map((r) => {
          if (r.id !== rehearsalId) return r;
          return {
            ...r,
            checklist: r.checklist.map((item) =>
              item.id !== itemId
                ? item
                : { ...item, isChecked: !item.isChecked }
            ),
          };
        }),
        updatedAt: new Date().toISOString(),
      };
      persistData(updated);
      mutate(updated, false);
    },
    [projectId, mutate]
  );

  // ——— 체크리스트 항목 추가 ———
  const addCheckItem = useCallback(
    (rehearsalId: string, title: string) => {
      const current = loadData(projectId);
      const newItem: RehearsalCheckItem = {
        id: crypto.randomUUID(),
        title,
        isChecked: false,
      };
      const updated: RehearsalScheduleData = {
        ...current,
        rehearsals: current.rehearsals.map((r) => {
          if (r.id !== rehearsalId) return r;
          return { ...r, checklist: [...r.checklist, newItem] };
        }),
        updatedAt: new Date().toISOString(),
      };
      persistData(updated);
      mutate(updated, false);
    },
    [projectId, mutate]
  );

  // ——— 체크리스트 항목 삭제 ———
  const removeCheckItem = useCallback(
    (rehearsalId: string, itemId: string) => {
      const current = loadData(projectId);
      const updated: RehearsalScheduleData = {
        ...current,
        rehearsals: current.rehearsals.map((r) => {
          if (r.id !== rehearsalId) return r;
          return {
            ...r,
            checklist: r.checklist.filter((item) => item.id !== itemId),
          };
        }),
        updatedAt: new Date().toISOString(),
      };
      persistData(updated);
      mutate(updated, false);
    },
    [projectId, mutate]
  );

  // ——— 리허설 완료 처리 ———
  const completeRehearsal = useCallback(
    (rehearsalId: string) => {
      const current = loadData(projectId);
      const updated: RehearsalScheduleData = {
        ...current,
        rehearsals: current.rehearsals.map((r) =>
          r.id !== rehearsalId
            ? r
            : { ...r, status: "completed" as RehearsalStatus }
        ),
        updatedAt: new Date().toISOString(),
      };
      persistData(updated);
      mutate(updated, false);
    },
    [projectId, mutate]
  );

  // ——— 리허설 취소 처리 ———
  const cancelRehearsal = useCallback(
    (rehearsalId: string) => {
      const current = loadData(projectId);
      const updated: RehearsalScheduleData = {
        ...current,
        rehearsals: current.rehearsals.map((r) =>
          r.id !== rehearsalId
            ? r
            : { ...r, status: "cancelled" as RehearsalStatus }
        ),
        updatedAt: new Date().toISOString(),
      };
      persistData(updated);
      mutate(updated, false);
    },
    [projectId, mutate]
  );

  // ——————————————————————————————
  // 통계 계산
  // ——————————————————————————————

  const rehearsals = scheduleData.rehearsals;

  // 전체 리허설 수
  const totalRehearsals = rehearsals.length;

  // 완료된 리허설 수
  const completedCount = rehearsals.filter(
    (r) => r.status === "completed"
  ).length;

  // 다가오는 리허설 (예정 상태 + 오늘 이후, 날짜순)
  const today = new Date().toISOString().split("T")[0];
  const upcomingRehearsals = rehearsals
    .filter((r) => r.status === "scheduled" && r.date >= today)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });

  // 체크리스트 전체 진행률
  const allCheckItems = rehearsals.flatMap((r) => r.checklist);
  const totalCheckItems = allCheckItems.length;
  const checkedItems = allCheckItems.filter((item) => item.isChecked).length;
  const checklistProgress =
    totalCheckItems === 0
      ? 0
      : Math.round((checkedItems / totalCheckItems) * 100);

  return {
    scheduleData,
    loading: isLoading,
    refetch: () => mutate(),
    // CRUD
    addRehearsal,
    updateRehearsal,
    deleteRehearsal,
    // 체크리스트
    toggleCheckItem,
    addCheckItem,
    removeCheckItem,
    // 상태 변경
    completeRehearsal,
    cancelRehearsal,
    // 통계
    totalRehearsals,
    completedCount,
    upcomingRehearsals,
    checklistProgress,
    totalCheckItems,
    checkedItems,
  };
}
