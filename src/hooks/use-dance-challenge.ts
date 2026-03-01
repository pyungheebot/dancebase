"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { DanceChallenge, ChallengeCategory, ChallengeParticipant } from "@/types";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";

// ─── localStorage 헬퍼 ────────────────────────────────────────

const LS_KEY = (groupId: string) => `dancebase:challenges:${groupId}`;

// ─── 자동 상태 계산 ───────────────────────────────────────────

function computeStatus(
  startDate: string,
  endDate: string
): DanceChallenge["status"] {
  const today = new Date().toISOString().slice(0, 10);
  if (today < startDate) return "upcoming";
  if (today > endDate) return "ended";
  return "active";
}

// ─── 훅 ─────────────────────────────────────────────────────

export function useDanceChallenge(groupId: string) {
  const { data, mutate } = useSWR(
    groupId ? swrKeys.danceChallenge(groupId) : null,
    () => {
      const stored = loadFromStorage<DanceChallenge[]>(LS_KEY(groupId), []);
      // 저장 시마다 상태를 재계산해서 반환
      return stored.map((c) => ({
        ...c,
        status: computeStatus(c.startDate, c.endDate),
      }));
    },
    { revalidateOnFocus: false }
  );

  const challenges = data ?? [];

  // ── 챌린지 추가 ────────────────────────────────────────────

  function addChallenge(input: {
    title: string;
    description: string;
    category: ChallengeCategory;
    startDate: string;
    endDate: string;
    targetCount: number;
    reward: string;
  }): boolean {
    if (!input.title.trim()) {
      toast.error(TOAST.CHALLENGE.TITLE_REQUIRED);
      return false;
    }
    if (!input.startDate || !input.endDate) {
      toast.error(TOAST.DATE.START_END_REQUIRED);
      return false;
    }
    if (input.startDate > input.endDate) {
      toast.error(TOAST.DATE.END_LATER_THAN_START);
      return false;
    }
    if (!input.targetCount || input.targetCount < 1) {
      toast.error(TOAST.GOAL.COUNT_REQUIRED);
      return false;
    }
    try {
      const stored = loadFromStorage<DanceChallenge[]>(LS_KEY(groupId), []);
      const newChallenge: DanceChallenge = {
        id: crypto.randomUUID(),
        title: input.title.trim(),
        description: input.description.trim(),
        category: input.category,
        startDate: input.startDate,
        endDate: input.endDate,
        targetCount: input.targetCount,
        participants: [],
        reward: input.reward.trim(),
        status: computeStatus(input.startDate, input.endDate),
        createdAt: new Date().toISOString(),
      };
      const next = [...stored, newChallenge];
      saveToStorage(LS_KEY(groupId), next);
      mutate(
        next.map((c) => ({ ...c, status: computeStatus(c.startDate, c.endDate) })),
        false
      );
      toast.success(TOAST.CHALLENGE.CREATED);
      return true;
    } catch {
      toast.error(TOAST.CHALLENGE.CREATE_ERROR);
      return false;
    }
  }

  // ── 챌린지 삭제 ────────────────────────────────────────────

  function deleteChallenge(challengeId: string): boolean {
    try {
      const stored = loadFromStorage<DanceChallenge[]>(LS_KEY(groupId), []);
      const next = stored.filter((c) => c.id !== challengeId);
      if (next.length === stored.length) return false;
      saveToStorage(LS_KEY(groupId), next);
      mutate(
        next.map((c) => ({ ...c, status: computeStatus(c.startDate, c.endDate) })),
        false
      );
      toast.success(TOAST.CHALLENGE.DELETED);
      return true;
    } catch {
      toast.error(TOAST.CHALLENGE.DELETE_ERROR);
      return false;
    }
  }

  // ── 챌린지 참여 ────────────────────────────────────────────

  function joinChallenge(challengeId: string, name: string): boolean {
    if (!name.trim()) {
      toast.error(TOAST.NAME_REQUIRED_DOT);
      return false;
    }
    try {
      const stored = loadFromStorage<DanceChallenge[]>(LS_KEY(groupId), []);
      const challenge = stored.find((c) => c.id === challengeId);
      if (!challenge) {
        toast.error(TOAST.CHALLENGE.NOT_FOUND);
        return false;
      }
      const alreadyJoined = challenge.participants.some(
        (p) => p.name.toLowerCase() === name.trim().toLowerCase()
      );
      if (alreadyJoined) {
        toast.error(TOAST.MISC.DUPLICATE_NAME);
        return false;
      }
      const newParticipant: ChallengeParticipant = {
        id: crypto.randomUUID(),
        name: name.trim(),
        progress: 0,
        note: "",
      };
      const next = stored.map((c) =>
        c.id === challengeId
          ? { ...c, participants: [...c.participants, newParticipant] }
          : c
      );
      saveToStorage(LS_KEY(groupId), next);
      mutate(
        next.map((c) => ({ ...c, status: computeStatus(c.startDate, c.endDate) })),
        false
      );
      toast.success(`${name.trim()}님이 챌린지에 참여했습니다.`);
      return true;
    } catch {
      toast.error(TOAST.CHALLENGE.JOIN_ERROR);
      return false;
    }
  }

  // ── 진행률 업데이트 ─────────────────────────────────────────

  function updateProgress(
    challengeId: string,
    participantId: string,
    progress: number
  ): boolean {
    const clamped = Math.max(0, Math.min(100, Math.round(progress)));
    try {
      const stored = loadFromStorage<DanceChallenge[]>(LS_KEY(groupId), []);
      const next = stored.map((c) => {
        if (c.id !== challengeId) return c;
        return {
          ...c,
          participants: c.participants.map((p) => {
            if (p.id !== participantId) return p;
            const completed = clamped === 100;
            return {
              ...p,
              progress: clamped,
              completedAt:
                completed && !p.completedAt
                  ? new Date().toISOString()
                  : p.completedAt,
            };
          }),
        };
      });
      saveToStorage(LS_KEY(groupId), next);
      mutate(
        next.map((c) => ({ ...c, status: computeStatus(c.startDate, c.endDate) })),
        false
      );
      if (clamped === 100) {
        toast.success(TOAST.CHALLENGE.COMPLETED);
      } else {
        toast.success(TOAST.ONBOARDING.PROGRESS_UPDATED);
      }
      return true;
    } catch {
      toast.error(TOAST.ONBOARDING.PROGRESS_ERROR);
      return false;
    }
  }

  // ── 통계 ─────────────────────────────────────────────────

  const activeChallenges = challenges.filter((c) => c.status === "active").length;

  const totalParticipants = challenges.reduce(
    (sum, c) => sum + c.participants.length,
    0
  );

  const allParticipants = challenges.flatMap((c) => c.participants);
  const completedParticipants = allParticipants.filter(
    (p) => p.progress === 100
  ).length;
  const completionRate =
    allParticipants.length > 0
      ? Math.round((completedParticipants / allParticipants.length) * 100)
      : 0;

  return {
    challenges,
    // CRUD
    addChallenge,
    deleteChallenge,
    // 참여 / 진행
    joinChallenge,
    updateProgress,
    // 통계
    activeChallenges,
    totalParticipants,
    completionRate,
    // SWR
    refetch: () => mutate(),
  };
}
