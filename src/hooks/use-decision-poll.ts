"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { DecisionPoll, PollVote, PollVoteChoice } from "@/types";

// ─── localStorage 헬퍼 ────────────────────────────────────────

const LS_KEY = (groupId: string) =>
  `dancebase:decision-polls:${groupId}`;

function loadPolls(groupId: string): DecisionPoll[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as DecisionPoll[];
  } catch {
    return [];
  }
}

function savePolls(groupId: string, polls: DecisionPoll[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY(groupId), JSON.stringify(polls));
  } catch {
    /* ignore */
  }
}

// ─── 결과 계산 ────────────────────────────────────────────────

function calcResult(votes: PollVote[]): PollVoteChoice | undefined {
  if (votes.length === 0) return undefined;
  const count: Record<PollVoteChoice, number> = {
    agree: 0,
    disagree: 0,
    abstain: 0,
  };
  for (const v of votes) {
    count[v.choice] += 1;
  }
  const max = Math.max(count.agree, count.disagree, count.abstain);
  // 동점일 경우 보류(abstain)로 처리
  if (count.agree === max && count.agree > count.disagree && count.agree > count.abstain) {
    return "agree";
  }
  if (count.disagree === max && count.disagree > count.agree && count.disagree > count.abstain) {
    return "disagree";
  }
  return "abstain";
}

// ─── 훅 ─────────────────────────────────────────────────────

export function useDecisionPoll(groupId: string) {
  const { data, mutate } = useSWR(
    groupId ? swrKeys.decisionPoll(groupId) : null,
    () => loadPolls(groupId),
    { revalidateOnFocus: false }
  );

  const polls: DecisionPoll[] = data ?? [];

  // ── 내부 업데이트 헬퍼 ───────────────────────────────────

  function update(next: DecisionPoll[]): void {
    savePolls(groupId, next);
    mutate(next, false);
  }

  // ── 투표 생성 ────────────────────────────────────────────

  function createPoll(
    topic: string,
    description: string,
    deadline: string
  ): boolean {
    if (!topic.trim()) return false;
    if (!deadline) return false;
    const stored = loadPolls(groupId);
    const newPoll: DecisionPoll = {
      id: crypto.randomUUID(),
      topic: topic.trim(),
      description: description.trim(),
      deadline,
      votes: [],
      isClosed: false,
      createdAt: new Date().toISOString(),
    };
    update([newPoll, ...stored]);
    return true;
  }

  // ── 투표 삭제 ────────────────────────────────────────────

  function deletePoll(pollId: string): boolean {
    const stored = loadPolls(groupId);
    const next = stored.filter((p) => p.id !== pollId);
    if (next.length === stored.length) return false;
    update(next);
    return true;
  }

  // ── 투표 행사 ────────────────────────────────────────────

  function castVote(
    pollId: string,
    voterName: string,
    choice: PollVoteChoice,
    reason: string
  ): boolean {
    if (!voterName.trim()) return false;
    const stored = loadPolls(groupId);
    const idx = stored.findIndex((p) => p.id === pollId);
    if (idx === -1) return false;
    const poll = stored[idx];
    if (poll.isClosed) return false;

    // 같은 이름의 기존 투표를 교체
    const prevVotes = poll.votes.filter((v) => v.voterName !== voterName.trim());
    const newVote: PollVote = {
      id: crypto.randomUUID(),
      voterName: voterName.trim(),
      choice,
      reason: reason.trim(),
      createdAt: new Date().toISOString(),
    };
    const next = stored.map((p) =>
      p.id === pollId ? { ...p, votes: [...prevVotes, newVote] } : p
    );
    update(next);
    return true;
  }

  // ── 투표 종료 (자동 결과 계산) ───────────────────────────

  function closePoll(pollId: string): boolean {
    const stored = loadPolls(groupId);
    const idx = stored.findIndex((p) => p.id === pollId);
    if (idx === -1) return false;
    const poll = stored[idx];
    if (poll.isClosed) return false;

    const result = calcResult(poll.votes);
    const next = stored.map((p) =>
      p.id === pollId ? { ...p, isClosed: true, result } : p
    );
    update(next);
    return true;
  }

  // ── 통계 ─────────────────────────────────────────────────

  const totalPolls = polls.length;
  const activePollsCount = polls.filter((p) => !p.isClosed).length;
  const closedPollsCount = polls.filter((p) => p.isClosed).length;

  return {
    polls,
    // CRUD
    createPoll,
    deletePoll,
    castVote,
    closePoll,
    // 통계
    totalPolls,
    activePollsCount,
    closedPollsCount,
    // SWR
    refetch: () => mutate(),
  };
}
