"use client";

import { useState, useCallback } from "react";
import { swrKeys } from "@/lib/swr/keys";
import type {
  MentalCoachingNote,
  MentalCoachingData,
  MentalCoachingTopic,
  MentalCoachingStatus,
  MentalCoachingActionItem,
} from "@/types";

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(groupId: string): string {
  return swrKeys.mentalCoaching(groupId);
}

function loadData(groupId: string): MentalCoachingData {
  if (typeof window === "undefined") {
    return { groupId, notes: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) return { groupId, notes: [], updatedAt: new Date().toISOString() };
    return JSON.parse(raw) as MentalCoachingData;
  } catch {
    return { groupId, notes: [], updatedAt: new Date().toISOString() };
  }
}

function saveData(data: MentalCoachingData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(data.groupId), JSON.stringify(data));
  } catch {
    // 무시
  }
}

// ============================================================
// 통계 타입
// ============================================================

export type MentalCoachingStats = {
  /** 전체 노트 수 */
  totalNotes: number;
  /** 주제별 분포 */
  topicDistribution: { topic: MentalCoachingTopic; count: number }[];
  /** 평균 에너지 레벨 */
  avgEnergyLevel: number;
  /** 상태별 분포 */
  statusDistribution: { status: MentalCoachingStatus; count: number }[];
  /** 완료된 액션 아이템 수 */
  doneActionItems: number;
  /** 전체 액션 아이템 수 */
  totalActionItems: number;
};

// ============================================================
// 훅
// ============================================================

export function useMentalCoaching(groupId: string) {
  const [notes, setNotes] = useState<MentalCoachingNote[]>(() => loadData(groupId).notes);

  // localStorage에서 데이터 불러오기
  const reload = useCallback(() => {
    if (!groupId) return;
    const data = loadData(groupId);
    setNotes(data.notes);
  }, [groupId]);

  // 내부 저장 헬퍼
  const persist = useCallback(
    (updated: MentalCoachingNote[]) => {
      const data: MentalCoachingData = {
        groupId,
        notes: updated,
        updatedAt: new Date().toISOString(),
      };
      saveData(data);
      setNotes(updated);
    },
    [groupId]
  );

  // 노트 추가
  const addNote = useCallback(
    (params: {
      memberName: string;
      coachName: string;
      date: string;
      topic: MentalCoachingTopic;
      content: string;
      energyLevel: number;
      actionItems: Omit<MentalCoachingActionItem, "id">[];
      status: MentalCoachingStatus;
    }): MentalCoachingNote => {
      const now = new Date().toISOString();
      const newNote: MentalCoachingNote = {
        id: crypto.randomUUID(),
        memberName: params.memberName,
        coachName: params.coachName,
        date: params.date,
        topic: params.topic,
        content: params.content,
        energyLevel: params.energyLevel,
        actionItems: params.actionItems.map((a) => ({
          ...a,
          id: crypto.randomUUID(),
        })),
        status: params.status,
        createdAt: now,
        updatedAt: now,
      };
      persist([...notes, newNote]);
      return newNote;
    },
    [notes, persist]
  );

  // 노트 수정
  const updateNote = useCallback(
    (
      noteId: string,
      params: Partial<Omit<MentalCoachingNote, "id" | "createdAt">>
    ): boolean => {
      const idx = notes.findIndex((n) => n.id === noteId);
      if (idx === -1) return false;
      const updated = notes.map((n) =>
        n.id === noteId
          ? { ...n, ...params, updatedAt: new Date().toISOString() }
          : n
      );
      persist(updated);
      return true;
    },
    [notes, persist]
  );

  // 노트 삭제
  const deleteNote = useCallback(
    (noteId: string): boolean => {
      const exists = notes.some((n) => n.id === noteId);
      if (!exists) return false;
      persist(notes.filter((n) => n.id !== noteId));
      return true;
    },
    [notes, persist]
  );

  // 액션 아이템 완료 토글
  const toggleActionItem = useCallback(
    (noteId: string, actionItemId: string): boolean => {
      const note = notes.find((n) => n.id === noteId);
      if (!note) return false;
      const updatedItems = note.actionItems.map((a) =>
        a.id === actionItemId ? { ...a, done: !a.done } : a
      );
      return updateNote(noteId, { actionItems: updatedItems });
    },
    [notes, updateNote]
  );

  // 상태 변경
  const updateStatus = useCallback(
    (noteId: string, status: MentalCoachingStatus): boolean => {
      return updateNote(noteId, { status });
    },
    [updateNote]
  );

  // 통계 계산
  const stats: MentalCoachingStats = (() => {
    if (notes.length === 0) {
      return {
        totalNotes: 0,
        topicDistribution: [],
        avgEnergyLevel: 0,
        statusDistribution: [],
        doneActionItems: 0,
        totalActionItems: 0,
      };
    }

    const TOPICS: MentalCoachingTopic[] = [
      "자신감",
      "무대 공포증",
      "동기부여",
      "팀워크",
      "스트레스 관리",
      "목표 설정",
    ];
    const STATUSES: MentalCoachingStatus[] = ["진행중", "개선됨", "해결됨"];

    const topicDistribution = TOPICS.map((topic) => ({
      topic,
      count: notes.filter((n) => n.topic === topic).length,
    })).filter((t) => t.count > 0);

    const avgEnergyLevel =
      Math.round(
        (notes.reduce((acc, n) => acc + n.energyLevel, 0) / notes.length) * 10
      ) / 10;

    const statusDistribution = STATUSES.map((status) => ({
      status,
      count: notes.filter((n) => n.status === status).length,
    })).filter((s) => s.count > 0);

    const allActions = notes.flatMap((n) => n.actionItems);
    const doneActionItems = allActions.filter((a) => a.done).length;

    return {
      totalNotes: notes.length,
      topicDistribution,
      avgEnergyLevel,
      statusDistribution,
      doneActionItems,
      totalActionItems: allActions.length,
    };
  })();

  return {
    notes,
    loading: false,
    stats,
    addNote,
    updateNote,
    deleteNote,
    toggleActionItem,
    updateStatus,
    refetch: reload,
  };
}
