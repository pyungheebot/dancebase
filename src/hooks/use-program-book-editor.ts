"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  ProgramBookEditorData,
  ProgramBookItem,

  ProgramBookCast,
} from "@/types";

// ============================================================
// localStorage 유틸
// ============================================================

const STORAGE_PREFIX = "dancebase:program-book-editor:";

function storageKey(projectId: string): string {
  return `${STORAGE_PREFIX}${projectId}`;
}

function loadData(projectId: string): ProgramBookEditorData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(projectId));
    if (!raw) return null;
    return JSON.parse(raw) as ProgramBookEditorData;
  } catch {
    return null;
  }
}

function saveData(projectId: string, data: ProgramBookEditorData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(projectId), JSON.stringify(data));
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

function emptyData(projectId: string): ProgramBookEditorData {
  return {
    projectId,
    items: [],
    cast: [],
    showTitle: "",
    showDate: null,
    venue: null,
    notes: "",
    updatedAt: new Date().toISOString(),
  };
}

// ============================================================
// 소요 시간 파싱 유틸 (분 단위 환산, ex: "5분" → 5, "1:30" → 90)
// ============================================================

function parseDurationMinutes(duration: string | null): number {
  if (!duration) return 0;
  const colonMatch = duration.match(/^(\d+):(\d{2})$/);
  if (colonMatch) {
    return parseInt(colonMatch[1], 10) * 60 + parseInt(colonMatch[2], 10);
  }
  const minMatch = duration.match(/(\d+)/);
  if (minMatch) return parseInt(minMatch[1], 10);
  return 0;
}

// ============================================================
// 훅
// ============================================================

export function useProgramBookEditor(projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.programBookEditor(projectId),
    () => loadData(projectId),
    { fallbackData: null }
  );

  // 데이터가 없을 때 빈 객체를 기준으로 사용
  const current = (): ProgramBookEditorData => {
    return loadData(projectId) ?? emptyData(projectId);
  };

  const persist = (updated: ProgramBookEditorData) => {
    const stamped = { ...updated, updatedAt: new Date().toISOString() };
    saveData(projectId, stamped);
    mutate(stamped, false);
  };

  // ─── 공연 정보 설정 ────────────────────────────────────────

  const setShowInfo = useCallback(
    (info: {
      showTitle: string;
      showDate: string | null;
      venue: string | null;
      notes: string;
    }): boolean => {
      if (!info.showTitle.trim()) return false;
      const base = current();
      persist({
        ...base,
        showTitle: info.showTitle.trim(),
        showDate: info.showDate || null,
        venue: info.venue?.trim() || null,
        notes: info.notes,
      });
      return true;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- current/persist는 컴포넌트 내부 함수로 projectId·mutate에 의존하며 이미 포함됨
    [projectId, mutate]
  );

  // ─── 프로그램 아이템 CRUD ────────────────────────────────────

  const addItem = useCallback(
    (item: Omit<ProgramBookItem, "id" | "order">): void => {
      const base = current();
      const maxOrder =
        base.items.length > 0
          ? Math.max(...base.items.map((i) => i.order))
          : 0;
      const newItem: ProgramBookItem = {
        ...item,
        id: crypto.randomUUID(),
        order: maxOrder + 1,
      };
      persist({ ...base, items: [...base.items, newItem] });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- current/persist는 컴포넌트 내부 함수로 projectId·mutate에 의존하며 이미 포함됨
    [projectId, mutate]
  );

  const updateItem = useCallback(
    (id: string, patch: Partial<Omit<ProgramBookItem, "id">>): void => {
      const base = current();
      persist({
        ...base,
        items: base.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- current/persist는 컴포넌트 내부 함수로 projectId·mutate에 의존하며 이미 포함됨
    [projectId, mutate]
  );

  const deleteItem = useCallback(
    (id: string): void => {
      const base = current();
      const remaining = base.items
        .filter((i) => i.id !== id)
        .sort((a, b) => a.order - b.order)
        .map((i, idx) => ({ ...i, order: idx + 1 }));
      persist({ ...base, items: remaining });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- current/persist는 컴포넌트 내부 함수로 projectId·mutate에 의존하며 이미 포함됨
    [projectId, mutate]
  );

  const reorderItems = useCallback(
    (id: string, direction: "up" | "down"): void => {
      const base = current();
      const sorted = [...base.items].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((i) => i.id === id);
      if (idx === -1) return;
      if (direction === "up" && idx === 0) return;
      if (direction === "down" && idx === sorted.length - 1) return;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      const tmp = sorted[idx].order;
      sorted[idx] = { ...sorted[idx], order: sorted[swapIdx].order };
      sorted[swapIdx] = { ...sorted[swapIdx], order: tmp };
      persist({ ...base, items: sorted });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- current/persist는 컴포넌트 내부 함수로 projectId·mutate에 의존하며 이미 포함됨
    [projectId, mutate]
  );

  // ─── 출연진 CRUD ─────────────────────────────────────────────

  const addCast = useCallback(
    (cast: Omit<ProgramBookCast, "id">): void => {
      const base = current();
      const newCast: ProgramBookCast = { ...cast, id: crypto.randomUUID() };
      persist({ ...base, cast: [...base.cast, newCast] });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- current/persist는 컴포넌트 내부 함수로 projectId·mutate에 의존하며 이미 포함됨
    [projectId, mutate]
  );

  const updateCast = useCallback(
    (id: string, patch: Partial<Omit<ProgramBookCast, "id">>): void => {
      const base = current();
      persist({
        ...base,
        cast: base.cast.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- current/persist는 컴포넌트 내부 함수로 projectId·mutate에 의존하며 이미 포함됨
    [projectId, mutate]
  );

  const deleteCast = useCallback(
    (id: string): void => {
      const base = current();
      persist({ ...base, cast: base.cast.filter((c) => c.id !== id) });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- current/persist는 컴포넌트 내부 함수로 projectId·mutate에 의존하며 이미 포함됨
    [projectId, mutate]
  );

  // ─── 통계 ────────────────────────────────────────────────────

  const items = data?.items ?? [];
  const cast = data?.cast ?? [];
  const totalItems = items.length;
  const totalCast = cast.length;
  const totalDurationMinutes = items.reduce(
    (acc, i) => acc + parseDurationMinutes(i.duration),
    0
  );

  // "HH:MM" 형식으로 변환
  const totalDuration =
    totalDurationMinutes > 0
      ? `${Math.floor(totalDurationMinutes / 60)}시간 ${totalDurationMinutes % 60}분`
      : null;

  return {
    data,
    loading: isLoading,
    refetch: () => mutate(),
    setShowInfo,
    addItem,
    updateItem,
    deleteItem,
    reorderItems,
    addCast,
    updateCast,
    deleteCast,
    totalItems,
    totalCast,
    totalDuration,
  };
}
