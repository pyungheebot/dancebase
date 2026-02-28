"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { toast } from "sonner";
import { swrKeys } from "@/lib/swr/keys";
import type { PhotoCallEntry, PhotoCallType } from "@/types";

// ============================================================
// localStorage 유틸
// ============================================================

function getStorageKey(groupId: string, projectId: string): string {
  return `dancebase:photo-call:${groupId}:${projectId}`;
}

function loadEntries(groupId: string, projectId: string): PhotoCallEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId, projectId));
    return raw ? (JSON.parse(raw) as PhotoCallEntry[]) : [];
  } catch {
    return [];
  }
}

function saveEntries(
  groupId: string,
  projectId: string,
  entries: PhotoCallEntry[]
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      getStorageKey(groupId, projectId),
      JSON.stringify(entries)
    );
  } catch {
    // localStorage 쓰기 실패 무시
  }
}

// ============================================================
// 입력 타입
// ============================================================

export type AddPhotoCallInput = {
  time?: string;
  type: PhotoCallType;
  participants: string[];
  location?: string;
  poseDescription?: string;
  costume?: string;
  props?: string;
  photographer?: string;
  memo?: string;
};

export type UpdatePhotoCallInput = Partial<AddPhotoCallInput>;

// ============================================================
// 훅
// ============================================================

export function usePhotoCall(groupId: string, projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId && projectId ? swrKeys.photoCall(groupId, projectId) : null,
    async () => loadEntries(groupId, projectId)
  );

  const entries = (data ?? []).slice().sort((a, b) => a.order - b.order);

  // ── 항목 추가 ──
  const addEntry = useCallback(
    async (input: AddPhotoCallInput): Promise<boolean> => {
      if (!input.type) {
        toast.error("촬영 유형을 선택해주세요");
        return false;
      }

      const current = loadEntries(groupId, projectId);
      const maxOrder =
        current.length > 0 ? Math.max(...current.map((e) => e.order)) : 0;
      const now = new Date().toISOString();

      const newEntry: PhotoCallEntry = {
        id: crypto.randomUUID(),
        groupId,
        projectId,
        order: maxOrder + 1,
        time: input.time?.trim() || undefined,
        type: input.type,
        participants: input.participants.filter((p) => p.trim()),
        location: input.location?.trim() || undefined,
        poseDescription: input.poseDescription?.trim() || undefined,
        costume: input.costume?.trim() || undefined,
        props: input.props?.trim() || undefined,
        photographer: input.photographer?.trim() || undefined,
        completed: false,
        memo: input.memo?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };

      const updated = [...current, newEntry];
      saveEntries(groupId, projectId, updated);
      await mutate(updated, false);
      toast.success("포토콜 항목이 추가되었습니다");
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 항목 수정 ──
  const updateEntry = useCallback(
    async (id: string, changes: UpdatePhotoCallInput): Promise<boolean> => {
      const current = loadEntries(groupId, projectId);
      const target = current.find((e) => e.id === id);
      if (!target) {
        toast.error("항목을 찾을 수 없습니다");
        return false;
      }

      const updated = current.map((e) =>
        e.id === id
          ? {
              ...e,
              ...changes,
              time:
                changes.time !== undefined
                  ? changes.time?.trim() || undefined
                  : e.time,
              participants:
                changes.participants !== undefined
                  ? changes.participants.filter((p) => p.trim())
                  : e.participants,
              location:
                changes.location !== undefined
                  ? changes.location?.trim() || undefined
                  : e.location,
              poseDescription:
                changes.poseDescription !== undefined
                  ? changes.poseDescription?.trim() || undefined
                  : e.poseDescription,
              costume:
                changes.costume !== undefined
                  ? changes.costume?.trim() || undefined
                  : e.costume,
              props:
                changes.props !== undefined
                  ? changes.props?.trim() || undefined
                  : e.props,
              photographer:
                changes.photographer !== undefined
                  ? changes.photographer?.trim() || undefined
                  : e.photographer,
              memo:
                changes.memo !== undefined
                  ? changes.memo?.trim() || undefined
                  : e.memo,
              updatedAt: new Date().toISOString(),
            }
          : e
      );

      saveEntries(groupId, projectId, updated);
      await mutate(updated, false);
      toast.success("항목이 수정되었습니다");
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 항목 삭제 ──
  const deleteEntry = useCallback(
    async (id: string): Promise<boolean> => {
      const current = loadEntries(groupId, projectId);
      const filtered = current.filter((e) => e.id !== id);
      saveEntries(groupId, projectId, filtered);
      await mutate(filtered, false);
      toast.success("항목이 삭제되었습니다");
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 완료 토글 ──
  const toggleCompleted = useCallback(
    async (id: string): Promise<boolean> => {
      const current = loadEntries(groupId, projectId);
      const updated = current.map((e) =>
        e.id === id
          ? { ...e, completed: !e.completed, updatedAt: new Date().toISOString() }
          : e
      );
      saveEntries(groupId, projectId, updated);
      await mutate(updated, false);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 순서 변경 (위/아래 이동) ──
  const moveEntry = useCallback(
    async (id: string, direction: "up" | "down"): Promise<boolean> => {
      const current = loadEntries(groupId, projectId);
      const sorted = [...current].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((e) => e.id === id);
      if (idx === -1) return false;
      if (direction === "up" && idx === 0) return false;
      if (direction === "down" && idx === sorted.length - 1) return false;

      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      const tempOrder = sorted[idx].order;
      sorted[idx] = { ...sorted[idx], order: sorted[swapIdx].order };
      sorted[swapIdx] = { ...sorted[swapIdx], order: tempOrder };

      saveEntries(groupId, projectId, sorted);
      await mutate(sorted, false);
      return true;
    },
    [groupId, projectId, mutate]
  );

  // ── 통계 ──
  const stats = {
    total: entries.length,
    completed: entries.filter((e) => e.completed).length,
    pending: entries.filter((e) => !e.completed).length,
    byType: {
      group: entries.filter((e) => e.type === "group").length,
      subgroup: entries.filter((e) => e.type === "subgroup").length,
      individual: entries.filter((e) => e.type === "individual").length,
      scene: entries.filter((e) => e.type === "scene").length,
    },
  };

  return {
    entries,
    loading: isLoading,
    refetch: () => mutate(),
    addEntry,
    updateEntry,
    deleteEntry,
    toggleCompleted,
    moveEntry,
    stats,
  };
}
