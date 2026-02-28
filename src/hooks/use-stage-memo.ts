"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  StageMemoBoard,
  StageMemoNote,
  StageMemoZone,
  StageMemoPriority,
} from "@/types";

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(groupId: string, projectId: string): string {
  return `dancebase:stage-memo:${groupId}:${projectId}`;
}

function loadData(groupId: string, projectId: string): StageMemoBoard[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(groupId, projectId));
    if (!raw) return [];
    return JSON.parse(raw) as StageMemoBoard[];
  } catch {
    return [];
  }
}

function saveData(
  groupId: string,
  projectId: string,
  data: StageMemoBoard[]
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId, projectId), JSON.stringify(data));
  } catch {
    // 무시
  }
}

// ============================================================
// 통계 타입
// ============================================================

export type StageMemoStats = {
  totalNotes: number;
  unresolvedNotes: number;
  highPriorityNotes: number;
};

// ============================================================
// 훅
// ============================================================

export function useStageMemo(groupId: string, projectId: string) {
  const [boards, setBoards] = useState<StageMemoBoard[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    if (!groupId || !projectId) return;
    const data = loadData(groupId, projectId);
    setBoards(data);
    setLoading(false);
  }, [groupId, projectId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const persist = useCallback(
    (next: StageMemoBoard[]) => {
      saveData(groupId, projectId, next);
      setBoards(next);
    },
    [groupId, projectId]
  );

  // 보드 추가
  const addBoard = useCallback(
    (title: string): StageMemoBoard => {
      const board: StageMemoBoard = {
        id: crypto.randomUUID(),
        projectId,
        title,
        notes: [],
        createdAt: new Date().toISOString(),
      };
      persist([...boards, board]);
      return board;
    },
    [boards, persist, projectId]
  );

  // 보드 삭제
  const deleteBoard = useCallback(
    (boardId: string): boolean => {
      const next = boards.filter((b) => b.id !== boardId);
      if (next.length === boards.length) return false;
      persist(next);
      return true;
    },
    [boards, persist]
  );

  // 메모 추가
  const addNote = useCallback(
    (
      boardId: string,
      note: Omit<StageMemoNote, "id" | "isResolved" | "createdAt">
    ): StageMemoNote | null => {
      const boardIdx = boards.findIndex((b) => b.id === boardId);
      if (boardIdx === -1) return null;

      const newNote: StageMemoNote = {
        id: crypto.randomUUID(),
        ...note,
        isResolved: false,
        createdAt: new Date().toISOString(),
      };

      const next = [...boards];
      next[boardIdx] = {
        ...next[boardIdx],
        notes: [...next[boardIdx].notes, newNote],
      };
      persist(next);
      return newNote;
    },
    [boards, persist]
  );

  // 메모 수정
  const updateNote = useCallback(
    (
      boardId: string,
      noteId: string,
      partial: Partial<Omit<StageMemoNote, "id" | "createdAt">>
    ): boolean => {
      const boardIdx = boards.findIndex((b) => b.id === boardId);
      if (boardIdx === -1) return false;

      const noteIdx = boards[boardIdx].notes.findIndex((n) => n.id === noteId);
      if (noteIdx === -1) return false;

      const next = [...boards];
      const updatedNotes = [...next[boardIdx].notes];
      updatedNotes[noteIdx] = { ...updatedNotes[noteIdx], ...partial };
      next[boardIdx] = { ...next[boardIdx], notes: updatedNotes };
      persist(next);
      return true;
    },
    [boards, persist]
  );

  // 메모 삭제
  const deleteNote = useCallback(
    (boardId: string, noteId: string): boolean => {
      const boardIdx = boards.findIndex((b) => b.id === boardId);
      if (boardIdx === -1) return false;

      const filtered = boards[boardIdx].notes.filter((n) => n.id !== noteId);
      if (filtered.length === boards[boardIdx].notes.length) return false;

      const next = [...boards];
      next[boardIdx] = { ...next[boardIdx], notes: filtered };
      persist(next);
      return true;
    },
    [boards, persist]
  );

  // 해결 여부 토글
  const toggleResolved = useCallback(
    (boardId: string, noteId: string): boolean => {
      const boardIdx = boards.findIndex((b) => b.id === boardId);
      if (boardIdx === -1) return false;

      const noteIdx = boards[boardIdx].notes.findIndex((n) => n.id === noteId);
      if (noteIdx === -1) return false;

      const note = boards[boardIdx].notes[noteIdx];
      const next = [...boards];
      const updatedNotes = [...next[boardIdx].notes];
      updatedNotes[noteIdx] = { ...note, isResolved: !note.isResolved };
      next[boardIdx] = { ...next[boardIdx], notes: updatedNotes };
      persist(next);
      return true;
    },
    [boards, persist]
  );

  // 구역별 메모 조회
  const getNotesByZone = useCallback(
    (boardId: string): Record<StageMemoZone, StageMemoNote[]> => {
      const ALL_ZONES: StageMemoZone[] = [
        "upstage-left",
        "upstage-center",
        "upstage-right",
        "center-left",
        "center",
        "center-right",
        "downstage-left",
        "downstage-center",
        "downstage-right",
      ];

      const empty = ALL_ZONES.reduce(
        (acc, zone) => {
          acc[zone] = [];
          return acc;
        },
        {} as Record<StageMemoZone, StageMemoNote[]>
      );

      const board = boards.find((b) => b.id === boardId);
      if (!board) return empty;

      return board.notes.reduce(
        (acc, note) => {
          acc[note.zone] = [...(acc[note.zone] ?? []), note];
          return acc;
        },
        { ...empty }
      );
    },
    [boards]
  );

  // 통계 (전체 보드 합산)
  const stats: StageMemoStats = (() => {
    const allNotes = boards.flatMap((b) => b.notes);
    return {
      totalNotes: allNotes.length,
      unresolvedNotes: allNotes.filter((n) => !n.isResolved).length,
      highPriorityNotes: allNotes.filter(
        (n) => n.priority === "high" && !n.isResolved
      ).length,
    };
  })();

  return {
    boards,
    loading,
    addBoard,
    deleteBoard,
    addNote,
    updateNote,
    deleteNote,
    toggleResolved,
    getNotesByZone,
    stats,
    refetch: reload,
  };
}
