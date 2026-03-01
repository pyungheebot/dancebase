"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type { GroupChallengeItem, GroupChallengeStatus, GroupChallengeType } from "@/types";

const STORAGE_KEY_PREFIX = "dancebase:challenge-manager:";
const MAX_CHALLENGES = 20;

function getKey(groupId: string) {
  return `${STORAGE_KEY_PREFIX}${groupId}`;
}

function calcStatus(startDate: string, endDate: string): GroupChallengeStatus {
  const today = new Date().toISOString().slice(0, 10);
  if (today < startDate) return "upcoming";
  if (today > endDate) return "completed";
  return "active";
}

function loadChallenges(groupId: string): GroupChallengeItem[] {
  const items = loadFromStorage<GroupChallengeItem[]>(getKey(groupId), []);
  return items.map((c) => ({ ...c, status: calcStatus(c.startDate, c.endDate) }));
}

function saveChallenges(groupId: string, items: GroupChallengeItem[]) {
  saveToStorage(getKey(groupId), items);
}

export function useGroupChallengeManager(groupId: string) {
  const [challenges, setChallenges] = useState<GroupChallengeItem[]>([]);

  useEffect(() => {
    setChallenges(loadChallenges(groupId));
  }, [groupId]);

  const addChallenge = useCallback(
    (input: { title: string; description: string; type: GroupChallengeType; startDate: string; endDate: string; goal: string }) => {
      if (challenges.length >= MAX_CHALLENGES) {
        toast.error(`챌린지는 최대 ${MAX_CHALLENGES}개까지 생성할 수 있습니다.`);
        return;
      }
      const now = new Date().toISOString();
      const duration = Math.ceil((new Date(input.endDate).getTime() - new Date(input.startDate).getTime()) / (1000 * 60 * 60 * 24));
      const newItem: GroupChallengeItem = {
        id: `ch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: input.title,
        description: input.description,
        type: input.type,
        duration: Math.max(duration, 1),
        startDate: input.startDate,
        endDate: input.endDate,
        goal: input.goal,
        participants: [],
        status: calcStatus(input.startDate, input.endDate),
        createdAt: now,
      };
      const updated = [newItem, ...challenges];
      setChallenges(updated);
      saveChallenges(groupId, updated);
      toast.success(TOAST.CHALLENGE.CREATED);
    },
    [groupId, challenges]
  );

  const deleteChallenge = useCallback(
    (id: string) => {
      const updated = challenges.filter((c) => c.id !== id);
      if (updated.length === challenges.length) return;
      setChallenges(updated);
      saveChallenges(groupId, updated);
      toast.success(TOAST.CHALLENGE.DELETED);
    },
    [groupId, challenges]
  );

  const joinChallenge = useCallback(
    (id: string, participantName: string) => {
      const updated = challenges.map((c) => {
        if (c.id !== id) return c;
        if (c.participants.includes(participantName)) return c;
        return { ...c, participants: [...c.participants, participantName] };
      });
      setChallenges(updated);
      saveChallenges(groupId, updated);
    },
    [groupId, challenges]
  );

  const leaveChallenge = useCallback(
    (id: string, participantName: string) => {
      const updated = challenges.map((c) => {
        if (c.id !== id) return c;
        return { ...c, participants: c.participants.filter((p) => p !== participantName) };
      });
      setChallenges(updated);
      saveChallenges(groupId, updated);
    },
    [groupId, challenges]
  );

  const active = challenges.filter((c) => c.status === "active");
  const upcoming = challenges.filter((c) => c.status === "upcoming");
  const completed = challenges.filter((c) => c.status === "completed");

  return { challenges, active, upcoming, completed, addChallenge, deleteChallenge, joinChallenge, leaveChallenge };
}
