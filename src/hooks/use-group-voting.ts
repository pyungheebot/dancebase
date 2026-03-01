"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  GroupVotingCardData,
  GroupVoteCardItem,
  GroupVoteCardOption,
} from "@/types";

// ============================================================
// localStorage 헬퍼
// ============================================================

function storageKey(groupId: string): string {
  return `dancebase:group-voting:${groupId}`;
}

function loadData(groupId: string): GroupVotingCardData {
  if (typeof window === "undefined") {
    return { groupId, votes: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) {
      return { groupId, votes: [], updatedAt: new Date().toISOString() };
    }
    return JSON.parse(raw) as GroupVotingCardData;
  } catch {
    return { groupId, votes: [], updatedAt: new Date().toISOString() };
  }
}

function saveData(groupId: string, data: GroupVotingCardData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId), JSON.stringify(data));
  } catch {
    // 무시
  }
}

// ============================================================
// 훅
// ============================================================

export function useGroupVoting(groupId: string) {
  const { data, mutate, isLoading } = useSWR(
    groupId ? swrKeys.groupVoting(groupId) : null,
    () => loadData(groupId)
  );

  const current: GroupVotingCardData = useMemo(() => data ?? {
    groupId,
    votes: [],
    updatedAt: new Date().toISOString(),
  }, [data, groupId]);

  const persist = useCallback(
    (next: GroupVotingCardData) => {
      saveData(groupId, next);
      mutate(next, false);
    },
    [groupId, mutate]
  );

  // ── 투표 생성 ────────────────────────────────────────────

  const addVote = useCallback(
    (
      partial: Omit<GroupVoteCardItem, "id" | "createdAt" | "options" | "createdBy"> & {
        optionLabels: string[];
      },
      userId: string
    ): GroupVoteCardItem => {
      const options: GroupVoteCardOption[] = partial.optionLabels.map(
        (label) => ({
          id: crypto.randomUUID(),
          label,
          voterIds: [],
        })
      );
      const newVote: GroupVoteCardItem = {
        id: crypto.randomUUID(),
        title: partial.title,
        description: partial.description,
        options,
        deadline: partial.deadline,
        multipleChoice: partial.multipleChoice,
        anonymous: partial.anonymous,
        createdAt: new Date().toISOString(),
        createdBy: userId,
      };
      persist({
        ...current,
        votes: [newVote, ...current.votes],
        updatedAt: new Date().toISOString(),
      });
      return newVote;
    },
    [current, persist]
  );

  // ── 투표하기 ─────────────────────────────────────────────

  const castVote = useCallback(
    (voteId: string, optionIds: string[], userId: string): boolean => {
      const voteIdx = current.votes.findIndex((v) => v.id === voteId);
      if (voteIdx === -1) return false;
      const vote = current.votes[voteIdx];

      // 마감 여부 확인
      if (vote.deadline && new Date(vote.deadline) < new Date()) return false;

      const updatedOptions = vote.options.map((opt) => {
        const wasVoted = opt.voterIds.includes(userId);
        const shouldVote = optionIds.includes(opt.id);

        if (!vote.multipleChoice) {
          // 단수 선택: 기존 투표 모두 제거 후 선택한 것만 추가
          const filteredVoters = opt.voterIds.filter((id) => id !== userId);
          if (shouldVote) {
            return { ...opt, voterIds: [...filteredVoters, userId] };
          }
          return { ...opt, voterIds: filteredVoters };
        } else {
          // 복수 선택: 토글 방식
          if (shouldVote && !wasVoted) {
            return { ...opt, voterIds: [...opt.voterIds, userId] };
          } else if (!shouldVote && wasVoted) {
            return { ...opt, voterIds: opt.voterIds.filter((id) => id !== userId) };
          }
          return opt;
        }
      });

      const nextVotes = [...current.votes];
      nextVotes[voteIdx] = { ...vote, options: updatedOptions };
      persist({ ...current, votes: nextVotes, updatedAt: new Date().toISOString() });
      return true;
    },
    [current, persist]
  );

  // ── 투표 삭제 ─────────────────────────────────────────────

  const deleteVote = useCallback(
    (voteId: string): boolean => {
      const filtered = current.votes.filter((v) => v.id !== voteId);
      if (filtered.length === current.votes.length) return false;
      persist({ ...current, votes: filtered, updatedAt: new Date().toISOString() });
      return true;
    },
    [current, persist]
  );

  // ── 헬퍼 ─────────────────────────────────────────────────

  /** 특정 투표에서 userId가 선택한 optionId 목록 반환 */
  const getMyVotes = useCallback(
    (voteId: string, userId: string): string[] => {
      const vote = current.votes.find((v) => v.id === voteId);
      if (!vote) return [];
      return vote.options
        .filter((opt) => opt.voterIds.includes(userId))
        .map((opt) => opt.id);
    },
    [current]
  );

  /** 투표 마감 여부 확인 */
  const isExpired = useCallback((vote: GroupVoteCardItem): boolean => {
    if (!vote.deadline) return false;
    return new Date(vote.deadline) < new Date();
  }, []);

  /** 선택지별 득표수 및 비율 계산 */
  const getOptionStats = useCallback(
    (vote: GroupVoteCardItem) => {
      const totalVoters = new Set(
        vote.options.flatMap((opt) => opt.voterIds)
      ).size;
      return vote.options.map((opt) => ({
        ...opt,
        count: opt.voterIds.length,
        percent:
          totalVoters === 0
            ? 0
            : Math.round((opt.voterIds.length / totalVoters) * 100),
      }));
    },
    []
  );

  // ── 통계 ─────────────────────────────────────────────────

  const now = new Date();
  const activeVotes = current.votes.filter(
    (v) => !v.deadline || new Date(v.deadline) >= now
  );
  const closedVotes = current.votes.filter(
    (v) => !!v.deadline && new Date(v.deadline) < now
  );

  const stats = {
    total: current.votes.length,
    active: activeVotes.length,
    closed: closedVotes.length,
  };

  return {
    data: current,
    loading: isLoading,
    addVote,
    castVote,
    deleteVote,
    getMyVotes,
    isExpired,
    getOptionStats,
    activeVotes,
    closedVotes,
    stats,
    refetch: () => mutate(),
  };
}
