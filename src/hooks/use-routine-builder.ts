"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { PracticeRoutine, RoutineBlock, RoutineBlockType } from "@/types";

// ─── 상수 ──────────────────────────────────────────────────────────────────

/** 블록 타입별 기본 시간(분) */
export const BLOCK_DEFAULT_MINUTES: Record<RoutineBlockType, number> = {
  warmup: 10,
  basics: 15,
  technique: 20,
  choreography: 30,
  freestyle: 15,
  cooldown: 10,
  break: 5,
};

/** 블록 타입 한글 레이블 */
export const BLOCK_TYPE_LABELS: Record<RoutineBlockType, string> = {
  warmup: "워밍업",
  basics: "기초훈련",
  technique: "테크닉",
  choreography: "안무연습",
  freestyle: "프리스타일",
  cooldown: "쿨다운",
  break: "휴식",
};

/** 블록 타입별 색상 (Tailwind 클래스) */
export const BLOCK_TYPE_COLORS: Record<
  RoutineBlockType,
  { bg: string; text: string; border: string; badge: string }
> = {
  warmup: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    badge: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  },
  basics: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  },
  technique: {
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-200",
    badge: "bg-violet-100 text-violet-700 hover:bg-violet-100",
  },
  choreography: {
    bg: "bg-pink-50",
    text: "text-pink-700",
    border: "border-pink-200",
    badge: "bg-pink-100 text-pink-700 hover:bg-pink-100",
  },
  freestyle: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    badge: "bg-green-100 text-green-700 hover:bg-green-100",
  },
  cooldown: {
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    border: "border-cyan-200",
    badge: "bg-cyan-100 text-cyan-700 hover:bg-cyan-100",
  },
  break: {
    bg: "bg-gray-50",
    text: "text-gray-600",
    border: "border-gray-200",
    badge: "bg-gray-100 text-gray-600 hover:bg-gray-100",
  },
};

// ─── 내부 유틸 ──────────────────────────────────────────────────────────────

function storageKey(groupId: string): string {
  return `dancebase:routines:${groupId}`;
}

function loadRoutines(groupId: string): PracticeRoutine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as PracticeRoutine[];
  } catch {
    return [];
  }
}

function saveRoutines(groupId: string, routines: PracticeRoutine[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(groupId), JSON.stringify(routines));
}

function calcTotal(blocks: RoutineBlock[]): number {
  return blocks.reduce((sum, b) => sum + b.durationMinutes, 0);
}

// ─── 훅 ─────────────────────────────────────────────────────────────────────

export type AddBlockParams = {
  type: RoutineBlockType;
  title?: string;
  durationMinutes?: number;
  description?: string;
};

export function useRoutineBuilder(groupId: string) {
  const { data: routines = [], mutate } = useSWR<PracticeRoutine[]>(
    swrKeys.routineBuilder(groupId),
    () => loadRoutines(groupId),
    { revalidateOnFocus: false }
  );

  // ── 루틴 생성 ────────────────────────────────────────────────────────────
  function createRoutine(name: string): PracticeRoutine | null {
    if (!name.trim()) return null;
    const newRoutine: PracticeRoutine = {
      id: crypto.randomUUID(),
      name: name.trim(),
      blocks: [],
      totalMinutes: 0,
      usageCount: 0,
      createdAt: new Date().toISOString(),
    };
    const next = [...routines, newRoutine];
    saveRoutines(groupId, next);
    mutate(next, false);
    return newRoutine;
  }

  // ── 루틴 이름 수정 ────────────────────────────────────────────────────────
  function renameRoutine(routineId: string, newName: string): boolean {
    if (!newName.trim()) return false;
    const next = routines.map((r) =>
      r.id === routineId ? { ...r, name: newName.trim() } : r
    );
    saveRoutines(groupId, next);
    mutate(next, false);
    return true;
  }

  // ── 루틴 삭제 ────────────────────────────────────────────────────────────
  function deleteRoutine(routineId: string): void {
    const next = routines.filter((r) => r.id !== routineId);
    saveRoutines(groupId, next);
    mutate(next, false);
  }

  // ── 루틴 복제 ────────────────────────────────────────────────────────────
  function duplicateRoutine(routineId: string): PracticeRoutine | null {
    const src = routines.find((r) => r.id === routineId);
    if (!src) return null;
    const cloned: PracticeRoutine = {
      ...src,
      id: crypto.randomUUID(),
      name: `${src.name} (복사본)`,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      lastUsedAt: undefined,
      blocks: src.blocks.map((b) => ({ ...b, id: crypto.randomUUID() })),
    };
    const next = [...routines, cloned];
    saveRoutines(groupId, next);
    mutate(next, false);
    return cloned;
  }

  // ── "사용하기" → usageCount 증가 ─────────────────────────────────────────
  function useRoutine(routineId: string): void {
    const next = routines.map((r) =>
      r.id === routineId
        ? { ...r, usageCount: r.usageCount + 1, lastUsedAt: new Date().toISOString() }
        : r
    );
    saveRoutines(groupId, next);
    mutate(next, false);
  }

  // ── 블록 추가 ────────────────────────────────────────────────────────────
  function addBlock(routineId: string, params: AddBlockParams): boolean {
    const routine = routines.find((r) => r.id === routineId);
    if (!routine) return false;

    const newBlock: RoutineBlock = {
      id: crypto.randomUUID(),
      type: params.type,
      title: params.title?.trim() || BLOCK_TYPE_LABELS[params.type],
      durationMinutes: params.durationMinutes ?? BLOCK_DEFAULT_MINUTES[params.type],
      description: params.description?.trim() || "",
      order: routine.blocks.length,
    };

    const updatedBlocks = [...routine.blocks, newBlock];
    const next = routines.map((r) =>
      r.id === routineId
        ? { ...r, blocks: updatedBlocks, totalMinutes: calcTotal(updatedBlocks) }
        : r
    );
    saveRoutines(groupId, next);
    mutate(next, false);
    return true;
  }

  // ── 블록 삭제 ────────────────────────────────────────────────────────────
  function deleteBlock(routineId: string, blockId: string): void {
    const routine = routines.find((r) => r.id === routineId);
    if (!routine) return;
    const updatedBlocks = routine.blocks
      .filter((b) => b.id !== blockId)
      .map((b, i) => ({ ...b, order: i }));
    const next = routines.map((r) =>
      r.id === routineId
        ? { ...r, blocks: updatedBlocks, totalMinutes: calcTotal(updatedBlocks) }
        : r
    );
    saveRoutines(groupId, next);
    mutate(next, false);
  }

  // ── 블록 순서 이동 (위/아래) ──────────────────────────────────────────────
  function moveBlock(routineId: string, blockId: string, direction: "up" | "down"): void {
    const routine = routines.find((r) => r.id === routineId);
    if (!routine) return;
    const idx = routine.blocks.findIndex((b) => b.id === blockId);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === routine.blocks.length - 1) return;

    const newBlocks = [...routine.blocks];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    [newBlocks[idx], newBlocks[swapIdx]] = [newBlocks[swapIdx], newBlocks[idx]];
    const reOrdered = newBlocks.map((b, i) => ({ ...b, order: i }));

    const next = routines.map((r) =>
      r.id === routineId
        ? { ...r, blocks: reOrdered, totalMinutes: calcTotal(reOrdered) }
        : r
    );
    saveRoutines(groupId, next);
    mutate(next, false);
  }

  // ── 블록 편집 (시간/제목/설명 수정) ──────────────────────────────────────
  function updateBlock(
    routineId: string,
    blockId: string,
    patch: Partial<Pick<RoutineBlock, "title" | "durationMinutes" | "description">>
  ): void {
    const routine = routines.find((r) => r.id === routineId);
    if (!routine) return;
    const updatedBlocks = routine.blocks.map((b) =>
      b.id === blockId ? { ...b, ...patch } : b
    );
    const next = routines.map((r) =>
      r.id === routineId
        ? { ...r, blocks: updatedBlocks, totalMinutes: calcTotal(updatedBlocks) }
        : r
    );
    saveRoutines(groupId, next);
    mutate(next, false);
  }

  return {
    routines,
    createRoutine,
    renameRoutine,
    deleteRoutine,
    duplicateRoutine,
    useRoutine,
    addBlock,
    deleteBlock,
    moveBlock,
    updateBlock,
  };
}
