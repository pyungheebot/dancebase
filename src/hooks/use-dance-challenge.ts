"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { toast } from "sonner";
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
      toast.error("챌린지 제목을 입력해주세요.");
      return false;
    }
    if (!input.startDate || !input.endDate) {
      toast.error("시작일과 종료일을 입력해주세요.");
      return false;
    }
    if (input.startDate > input.endDate) {
      toast.error("종료일은 시작일보다 늦어야 합니다.");
      return false;
    }
    if (!input.targetCount || input.targetCount < 1) {
      toast.error("목표 횟수를 1 이상으로 입력해주세요.");
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
      toast.success("챌린지가 생성되었습니다.");
      return true;
    } catch {
      toast.error("챌린지 생성에 실패했습니다.");
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
      toast.success("챌린지가 삭제되었습니다.");
      return true;
    } catch {
      toast.error("챌린지 삭제에 실패했습니다.");
      return false;
    }
  }

  // ── 챌린지 참여 ────────────────────────────────────────────

  function joinChallenge(challengeId: string, name: string): boolean {
    if (!name.trim()) {
      toast.error("이름을 입력해주세요.");
      return false;
    }
    try {
      const stored = loadFromStorage<DanceChallenge[]>(LS_KEY(groupId), []);
      const challenge = stored.find((c) => c.id === challengeId);
      if (!challenge) {
        toast.error("챌린지를 찾을 수 없습니다.");
        return false;
      }
      const alreadyJoined = challenge.participants.some(
        (p) => p.name.toLowerCase() === name.trim().toLowerCase()
      );
      if (alreadyJoined) {
        toast.error("이미 참여 중인 이름입니다.");
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
      toast.error("챌린지 참여에 실패했습니다.");
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
        toast.success("챌린지를 완료했습니다!");
      } else {
        toast.success("진행률이 업데이트되었습니다.");
      }
      return true;
    } catch {
      toast.error("진행률 업데이트에 실패했습니다.");
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
