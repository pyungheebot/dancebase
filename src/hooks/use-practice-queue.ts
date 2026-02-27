"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { PracticeQueue, PracticeQueueItem, QueueItemStatus } from "@/types";

// ─── localStorage 헬퍼 ────────────────────────────────────────

const LS_KEY = (groupId: string, projectId: string) =>
  `dancebase:practice-queue:${groupId}:${projectId}`;

function loadQueues(groupId: string, projectId: string): PracticeQueue[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY(groupId, projectId));
    if (!raw) return [];
    return JSON.parse(raw) as PracticeQueue[];
  } catch {
    return [];
  }
}

function saveQueues(
  groupId: string,
  projectId: string,
  queues: PracticeQueue[]
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY(groupId, projectId), JSON.stringify(queues));
  } catch {
    /* ignore */
  }
}

// ─── 훅 ─────────────────────────────────────────────────────

export function usePracticeQueue(groupId: string, projectId: string) {
  const swrKey =
    groupId && projectId
      ? swrKeys.practiceQueue(groupId, projectId)
      : null;

  const { data, mutate } = useSWR(
    swrKey,
    () => loadQueues(groupId, projectId),
    { revalidateOnFocus: false }
  );

  const queues: PracticeQueue[] = data ?? [];

  // ── 내부 업데이트 헬퍼 ───────────────────────────────────

  function update(next: PracticeQueue[]): void {
    saveQueues(groupId, projectId, next);
    mutate(next, false);
  }

  // ── 큐 추가 ─────────────────────────────────────────────

  function addQueue(name: string): boolean {
    const trimmed = name.trim();
    if (!trimmed) return false;
    const stored = loadQueues(groupId, projectId);
    const newQueue: PracticeQueue = {
      id: crypto.randomUUID(),
      name: trimmed,
      items: [],
      currentIndex: 0,
      createdAt: new Date().toISOString(),
    };
    update([...stored, newQueue]);
    return true;
  }

  // ── 큐 삭제 ─────────────────────────────────────────────

  function deleteQueue(queueId: string): boolean {
    const stored = loadQueues(groupId, projectId);
    const next = stored.filter((q) => q.id !== queueId);
    if (next.length === stored.length) return false;
    update(next);
    return true;
  }

  // ── 곡 추가 ─────────────────────────────────────────────

  function addItem(
    queueId: string,
    song: Omit<PracticeQueueItem, "id" | "order" | "status">
  ): boolean {
    const stored = loadQueues(groupId, projectId);
    const qIdx = stored.findIndex((q) => q.id === queueId);
    if (qIdx === -1) return false;

    const queue = stored[qIdx];
    const newItem: PracticeQueueItem = {
      ...song,
      id: crypto.randomUUID(),
      order: queue.items.length,
      status: "pending" as QueueItemStatus,
    };

    const next = stored.map((q) =>
      q.id === queueId ? { ...q, items: [...q.items, newItem] } : q
    );
    update(next);
    return true;
  }

  // ── 곡 삭제 ─────────────────────────────────────────────

  function removeItem(queueId: string, itemId: string): boolean {
    const stored = loadQueues(groupId, projectId);
    const qIdx = stored.findIndex((q) => q.id === queueId);
    if (qIdx === -1) return false;

    const queue = stored[qIdx];
    const filtered = queue.items.filter((i) => i.id !== itemId);
    if (filtered.length === queue.items.length) return false;

    // order 재정렬 + currentIndex 보정
    const reordered = filtered.map((item, idx) => ({ ...item, order: idx }));
    const newCurrentIndex = Math.min(queue.currentIndex, Math.max(0, reordered.length - 1));

    const next = stored.map((q) =>
      q.id === queueId
        ? { ...q, items: reordered, currentIndex: newCurrentIndex }
        : q
    );
    update(next);
    return true;
  }

  // ── 순서 변경 (위/아래) ──────────────────────────────────

  function reorderItem(
    queueId: string,
    itemIndex: number,
    direction: "up" | "down"
  ): boolean {
    const stored = loadQueues(groupId, projectId);
    const qIdx = stored.findIndex((q) => q.id === queueId);
    if (qIdx === -1) return false;

    const queue = stored[qIdx];
    const items = [...queue.items];
    const swapIndex = direction === "up" ? itemIndex - 1 : itemIndex + 1;

    if (swapIndex < 0 || swapIndex >= items.length) return false;

    // swap
    [items[itemIndex], items[swapIndex]] = [items[swapIndex], items[itemIndex]];

    // order 재정렬
    const reordered = items.map((item, idx) => ({ ...item, order: idx }));

    // currentIndex가 이동된 항목을 가리키고 있으면 함께 이동
    let newCurrentIndex = queue.currentIndex;
    if (queue.currentIndex === itemIndex) {
      newCurrentIndex = swapIndex;
    } else if (queue.currentIndex === swapIndex) {
      newCurrentIndex = itemIndex;
    }

    const next = stored.map((q) =>
      q.id === queueId
        ? { ...q, items: reordered, currentIndex: newCurrentIndex }
        : q
    );
    update(next);
    return true;
  }

  // ── 다음 곡 (현재 done → 다음 playing) ──────────────────

  function nextSong(queueId: string): boolean {
    const stored = loadQueues(groupId, projectId);
    const qIdx = stored.findIndex((q) => q.id === queueId);
    if (qIdx === -1) return false;

    const queue = stored[qIdx];
    const items = queue.items;
    if (items.length === 0) return false;

    const currentIdx = queue.currentIndex;
    const nextIdx = currentIdx + 1;

    const updatedItems = items.map((item, idx) => {
      if (idx === currentIdx) return { ...item, status: "done" as QueueItemStatus };
      if (idx === nextIdx) return { ...item, status: "playing" as QueueItemStatus };
      return item;
    });

    const next = stored.map((q) =>
      q.id === queueId
        ? {
            ...q,
            items: updatedItems,
            currentIndex: nextIdx < items.length ? nextIdx : currentIdx,
          }
        : q
    );
    update(next);
    return true;
  }

  // ── 곡 스킵 ─────────────────────────────────────────────

  function skipSong(queueId: string): boolean {
    const stored = loadQueues(groupId, projectId);
    const qIdx = stored.findIndex((q) => q.id === queueId);
    if (qIdx === -1) return false;

    const queue = stored[qIdx];
    const items = queue.items;
    if (items.length === 0) return false;

    const currentIdx = queue.currentIndex;
    const nextIdx = currentIdx + 1;

    const updatedItems = items.map((item, idx) => {
      if (idx === currentIdx) return { ...item, status: "skipped" as QueueItemStatus };
      if (idx === nextIdx) return { ...item, status: "playing" as QueueItemStatus };
      return item;
    });

    const next = stored.map((q) =>
      q.id === queueId
        ? {
            ...q,
            items: updatedItems,
            currentIndex: nextIdx < items.length ? nextIdx : currentIdx,
          }
        : q
    );
    update(next);
    return true;
  }

  // ── 큐 초기화 (모든 곡 pending, currentIndex=0) ──────────

  function resetQueue(queueId: string): boolean {
    const stored = loadQueues(groupId, projectId);
    const qIdx = stored.findIndex((q) => q.id === queueId);
    if (qIdx === -1) return false;

    const queue = stored[qIdx];
    const resetItems = queue.items.map((item) => ({
      ...item,
      status: "pending" as QueueItemStatus,
    }));

    // 첫 번째 곡이 있으면 playing으로 시작
    const readyItems =
      resetItems.length > 0
        ? resetItems.map((item, idx) =>
            idx === 0 ? { ...item, status: "playing" as QueueItemStatus } : item
          )
        : resetItems;

    const next = stored.map((q) =>
      q.id === queueId ? { ...q, items: readyItems, currentIndex: 0 } : q
    );
    update(next);
    return true;
  }

  // ── 통계 ─────────────────────────────────────────────────

  const totalQueues = queues.length;

  const totalSongs = queues.reduce((sum, q) => sum + q.items.length, 0);

  const completedSongs = queues.reduce(
    (sum, q) => sum + q.items.filter((i) => i.status === "done").length,
    0
  );

  return {
    queues,
    // CRUD
    addQueue,
    deleteQueue,
    addItem,
    removeItem,
    reorderItem,
    // 재생 제어
    nextSong,
    skipSong,
    resetQueue,
    // 통계
    totalQueues,
    totalSongs,
    completedSongs,
    // SWR
    refetch: () => mutate(),
  };
}
