"use client";

import { useState, useCallback } from "react";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  CostumeDesignEntry,
  CostumeDesignStatus,
} from "@/types";

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(groupId: string, projectId: string): string {
  return `dancebase:costume-design:${groupId}:${projectId}`;
}

// ============================================================
// 통계 타입
// ============================================================

export type CostumeDesignStats = {
  totalDesigns: number;
  approvedCount: number;
  totalEstimatedCost: number;
  topVotedDesign: CostumeDesignEntry | null;
};

// ============================================================
// 훅
// ============================================================

export function useCostumeDesign(groupId: string, projectId: string) {
  const [designs, setDesigns] = useState<CostumeDesignEntry[]>(() => loadFromStorage<CostumeDesignEntry[]>(storageKey(groupId, projectId), []));

  const reload = useCallback(() => {
    if (!groupId || !projectId) return;
    const data = loadFromStorage<CostumeDesignEntry[]>(storageKey(groupId, projectId), []);
    setDesigns(data);
  }, [groupId, projectId]);

  const persist = useCallback(
    (next: CostumeDesignEntry[]) => {
      saveToStorage(storageKey(groupId, projectId), next);
      setDesigns(next);
    },
    [groupId, projectId]
  );

  // 디자인 추가
  const addDesign = useCallback(
    (
      title: string,
      description: string,
      designedBy: string,
      category: string,
      colorScheme: string[],
      materialNotes?: string,
      estimatedCost?: number
    ): CostumeDesignEntry => {
      const entry: CostumeDesignEntry = {
        id: crypto.randomUUID(),
        title,
        description,
        designedBy,
        category,
        colorScheme,
        materialNotes,
        estimatedCost,
        status: "idea",
        votes: [],
        comments: [],
        createdAt: new Date().toISOString(),
      };
      persist([...designs, entry]);
      return entry;
    },
    [designs, persist]
  );

  // 디자인 수정
  const updateDesign = useCallback(
    (id: string, patch: Partial<CostumeDesignEntry>): boolean => {
      const idx = designs.findIndex((d) => d.id === id);
      if (idx === -1) return false;
      const next = [...designs];
      next[idx] = { ...next[idx], ...patch };
      persist(next);
      return true;
    },
    [designs, persist]
  );

  // 디자인 삭제
  const deleteDesign = useCallback(
    (id: string): boolean => {
      const next = designs.filter((d) => d.id !== id);
      if (next.length === designs.length) return false;
      persist(next);
      return true;
    },
    [designs, persist]
  );

  // 상태 변경
  const changeStatus = useCallback(
    (id: string, status: CostumeDesignStatus): boolean => {
      return updateDesign(id, { status });
    },
    [updateDesign]
  );

  // 투표 토글
  const toggleVote = useCallback(
    (id: string, memberName: string): boolean => {
      const idx = designs.findIndex((d) => d.id === id);
      if (idx === -1) return false;
      const target = designs[idx];
      const alreadyVoted = target.votes.includes(memberName);
      const updatedVotes = alreadyVoted
        ? target.votes.filter((v) => v !== memberName)
        : [...target.votes, memberName];
      return updateDesign(id, { votes: updatedVotes });
    },
    [designs, updateDesign]
  );

  // 댓글 추가
  const addComment = useCallback(
    (designId: string, author: string, text: string): boolean => {
      const idx = designs.findIndex((d) => d.id === designId);
      if (idx === -1) return false;
      const newComment = {
        id: crypto.randomUUID(),
        author,
        text,
        createdAt: new Date().toISOString(),
      };
      const updatedComments = [...designs[idx].comments, newComment];
      return updateDesign(designId, { comments: updatedComments });
    },
    [designs, updateDesign]
  );

  // 댓글 삭제
  const deleteComment = useCallback(
    (designId: string, commentId: string): boolean => {
      const idx = designs.findIndex((d) => d.id === designId);
      if (idx === -1) return false;
      const updatedComments = designs[idx].comments.filter(
        (c) => c.id !== commentId
      );
      return updateDesign(designId, { comments: updatedComments });
    },
    [designs, updateDesign]
  );

  // 통계
  const stats: CostumeDesignStats = (() => {
    const approvedCount = designs.filter(
      (d) => d.status === "approved" || d.status === "in_production" || d.status === "completed"
    ).length;

    const totalEstimatedCost = designs.reduce(
      (sum, d) => sum + (d.estimatedCost ?? 0),
      0
    );

    const topVotedDesign =
      designs.length === 0
        ? null
        : designs.reduce((best, d) =>
            d.votes.length > best.votes.length ? d : best
          );

    return {
      totalDesigns: designs.length,
      approvedCount,
      totalEstimatedCost,
      topVotedDesign: topVotedDesign?.votes.length === 0 ? null : topVotedDesign ?? null,
    };
  })();

  return {
    designs,
    loading: false,
    addDesign,
    updateDesign,
    deleteDesign,
    changeStatus,
    toggleVote,
    addComment,
    deleteComment,
    stats,
    refetch: reload,
  };
}
