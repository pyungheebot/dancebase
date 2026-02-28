"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { toast } from "sonner";
import { swrKeys } from "@/lib/swr/keys";
import type {
  StageBlockingEntry,
  StageBlockingNote,
  StageBlockingMemberMove,
  StageBlockingPosition,
  StageBlockingDirection,
} from "@/types";

// ============================================================
// localStorage 유틸
// ============================================================

function getStorageKey(groupId: string, projectId: string): string {
  return `dancebase:stage-blocking:${groupId}:${projectId}`;
}

function loadEntry(groupId: string, projectId: string): StageBlockingEntry {
  if (typeof window === "undefined") {
    return { groupId, projectId, notes: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(getStorageKey(groupId, projectId));
    if (raw) return JSON.parse(raw) as StageBlockingEntry;
  } catch {
    // 파싱 실패 시 빈 데이터 반환
  }
  return { groupId, projectId, notes: [], updatedAt: new Date().toISOString() };
}

function saveEntry(entry: StageBlockingEntry): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      getStorageKey(entry.groupId, entry.projectId),
      JSON.stringify(entry)
    );
  } catch {
    // localStorage 쓰기 실패 무시
  }
}

// ============================================================
// 입력 타입
// ============================================================

export type AddStageBlockingInput = {
  songTitle: string;
  sceneNumber?: string;
  timeStart?: string;
  timeEnd?: string;
  countStart?: number;
  countEnd?: number;
  formation?: string;
  memberMoves: StageBlockingMemberMove[];
  caution?: string;
  memo?: string;
};

export type UpdateStageBlockingInput = Partial<AddStageBlockingInput>;

export type AddMemberMoveInput = {
  memberName: string;
  fromPosition: StageBlockingPosition;
  toPosition: StageBlockingPosition;
  direction?: StageBlockingDirection;
  note?: string;
};

// ============================================================
// 훅
// ============================================================

export function useStageBlocking(groupId: string, projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId && projectId ? swrKeys.stageBlocking(groupId, projectId) : null,
    async () => loadEntry(groupId, projectId)
  );

  const entry = data ?? {
    groupId,
    projectId,
    notes: [],
    updatedAt: new Date().toISOString(),
  };

  // 순서 기준으로 정렬
  const notes = [...entry.notes].sort((a, b) => a.order - b.order);

  // ── 동선 노트 추가 ──
  const addNote = useCallback(
    async (input: AddStageBlockingInput): Promise<boolean> => {
      if (!input.songTitle.trim()) {
        toast.error("곡 제목을 입력해주세요");
        return false;
      }

      const current = loadEntry(groupId, projectId);
      const now = new Date().toISOString();
      const maxOrder =
        current.notes.length > 0
          ? Math.max(...current.notes.map((n) => n.order))
          : 0;

      const newNote: StageBlockingNote = {
        id: crypto.randomUUID(),
        songTitle: input.songTitle.trim(),
        sceneNumber: input.sceneNumber?.trim() || undefined,
        timeStart: input.timeStart?.trim() || undefined,
        timeEnd: input.timeEnd?.trim() || undefined,
        countStart: input.countStart ?? undefined,
        countEnd: input.countEnd ?? undefined,
        formation: input.formation?.trim() || undefined,
        memberMoves: input.memberMoves,
        caution: input.caution?.trim() || undefined,
        memo: input.memo?.trim() || undefined,
        order: maxOrder + 1,
        createdAt: now,
        updatedAt: now,
      };

      const updated: StageBlockingEntry = {
        ...current,
        notes: [...current.notes, newNote],
        updatedAt: now,
      };
      saveEntry(updated);
      await mutate(updated, false);
      toast.success("동선 노트가 추가되었습니다");
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 동선 노트 수정 ──
  const updateNote = useCallback(
    async (id: string, changes: UpdateStageBlockingInput): Promise<boolean> => {
      const current = loadEntry(groupId, projectId);
      const target = current.notes.find((n) => n.id === id);
      if (!target) {
        toast.error("노트를 찾을 수 없습니다");
        return false;
      }

      if (changes.songTitle !== undefined && !changes.songTitle.trim()) {
        toast.error("곡 제목을 입력해주세요");
        return false;
      }

      const now = new Date().toISOString();
      const updated: StageBlockingEntry = {
        ...current,
        notes: current.notes.map((n) =>
          n.id === id
            ? {
                ...n,
                songTitle:
                  changes.songTitle !== undefined
                    ? changes.songTitle.trim()
                    : n.songTitle,
                sceneNumber:
                  changes.sceneNumber !== undefined
                    ? changes.sceneNumber?.trim() || undefined
                    : n.sceneNumber,
                timeStart:
                  changes.timeStart !== undefined
                    ? changes.timeStart?.trim() || undefined
                    : n.timeStart,
                timeEnd:
                  changes.timeEnd !== undefined
                    ? changes.timeEnd?.trim() || undefined
                    : n.timeEnd,
                countStart:
                  changes.countStart !== undefined
                    ? changes.countStart
                    : n.countStart,
                countEnd:
                  changes.countEnd !== undefined
                    ? changes.countEnd
                    : n.countEnd,
                formation:
                  changes.formation !== undefined
                    ? changes.formation?.trim() || undefined
                    : n.formation,
                memberMoves:
                  changes.memberMoves !== undefined
                    ? changes.memberMoves
                    : n.memberMoves,
                caution:
                  changes.caution !== undefined
                    ? changes.caution?.trim() || undefined
                    : n.caution,
                memo:
                  changes.memo !== undefined
                    ? changes.memo?.trim() || undefined
                    : n.memo,
                updatedAt: now,
              }
            : n
        ),
        updatedAt: now,
      };
      saveEntry(updated);
      await mutate(updated, false);
      toast.success("동선 노트가 수정되었습니다");
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 동선 노트 삭제 ──
  const deleteNote = useCallback(
    async (id: string): Promise<boolean> => {
      const current = loadEntry(groupId, projectId);
      const now = new Date().toISOString();
      const updated: StageBlockingEntry = {
        ...current,
        notes: current.notes.filter((n) => n.id !== id),
        updatedAt: now,
      };
      saveEntry(updated);
      await mutate(updated, false);
      toast.success("동선 노트가 삭제되었습니다");
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 순서 변경 (위로) ──
  const moveUp = useCallback(
    async (id: string): Promise<boolean> => {
      const current = loadEntry(groupId, projectId);
      const sorted = [...current.notes].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((n) => n.id === id);
      if (idx <= 0) return false;

      const now = new Date().toISOString();
      const swapped = [...sorted];
      const prevOrder = swapped[idx - 1].order;
      const currOrder = swapped[idx].order;
      swapped[idx - 1] = { ...swapped[idx - 1], order: currOrder, updatedAt: now };
      swapped[idx] = { ...swapped[idx], order: prevOrder, updatedAt: now };

      const updated: StageBlockingEntry = {
        ...current,
        notes: swapped,
        updatedAt: now,
      };
      saveEntry(updated);
      await mutate(updated, false);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 순서 변경 (아래로) ──
  const moveDown = useCallback(
    async (id: string): Promise<boolean> => {
      const current = loadEntry(groupId, projectId);
      const sorted = [...current.notes].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((n) => n.id === id);
      if (idx < 0 || idx >= sorted.length - 1) return false;

      const now = new Date().toISOString();
      const swapped = [...sorted];
      const nextOrder = swapped[idx + 1].order;
      const currOrder = swapped[idx].order;
      swapped[idx + 1] = { ...swapped[idx + 1], order: currOrder, updatedAt: now };
      swapped[idx] = { ...swapped[idx], order: nextOrder, updatedAt: now };

      const updated: StageBlockingEntry = {
        ...current,
        notes: swapped,
        updatedAt: now,
      };
      saveEntry(updated);
      await mutate(updated, false);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 곡별 필터 ──
  function getBySong(songTitle: string): StageBlockingNote[] {
    return notes.filter((n) => n.songTitle === songTitle);
  }

  // ── 곡 목록 ──
  const songList = Array.from(new Set(notes.map((n) => n.songTitle)));

  // ── 통계 ──
  const stats = {
    total: notes.length,
    songCount: songList.length,
    totalMemberMoves: notes.reduce((sum, n) => sum + n.memberMoves.length, 0),
    withCaution: notes.filter((n) => !!n.caution).length,
  };

  return {
    notes,
    songList,
    loading: isLoading,
    refetch: () => mutate(),
    addNote,
    updateNote,
    deleteNote,
    moveUp,
    moveDown,
    getBySong,
    stats,
  };
}
