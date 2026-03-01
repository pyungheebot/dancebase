"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { invalidateGroupChallengeCard } from "@/lib/swr/invalidate";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type {
  DanceGroupChallengeEntry,
  DanceGroupChallengeStore,
  DanceGroupChallengeCategory,
  DanceGroupChallengeParticipant,
  DanceGroupChallengeParticipantStatus,
} from "@/types";

const STORAGE_KEY_PREFIX = "dancebase:group-challenge-card:";

function getStorageKey(groupId: string): string {
  return `${STORAGE_KEY_PREFIX}${groupId}`;
}

function loadStore(groupId: string): DanceGroupChallengeStore {
  return loadFromStorage<DanceGroupChallengeStore>(getStorageKey(groupId), { entries: [], updatedAt: new Date().toISOString() });
}

function saveStore(groupId: string, store: DanceGroupChallengeStore): void {
  saveToStorage(getStorageKey(groupId), store);
}

function calcChallengeStatus(startDate: string, endDate: string): "upcoming" | "active" | "completed" {
  const today = new Date().toISOString().slice(0, 10);
  if (today < startDate) return "upcoming";
  if (today > endDate) return "completed";
  return "active";
}

function generateId(): string {
  return `dgcc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function useGroupChallengeCard(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    groupId ? swrKeys.groupChallengeCard(groupId) : null,
    () => loadStore(groupId)
  );

  const store = data ?? { entries: [], updatedAt: new Date().toISOString() };
  const entries = store.entries;

  // 챌린지 생성
  const createChallenge = useCallback(
    (input: {
      title: string;
      description: string;
      category: DanceGroupChallengeCategory;
      startDate: string;
      endDate: string;
    }): boolean => {
      if (!input.title.trim()) {
        toast.error(TOAST.TITLE_REQUIRED);
        return false;
      }
      if (!input.startDate || !input.endDate) {
        toast.error(TOAST.DATE.START_END_REQUIRED_NO_DOT);
        return false;
      }
      if (input.startDate > input.endDate) {
        toast.error(TOAST.DATE.END_AFTER_START);
        return false;
      }
      const now = new Date().toISOString();
      const newEntry: DanceGroupChallengeEntry = {
        id: generateId(),
        title: input.title.trim(),
        description: input.description.trim(),
        category: input.category,
        startDate: input.startDate,
        endDate: input.endDate,
        participants: [],
        createdAt: now,
        updatedAt: now,
      };
      const updated: DanceGroupChallengeStore = {
        entries: [newEntry, ...entries],
        updatedAt: now,
      };
      saveStore(groupId, updated);
      mutate(updated, false);
      invalidateGroupChallengeCard(groupId);
      toast.success(TOAST.CHALLENGE.CREATED_NO_DOT);
      return true;
    },
    [groupId, entries, mutate]
  );

  // 챌린지 수정
  const updateChallenge = useCallback(
    (
      id: string,
      input: {
        title: string;
        description: string;
        category: DanceGroupChallengeCategory;
        startDate: string;
        endDate: string;
      }
    ): boolean => {
      if (!input.title.trim()) {
        toast.error(TOAST.TITLE_REQUIRED);
        return false;
      }
      if (input.startDate > input.endDate) {
        toast.error(TOAST.DATE.END_AFTER_START);
        return false;
      }
      const now = new Date().toISOString();
      const updated: DanceGroupChallengeStore = {
        entries: entries.map((e) =>
          e.id === id
            ? {
                ...e,
                title: input.title.trim(),
                description: input.description.trim(),
                category: input.category,
                startDate: input.startDate,
                endDate: input.endDate,
                updatedAt: now,
              }
            : e
        ),
        updatedAt: now,
      };
      saveStore(groupId, updated);
      mutate(updated, false);
      invalidateGroupChallengeCard(groupId);
      toast.success(TOAST.CHALLENGE.UPDATED);
      return true;
    },
    [groupId, entries, mutate]
  );

  // 챌린지 삭제
  const deleteChallenge = useCallback(
    (id: string): void => {
      const now = new Date().toISOString();
      const updated: DanceGroupChallengeStore = {
        entries: entries.filter((e) => e.id !== id),
        updatedAt: now,
      };
      saveStore(groupId, updated);
      mutate(updated, false);
      invalidateGroupChallengeCard(groupId);
      toast.success(TOAST.CHALLENGE.DELETED_NO_DOT);
    },
    [groupId, entries, mutate]
  );

  // 참여자 추가
  const addParticipant = useCallback(
    (challengeId: string, name: string): boolean => {
      if (!name.trim()) {
        toast.error(TOAST.STAFF_CALL.PARTICIPANT_NAME_REQUIRED);
        return false;
      }
      const challenge = entries.find((e) => e.id === challengeId);
      if (!challenge) return false;
      const alreadyExists = challenge.participants.some(
        (p) => p.name === name.trim()
      );
      if (alreadyExists) {
        toast.error(TOAST.MISC.DUPLICATE_MEMBER);
        return false;
      }
      const now = new Date().toISOString();
      const newParticipant: DanceGroupChallengeParticipant = {
        id: generateId(),
        name: name.trim(),
        status: "not_started",
        completedRank: null,
        joinedAt: now,
      };
      const updated: DanceGroupChallengeStore = {
        entries: entries.map((e) =>
          e.id === challengeId
            ? {
                ...e,
                participants: [...e.participants, newParticipant],
                updatedAt: now,
              }
            : e
        ),
        updatedAt: now,
      };
      saveStore(groupId, updated);
      mutate(updated, false);
      invalidateGroupChallengeCard(groupId);
      toast.success(`${name.trim()} 참여자가 추가되었습니다`);
      return true;
    },
    [groupId, entries, mutate]
  );

  // 참여자 상태 변경
  const updateParticipantStatus = useCallback(
    (
      challengeId: string,
      participantId: string,
      status: DanceGroupChallengeParticipantStatus
    ): void => {
      const challenge = entries.find((e) => e.id === challengeId);
      if (!challenge) return;

      // 완료 시 순위 계산
      const completedCount = challenge.participants.filter(
        (p) => p.status === "completed" && p.id !== participantId
      ).length;
      const completedRank = status === "completed" ? completedCount + 1 : null;

      const now = new Date().toISOString();
      const updated: DanceGroupChallengeStore = {
        entries: entries.map((e) =>
          e.id === challengeId
            ? {
                ...e,
                participants: e.participants.map((p) =>
                  p.id === participantId
                    ? { ...p, status, completedRank }
                    : p
                ),
                updatedAt: now,
              }
            : e
        ),
        updatedAt: now,
      };
      saveStore(groupId, updated);
      mutate(updated, false);
      invalidateGroupChallengeCard(groupId);
    },
    [groupId, entries, mutate]
  );

  // 참여자 삭제
  const removeParticipant = useCallback(
    (challengeId: string, participantId: string): void => {
      const now = new Date().toISOString();
      const updated: DanceGroupChallengeStore = {
        entries: entries.map((e) =>
          e.id === challengeId
            ? {
                ...e,
                participants: e.participants.filter((p) => p.id !== participantId),
                updatedAt: now,
              }
            : e
        ),
        updatedAt: now,
      };
      saveStore(groupId, updated);
      mutate(updated, false);
      invalidateGroupChallengeCard(groupId);
    },
    [groupId, entries, mutate]
  );

  // 통계 계산
  const total = entries.length;
  const completedChallenges = entries.filter(
    (e) => calcChallengeStatus(e.startDate, e.endDate) === "completed"
  );
  const completionRate =
    total > 0 ? Math.round((completedChallenges.length / total) * 100) : 0;

  // 카테고리별 카운트
  const categoryCounts: Record<DanceGroupChallengeCategory, number> = {
    choreography: 0,
    freestyle: 0,
    cover: 0,
    fitness: 0,
  };
  entries.forEach((e) => {
    categoryCounts[e.category]++;
  });

  // 가장 인기 카테고리
  const popularCategory = (
    Object.entries(categoryCounts) as [DanceGroupChallengeCategory, number][]
  ).reduce<DanceGroupChallengeCategory | null>(
    (best, [cat, count]) => {
      if (best === null) return count > 0 ? cat : null;
      return count > categoryCounts[best] ? cat : best;
    },
    null
  );

  // 탭별 필터링
  const activeChallenges = entries.filter(
    (e) => calcChallengeStatus(e.startDate, e.endDate) === "active"
  );
  const upcomingChallenges = entries.filter(
    (e) => calcChallengeStatus(e.startDate, e.endDate) === "upcoming"
  );
  const completedList = entries.filter(
    (e) => calcChallengeStatus(e.startDate, e.endDate) === "completed"
  );

  return {
    entries,
    activeChallenges,
    upcomingChallenges,
    completedList,
    total,
    completionRate,
    categoryCounts,
    popularCategory,
    loading: isLoading,
    createChallenge,
    updateChallenge,
    deleteChallenge,
    addParticipant,
    updateParticipantStatus,
    removeParticipant,
    refetch: () => mutate(),
  };
}
