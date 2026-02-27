"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type {
  GroupVoteEntry,
  GroupVoteType,
  GroupVoteOption,
  GroupVoteBallot,
} from "@/types";

// ─── localStorage 헬퍼 ────────────────────────────────────────

const LS_KEY = (groupId: string) => `dancebase:group-vote:${groupId}`;

function loadVotes(groupId: string): GroupVoteEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY(groupId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as GroupVoteEntry[];
  } catch {
    return [];
  }
}

function saveVotes(groupId: string, votes: GroupVoteEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY(groupId), JSON.stringify(votes));
  } catch {
    /* ignore */
  }
}

// ─── 훅 ─────────────────────────────────────────────────────

export function useGroupVote(groupId: string) {
  const { data, mutate } = useSWR(
    groupId ? swrKeys.groupVote(groupId) : null,
    () => loadVotes(groupId),
    { revalidateOnFocus: false }
  );

  const votes: GroupVoteEntry[] = data ?? [];

  // ── 내부 업데이트 헬퍼 ───────────────────────────────────

  function update(next: GroupVoteEntry[]): void {
    saveVotes(groupId, next);
    mutate(next, false);
  }

  // ── 투표 생성 (draft 상태) ────────────────────────────────

  function createVote(
    title: string,
    description: string,
    type: GroupVoteType,
    optionLabels: string[],
    anonymous: boolean,
    deadline: string | undefined,
    createdBy: string
  ): boolean {
    if (!title.trim() || optionLabels.length < 2) return false;

    const options: GroupVoteOption[] = optionLabels.map((label) => ({
      id: crypto.randomUUID(),
      label: label.trim(),
      voteCount: 0,
    }));

    const newVote: GroupVoteEntry = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      type,
      status: "draft",
      options,
      ballots: [],
      anonymous,
      deadline: deadline || undefined,
      createdBy,
      createdAt: new Date().toISOString(),
    };

    const stored = loadVotes(groupId);
    update([newVote, ...stored]);
    return true;
  }

  // ── 투표 시작 ────────────────────────────────────────────

  function activateVote(voteId: string): boolean {
    const stored = loadVotes(groupId);
    const target = stored.find((v) => v.id === voteId);
    if (!target || target.status !== "draft") return false;

    const next = stored.map((v) =>
      v.id === voteId ? { ...v, status: "active" as const } : v
    );
    update(next);
    return true;
  }

  // ── 투표 종료 ────────────────────────────────────────────

  function closeVote(voteId: string): boolean {
    const stored = loadVotes(groupId);
    const target = stored.find((v) => v.id === voteId);
    if (!target || target.status !== "active") return false;

    const next = stored.map((v) =>
      v.id === voteId ? { ...v, status: "closed" as const } : v
    );
    update(next);
    return true;
  }

  // ── 투표 삭제 ────────────────────────────────────────────

  function deleteVote(voteId: string): boolean {
    const stored = loadVotes(groupId);
    const next = stored.filter((v) => v.id !== voteId);
    if (next.length === stored.length) return false;
    update(next);
    return true;
  }

  // ── 투표하기 (중복 투표 방지) ─────────────────────────────

  function castBallot(
    voteId: string,
    voterName: string,
    selectedOptionIds: string[]
  ): boolean {
    if (!voterName.trim() || selectedOptionIds.length === 0) return false;

    const stored = loadVotes(groupId);
    const target = stored.find((v) => v.id === voteId);
    if (!target || target.status !== "active") return false;

    // 중복 투표 방지
    const alreadyVoted = target.ballots.some(
      (b) => b.voterName === voterName.trim()
    );
    if (alreadyVoted) return false;

    // 단일 선택: 첫 번째만 사용
    const finalIds =
      target.type === "single"
        ? selectedOptionIds.slice(0, 1)
        : selectedOptionIds;

    const ballot: GroupVoteBallot = {
      voterName: voterName.trim(),
      selectedOptionIds: finalIds,
      votedAt: new Date().toISOString(),
    };

    const updatedOptions = target.options.map((opt) => ({
      ...opt,
      voteCount: finalIds.includes(opt.id)
        ? opt.voteCount + 1
        : opt.voteCount,
    }));

    const next = stored.map((v) =>
      v.id === voteId
        ? {
            ...v,
            options: updatedOptions,
            ballots: [...v.ballots, ballot],
          }
        : v
    );
    update(next);
    return true;
  }

  // ── 결과 계산 ────────────────────────────────────────────

  function getResults(voteId: string): {
    optionId: string;
    label: string;
    voteCount: number;
    percent: number;
  }[] {
    const vote = votes.find((v) => v.id === voteId);
    if (!vote) return [];

    const totalVotes = vote.ballots.length;

    return vote.options.map((opt) => ({
      optionId: opt.id,
      label: opt.label,
      voteCount: opt.voteCount,
      percent:
        totalVotes === 0 ? 0 : Math.round((opt.voteCount / totalVotes) * 100),
    }));
  }

  // ── 투표 여부 확인 ───────────────────────────────────────

  function hasVoted(voteId: string, voterName: string): boolean {
    const vote = votes.find((v) => v.id === voteId);
    if (!vote || !voterName.trim()) return false;
    return vote.ballots.some((b) => b.voterName === voterName.trim());
  }

  // ── 내 선택 옵션 ID 목록 ────────────────────────────────

  function getMySelectedIds(voteId: string, voterName: string): string[] {
    const vote = votes.find((v) => v.id === voteId);
    if (!vote || !voterName.trim()) return [];
    const ballot = vote.ballots.find((b) => b.voterName === voterName.trim());
    return ballot ? ballot.selectedOptionIds : [];
  }

  // ── 통계 ─────────────────────────────────────────────────

  const totalVotes = votes.length;
  const activeVotes = votes.filter((v) => v.status === "active").length;
  const closedVotes = votes.filter((v) => v.status === "closed").length;
  const draftVotes = votes.filter((v) => v.status === "draft").length;

  // 평균 참여율 (active + closed 투표에서 투표자 수 평균)
  const participatingVotes = votes.filter(
    (v) => v.status === "active" || v.status === "closed"
  );
  const averageParticipation =
    participatingVotes.length === 0
      ? 0
      : Math.round(
          participatingVotes.reduce((sum, v) => sum + v.ballots.length, 0) /
            participatingVotes.length
        );

  return {
    votes,
    loading: data === undefined,
    totalVotes,
    activeVotes,
    closedVotes,
    draftVotes,
    averageParticipation,
    createVote,
    activateVote,
    closeVote,
    deleteVote,
    castBallot,
    getResults,
    hasVoted,
    getMySelectedIds,
  };
}
