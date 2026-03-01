"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  PracticeChallengeEntry,
  PracticeChallengeParticipant,
  PracticeChallengeStatus,
} from "@/types";

// ─── localStorage 헬퍼 ────────────────────────────────────────

const LS_KEY = (groupId: string) =>
  `dancebase:practice-challenge:${groupId}`;

// ─── 자동 상태 계산 ───────────────────────────────────────────

function computeStatus(
  startDate: string,
  endDate: string,
  current: PracticeChallengeStatus
): PracticeChallengeStatus {
  // 취소 상태는 유지
  if (current === "cancelled") return "cancelled";
  const today = new Date().toISOString().slice(0, 10);
  if (today < startDate) return "upcoming";
  if (today > endDate) return "completed";
  return "active";
}

function withComputedStatus(
  entries: PracticeChallengeEntry[]
): PracticeChallengeEntry[] {
  return entries.map((e) => ({
    ...e,
    status: computeStatus(e.startDate, e.endDate, e.status),
  }));
}

// ─── 훅 ─────────────────────────────────────────────────────

export function usePracticeChallenge(groupId: string) {
  const { data, mutate } = useSWR(
    groupId ? swrKeys.practiceChallenge(groupId) : null,
    () => withComputedStatus(loadFromStorage<PracticeChallengeEntry[]>(LS_KEY(groupId), [])),
    { revalidateOnFocus: false }
  );

  const challenges = data ?? [];

  // ── 도전 추가 ──────────────────────────────────────────────

  function addChallenge(input: {
    title: string;
    description: string;
    targetValue: number;
    unit: string;
    startDate: string;
    endDate: string;
    reward?: string;
    createdBy: string;
  }): boolean {
    if (!input.title.trim()) {
      toast.error(TOAST.MISSION.TITLE_REQUIRED);
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
    if (!input.targetValue || input.targetValue < 1) {
      toast.error(TOAST.GOAL.VALUE_REQUIRED);
      return false;
    }
    if (!input.unit.trim()) {
      toast.error(TOAST.GOAL.UNIT_REQUIRED);
      return false;
    }
    try {
      const stored = loadFromStorage<PracticeChallengeEntry[]>(LS_KEY(groupId), []);
      const newEntry: PracticeChallengeEntry = {
        id: crypto.randomUUID(),
        title: input.title.trim(),
        description: input.description.trim(),
        status: computeStatus(input.startDate, input.endDate, "upcoming"),
        targetValue: input.targetValue,
        unit: input.unit.trim(),
        startDate: input.startDate,
        endDate: input.endDate,
        participants: [],
        reward: input.reward?.trim(),
        createdBy: input.createdBy,
        createdAt: new Date().toISOString(),
      };
      const next = [...stored, newEntry];
      saveToStorage(LS_KEY(groupId), next);
      mutate(withComputedStatus(next), false);
      toast.success(TOAST.MISSION.CREATED);
      return true;
    } catch {
      toast.error(TOAST.MISSION.CREATE_ERROR);
      return false;
    }
  }

  // ── 도전 수정 ──────────────────────────────────────────────

  function updateChallenge(
    challengeId: string,
    patch: Partial<Omit<PracticeChallengeEntry, "id" | "createdAt" | "createdBy" | "participants">>
  ): boolean {
    try {
      const stored = loadFromStorage<PracticeChallengeEntry[]>(LS_KEY(groupId), []);
      const idx = stored.findIndex((c) => c.id === challengeId);
      if (idx === -1) {
        toast.error(TOAST.MISSION.NOT_FOUND);
        return false;
      }
      const updated = { ...stored[idx], ...patch };
      const next = [
        ...stored.slice(0, idx),
        updated,
        ...stored.slice(idx + 1),
      ];
      saveToStorage(LS_KEY(groupId), next);
      mutate(withComputedStatus(next), false);
      toast.success(TOAST.MISSION.UPDATED);
      return true;
    } catch {
      toast.error(TOAST.MISSION.UPDATE_ERROR);
      return false;
    }
  }

  // ── 도전 삭제 ──────────────────────────────────────────────

  function deleteChallenge(challengeId: string): boolean {
    try {
      const stored = loadFromStorage<PracticeChallengeEntry[]>(LS_KEY(groupId), []);
      const next = stored.filter((c) => c.id !== challengeId);
      if (next.length === stored.length) return false;
      saveToStorage(LS_KEY(groupId), next);
      mutate(withComputedStatus(next), false);
      toast.success(TOAST.MISSION.DELETED);
      return true;
    } catch {
      toast.error(TOAST.MISSION.DELETE_ERROR);
      return false;
    }
  }

  // ── 참가 ──────────────────────────────────────────────────

  function joinChallenge(challengeId: string, memberName: string): boolean {
    if (!memberName.trim()) {
      toast.error(TOAST.NAME_REQUIRED_DOT);
      return false;
    }
    try {
      const stored = loadFromStorage<PracticeChallengeEntry[]>(LS_KEY(groupId), []);
      const challenge = stored.find((c) => c.id === challengeId);
      if (!challenge) {
        toast.error(TOAST.MISSION.NOT_FOUND);
        return false;
      }
      const alreadyJoined = challenge.participants.some(
        (p) => p.memberName.toLowerCase() === memberName.trim().toLowerCase()
      );
      if (alreadyJoined) {
        toast.error(TOAST.MISC.DUPLICATE_MEMBER_DOT);
        return false;
      }
      const newParticipant: PracticeChallengeParticipant = {
        memberName: memberName.trim(),
        progress: 0,
      };
      const next = stored.map((c) =>
        c.id === challengeId
          ? { ...c, participants: [...c.participants, newParticipant] }
          : c
      );
      saveToStorage(LS_KEY(groupId), next);
      mutate(withComputedStatus(next), false);
      toast.success(`${memberName.trim()}님이 도전에 참가했습니다.`);
      return true;
    } catch {
      toast.error(TOAST.MISC.JOIN_ERROR);
      return false;
    }
  }

  // ── 진행률 업데이트 ────────────────────────────────────────

  function updateProgress(
    challengeId: string,
    memberName: string,
    progress: number
  ): boolean {
    const clamped = Math.max(0, Math.min(100, Math.round(progress)));
    try {
      const stored = loadFromStorage<PracticeChallengeEntry[]>(LS_KEY(groupId), []);
      const next = stored.map((c) => {
        if (c.id !== challengeId) return c;
        return {
          ...c,
          participants: c.participants.map((p) => {
            if (p.memberName !== memberName) return p;
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
      mutate(withComputedStatus(next), false);
      if (clamped === 100) {
        toast.success(TOAST.MISSION.COMPLETED);
      }
      return true;
    } catch {
      toast.error(TOAST.ONBOARDING.PROGRESS_ERROR);
      return false;
    }
  }

  // ── 도전 완료 처리 ─────────────────────────────────────────

  function completeChallenge(challengeId: string): boolean {
    try {
      const stored = loadFromStorage<PracticeChallengeEntry[]>(LS_KEY(groupId), []);
      const idx = stored.findIndex((c) => c.id === challengeId);
      if (idx === -1) {
        toast.error(TOAST.MISSION.NOT_FOUND);
        return false;
      }
      const next = stored.map((c) =>
        c.id === challengeId ? { ...c, status: "completed" as PracticeChallengeStatus } : c
      );
      saveToStorage(LS_KEY(groupId), next);
      mutate(withComputedStatus(next), false);
      toast.success(TOAST.MISSION.COMPLETE_PROCESSED);
      return true;
    } catch {
      toast.error(TOAST.MISSION.COMPLETE_ERROR);
      return false;
    }
  }

  // ── 통계 ──────────────────────────────────────────────────

  const totalChallenges = challenges.length;
  const activeChallenges = challenges.filter((c) => c.status === "active").length;
  const completedChallenges = challenges.filter(
    (c) => c.status === "completed"
  ).length;

  // 전체 참여자 중 진행률 상위 5명
  const allParticipantEntries = challenges.flatMap((c) =>
    c.participants.map((p) => ({ ...p, challengeTitle: c.title }))
  );
  const topParticipants = [...allParticipantEntries]
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 5);

  const stats = {
    totalChallenges,
    activeChallenges,
    completedChallenges,
    topParticipants,
  };

  return {
    challenges,
    // CRUD
    addChallenge,
    updateChallenge,
    deleteChallenge,
    // 참가 / 진행
    joinChallenge,
    updateProgress,
    completeChallenge,
    // 통계
    stats,
    // SWR
    refetch: () => mutate(),
  };
}
