"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { toast } from "sonner";
import type { PerformanceRetro, RetroCategory, RetroItem } from "@/types";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";

// ─── localStorage 헬퍼 ────────────────────────────────────────

function storageKey(groupId: string, projectId: string): string {
  return `dancebase:retro:${groupId}:${projectId}`;
}

// ─── 훅 ─────────────────────────────────────────────────────

export function usePerformanceRetrospective(
  groupId: string,
  projectId: string
) {
  const { data, mutate } = useSWR(
    groupId && projectId
      ? swrKeys.performanceRetro(groupId, projectId)
      : null,
    () => loadFromStorage<PerformanceRetro[]>(storageKey(groupId, projectId), []),
    { revalidateOnFocus: false }
  );

  const retros = data ?? [];

  // ── 통계 ────────────────────────────────────────────────
  const totalRetros = retros.length;
  const avgRating =
    totalRetros > 0
      ? Math.round(
          (retros.reduce((sum, r) => sum + r.overallRating, 0) / totalRetros) *
            10
        ) / 10
      : 0;

  // ── 회고 추가 ────────────────────────────────────────────
  function addRetro(input: {
    performanceTitle: string;
    performanceDate: string;
    overallRating: number;
  }): boolean {
    if (!input.performanceTitle.trim()) {
      toast.error("공연명을 입력해주세요.");
      return false;
    }
    if (!input.performanceDate) {
      toast.error("공연 날짜를 입력해주세요.");
      return false;
    }
    if (input.overallRating < 1 || input.overallRating > 5) {
      toast.error("평가는 1~5점 사이로 입력해주세요.");
      return false;
    }
    try {
      const stored = loadFromStorage<PerformanceRetro[]>(storageKey(groupId, projectId), []);
      const newRetro: PerformanceRetro = {
        id: crypto.randomUUID(),
        performanceTitle: input.performanceTitle.trim(),
        performanceDate: input.performanceDate,
        overallRating: input.overallRating,
        items: [],
        actionItems: [],
        createdAt: new Date().toISOString(),
      };
      const next = [...stored, newRetro];
      saveToStorage(storageKey(groupId, projectId), next);
      void mutate(next, false);
      toast.success("회고가 생성되었습니다.");
      return true;
    } catch {
      toast.error("회고 생성에 실패했습니다.");
      return false;
    }
  }

  // ── 회고 삭제 ────────────────────────────────────────────
  function deleteRetro(retroId: string): boolean {
    try {
      const stored = loadFromStorage<PerformanceRetro[]>(storageKey(groupId, projectId), []);
      const next = stored.filter((r) => r.id !== retroId);
      saveToStorage(storageKey(groupId, projectId), next);
      void mutate(next, false);
      toast.success("회고가 삭제되었습니다.");
      return true;
    } catch {
      toast.error("회고 삭제에 실패했습니다.");
      return false;
    }
  }

  // ── 회고 항목 추가 ───────────────────────────────────────
  function addRetroItem(
    retroId: string,
    category: RetroCategory,
    content: string,
    authorName: string
  ): boolean {
    if (!content.trim()) {
      toast.error("내용을 입력해주세요.");
      return false;
    }
    try {
      const stored = loadFromStorage<PerformanceRetro[]>(storageKey(groupId, projectId), []);
      const next = stored.map((r) => {
        if (r.id !== retroId) return r;
        const newItem: RetroItem = {
          id: crypto.randomUUID(),
          category,
          content: content.trim(),
          authorName: authorName.trim() || "익명",
          votes: 0,
          createdAt: new Date().toISOString(),
        };
        return { ...r, items: [...r.items, newItem] };
      });
      saveToStorage(storageKey(groupId, projectId), next);
      void mutate(next, false);
      return true;
    } catch {
      toast.error("항목 추가에 실패했습니다.");
      return false;
    }
  }

  // ── 공감 투표 ────────────────────────────────────────────
  function voteItem(retroId: string, itemId: string): boolean {
    try {
      const stored = loadFromStorage<PerformanceRetro[]>(storageKey(groupId, projectId), []);
      const next = stored.map((r) => {
        if (r.id !== retroId) return r;
        return {
          ...r,
          items: r.items.map((item) =>
            item.id === itemId ? { ...item, votes: item.votes + 1 } : item
          ),
        };
      });
      saveToStorage(storageKey(groupId, projectId), next);
      void mutate(next, false);
      return true;
    } catch {
      toast.error("공감 처리에 실패했습니다.");
      return false;
    }
  }

  // ── 액션 아이템 추가 ─────────────────────────────────────
  function addActionItem(retroId: string, action: string): boolean {
    if (!action.trim()) {
      toast.error("액션 아이템을 입력해주세요.");
      return false;
    }
    try {
      const stored = loadFromStorage<PerformanceRetro[]>(storageKey(groupId, projectId), []);
      const next = stored.map((r) => {
        if (r.id !== retroId) return r;
        return { ...r, actionItems: [...r.actionItems, action.trim()] };
      });
      saveToStorage(storageKey(groupId, projectId), next);
      void mutate(next, false);
      toast.success("액션 아이템이 추가되었습니다.");
      return true;
    } catch {
      toast.error("액션 아이템 추가에 실패했습니다.");
      return false;
    }
  }

  return {
    retros,
    totalRetros,
    avgRating,
    addRetro,
    deleteRetro,
    addRetroItem,
    voteItem,
    addActionItem,
    refetch: () => mutate(),
  };
}
