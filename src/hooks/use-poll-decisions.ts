"use client";

import { useState, useEffect, useCallback } from "react";
import type { PollDecision } from "@/types";

const MAX_DECISIONS = 100;

function getStorageKey(groupId: string): string {
  return `poll-decisions-${groupId}`;
}

function loadDecisions(groupId: string): PollDecision[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as PollDecision[];
  } catch {
    return [];
  }
}

function saveDecisions(groupId: string, decisions: PollDecision[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(groupId), JSON.stringify(decisions));
  } catch {
    // localStorage 쓰기 실패 무시
  }
}

export function usePollDecisions(groupId: string) {
  const [decisions, setDecisions] = useState<PollDecision[]>([]);
  const [mounted, setMounted] = useState(false);

  // 마운트 후 localStorage에서 불러오기
  useEffect(() => {
    setMounted(true);
    setDecisions(loadDecisions(groupId));
  }, [groupId]);

  // 시계열 내림차순 정렬 (최신순)
  const sortedDecisions = [...decisions].sort(
    (a, b) => new Date(b.decidedAt).getTime() - new Date(a.decidedAt).getTime()
  );

  /** 특정 pollId가 이미 채택되었는지 확인 */
  const isDecided = useCallback(
    (pollId: string): boolean => decisions.some((d) => d.pollId === pollId),
    [decisions]
  );

  /** 결정 채택 */
  const adoptDecision = useCallback(
    (params: {
      pollId: string;
      postId: string;
      question: string;
      winningOption: string;
      decisionSummary: string;
      decidedBy: string;
    }): void => {
      setDecisions((prev) => {
        // 이미 채택된 경우 중복 방지
        if (prev.some((d) => d.pollId === params.pollId)) return prev;

        const newDecision: PollDecision = {
          id: crypto.randomUUID(),
          pollId: params.pollId,
          postId: params.postId,
          question: params.question,
          winningOption: params.winningOption,
          decisionSummary: params.decisionSummary,
          decidedAt: new Date().toISOString(),
          decidedBy: params.decidedBy,
        };

        const updated = [newDecision, ...prev].slice(0, MAX_DECISIONS);
        saveDecisions(groupId, updated);
        return updated;
      });
    },
    [groupId]
  );

  /** 결정 채택 해제 */
  const revokeDecision = useCallback(
    (pollId: string): void => {
      setDecisions((prev) => {
        const updated = prev.filter((d) => d.pollId !== pollId);
        saveDecisions(groupId, updated);
        return updated;
      });
    },
    [groupId]
  );

  /** 결정 요약 인라인 수정 */
  const updateSummary = useCallback(
    (decisionId: string, newSummary: string): void => {
      setDecisions((prev) => {
        const updated = prev.map((d) =>
          d.id === decisionId ? { ...d, decisionSummary: newSummary } : d
        );
        saveDecisions(groupId, updated);
        return updated;
      });
    },
    [groupId]
  );

  return {
    decisions: sortedDecisions,
    loading: !mounted,
    isDecided,
    adoptDecision,
    revokeDecision,
    updateSummary,
  };
}
