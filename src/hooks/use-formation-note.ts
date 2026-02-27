"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { FormationSnapshot, FormationNotePosition } from "@/types";

// ============================================
// localStorage 키
// ============================================

function storageKey(groupId: string, projectId: string): string {
  return `dancebase:formation-note:${groupId}:${projectId}`;
}

// ============================================
// localStorage 헬퍼
// ============================================

function loadFromStorage(groupId: string, projectId: string): FormationSnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(groupId, projectId));
    if (!raw) return [];
    return JSON.parse(raw) as FormationSnapshot[];
  } catch {
    return [];
  }
}

function saveToStorage(
  groupId: string,
  projectId: string,
  snapshots: FormationSnapshot[]
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId, projectId), JSON.stringify(snapshots));
  } catch {
    // 무시
  }
}

// ============================================
// 훅
// ============================================

export function useFormationNote(groupId: string, projectId: string) {
  const swrKey = swrKeys.formationNote(groupId, projectId);

  const { data: snapshots = [], mutate } = useSWR(swrKey, () =>
    loadFromStorage(groupId, projectId)
  );

  // 스냅샷 추가
  const addSnapshot = useCallback(
    (
      name: string,
      timestamp: string,
      positions: FormationNotePosition[],
      notes?: string
    ) => {
      const newSnapshot: FormationSnapshot = {
        id: crypto.randomUUID(),
        name: name.trim(),
        timestamp: timestamp.trim(),
        positions,
        notes: notes?.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      const updated = [...snapshots, newSnapshot];
      saveToStorage(groupId, projectId, updated);
      mutate(updated, false);
      return newSnapshot.id;
    },
    [groupId, projectId, snapshots, mutate]
  );

  // 스냅샷 수정
  const updateSnapshot = useCallback(
    (id: string, patch: Partial<Omit<FormationSnapshot, "id" | "createdAt">>) => {
      const updated = snapshots.map((s) =>
        s.id === id ? { ...s, ...patch } : s
      );
      saveToStorage(groupId, projectId, updated);
      mutate(updated, false);
    },
    [groupId, projectId, snapshots, mutate]
  );

  // 스냅샷 삭제
  const deleteSnapshot = useCallback(
    (id: string) => {
      const updated = snapshots.filter((s) => s.id !== id);
      saveToStorage(groupId, projectId, updated);
      mutate(updated, false);
    },
    [groupId, projectId, snapshots, mutate]
  );

  // 특정 멤버 위치 수정
  const updatePosition = useCallback(
    (snapshotId: string, memberName: string, x: number, y: number) => {
      const updated = snapshots.map((s) => {
        if (s.id !== snapshotId) return s;
        const newPositions = s.positions.map((p) =>
          p.memberName === memberName
            ? { ...p, x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) }
            : p
        );
        return { ...s, positions: newPositions };
      });
      saveToStorage(groupId, projectId, updated);
      mutate(updated, false);
    },
    [groupId, projectId, snapshots, mutate]
  );

  // 스냅샷에 멤버 추가 (중앙 50, 50)
  const addMemberToSnapshot = useCallback(
    (snapshotId: string, memberName: string) => {
      const updated = snapshots.map((s) => {
        if (s.id !== snapshotId) return s;
        const alreadyExists = s.positions.some((p) => p.memberName === memberName);
        if (alreadyExists) return s;
        const newPosition: FormationNotePosition = { memberName, x: 50, y: 50 };
        return { ...s, positions: [...s.positions, newPosition] };
      });
      saveToStorage(groupId, projectId, updated);
      mutate(updated, false);
    },
    [groupId, projectId, snapshots, mutate]
  );

  // 스냅샷에서 멤버 제거
  const removeMemberFromSnapshot = useCallback(
    (snapshotId: string, memberName: string) => {
      const updated = snapshots.map((s) => {
        if (s.id !== snapshotId) return s;
        return {
          ...s,
          positions: s.positions.filter((p) => p.memberName !== memberName),
        };
      });
      saveToStorage(groupId, projectId, updated);
      mutate(updated, false);
    },
    [groupId, projectId, snapshots, mutate]
  );

  // ============================================
  // 통계
  // ============================================

  const totalSnapshots = snapshots.length;

  // 가장 많은 멤버 수를 가진 스냅샷 기준
  const memberCount =
    snapshots.length === 0
      ? 0
      : Math.max(...snapshots.map((s) => s.positions.length));

  return {
    snapshots,
    loading: false,
    // CRUD
    addSnapshot,
    updateSnapshot,
    deleteSnapshot,
    updatePosition,
    addMemberToSnapshot,
    removeMemberFromSnapshot,
    // 통계
    totalSnapshots,
    memberCount,
  };
}
