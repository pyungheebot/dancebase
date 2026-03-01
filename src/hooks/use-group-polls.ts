"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { GroupPoll, PollOption } from "@/types";

const STORAGE_KEY_PREFIX = "dancebase:polls:";

function getStorageKey(groupId: string): string {
  return `${STORAGE_KEY_PREFIX}${groupId}`;
}

function loadPolls(groupId: string): GroupPoll[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(groupId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as GroupPoll[];
  } catch {
    return [];
  }
}

function savePolls(groupId: string, polls: GroupPoll[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(groupId), JSON.stringify(polls));
  } catch {
    // localStorage 쓰기 실패 무시
  }
}

function isPollExpired(poll: GroupPoll): boolean {
  if (!poll.expiresAt) return false;
  return new Date(poll.expiresAt) < new Date();
}

export function useGroupPolls(groupId: string) {
  const [polls, setPolls] = useState<GroupPoll[]>(() => loadPolls(groupId));
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>("");

  // 현재 로그인 유저 정보 조회
  useEffect(() => {
    const supabase = createClient();
    const fetchUser = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) return;
      setCurrentUserId(user.id);
      const { data: profileData } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();
      const profile = profileData as { name?: string } | null;
      if (profile?.name) setCurrentUserName(profile.name);
    };
    fetchUser();
  }, [groupId]);

  // 진행 중 / 마감 투표 분리
  const activePolls = polls.filter((p) => !isPollExpired(p));
  const expiredPolls = polls.filter((p) => isPollExpired(p));

  // 투표 생성
  const createPoll = useCallback(
    (params: {
      title: string;
      options: string[];
      type: "single" | "multiple";
      anonymous: boolean;
      expiresAt: string | null;
    }): void => {
      if (!currentUserId) return;

      const newPoll: GroupPoll = {
        id: crypto.randomUUID(),
        groupId,
        title: params.title.trim(),
        options: params.options.map((text) => ({
          id: crypto.randomUUID(),
          text: text.trim(),
          voterIds: [],
        })),
        type: params.type,
        anonymous: params.anonymous,
        creatorId: currentUserId,
        creatorName: currentUserName,
        expiresAt: params.expiresAt,
        createdAt: new Date().toISOString(),
      };

      setPolls((prev) => {
        const updated = [newPoll, ...prev];
        savePolls(groupId, updated);
        return updated;
      });
    },
    [groupId, currentUserId, currentUserName]
  );

  // 투표 참여 (단일/복수 선택)
  const vote = useCallback(
    (pollId: string, optionIds: string[]): void => {
      if (!currentUserId) return;

      setPolls((prev) => {
        const updated = prev.map((poll) => {
          if (poll.id !== pollId) return poll;
          if (isPollExpired(poll)) return poll;

          // 이미 투표한 경우 중복 방지
          const alreadyVoted = poll.options.some((opt) =>
            opt.voterIds.includes(currentUserId)
          );
          if (alreadyVoted) return poll;

          // 단일 선택: optionIds에서 첫 번째만 사용
          const targetIds =
            poll.type === "single" ? optionIds.slice(0, 1) : optionIds;

          const newOptions: PollOption[] = poll.options.map((opt) => {
            if (targetIds.includes(opt.id)) {
              return { ...opt, voterIds: [...opt.voterIds, currentUserId] };
            }
            return opt;
          });

          return { ...poll, options: newOptions };
        });

        savePolls(groupId, updated);
        return updated;
      });
    },
    [groupId, currentUserId]
  );

  // 투표 취소 (본인 투표만)
  const unvote = useCallback(
    (pollId: string): void => {
      if (!currentUserId) return;

      setPolls((prev) => {
        const updated = prev.map((poll) => {
          if (poll.id !== pollId) return poll;
          if (isPollExpired(poll)) return poll;

          const newOptions: PollOption[] = poll.options.map((opt) => ({
            ...opt,
            voterIds: opt.voterIds.filter((id) => id !== currentUserId),
          }));

          return { ...poll, options: newOptions };
        });

        savePolls(groupId, updated);
        return updated;
      });
    },
    [groupId, currentUserId]
  );

  // 투표 삭제 (생성자만)
  const deletePoll = useCallback(
    (pollId: string): void => {
      setPolls((prev) => {
        const updated = prev.filter((p) => p.id !== pollId);
        savePolls(groupId, updated);
        return updated;
      });
    },
    [groupId]
  );

  // 특정 투표에서 내 선택 옵션 ID 목록 반환
  const getMyVotedOptionIds = useCallback(
    (pollId: string): string[] => {
      if (!currentUserId) return [];
      const poll = polls.find((p) => p.id === pollId);
      if (!poll) return [];
      return poll.options
        .filter((opt) => opt.voterIds.includes(currentUserId))
        .map((opt) => opt.id);
    },
    [polls, currentUserId]
  );

  // 내가 투표했는지 여부
  const hasVoted = useCallback(
    (pollId: string): boolean => {
      if (!currentUserId) return false;
      const poll = polls.find((p) => p.id === pollId);
      if (!poll) return false;
      return poll.options.some((opt) => opt.voterIds.includes(currentUserId));
    },
    [polls, currentUserId]
  );

  // 총 투표자 수 (중복 없이)
  const getTotalVoters = useCallback((poll: GroupPoll): number => {
    const allVoterIds = poll.options.flatMap((opt) => opt.voterIds);
    return new Set(allVoterIds).size;
  }, []);

  // 옵션별 투표 비율 (0~100)
  const getOptionPercent = useCallback(
    (poll: GroupPoll, optionId: string): number => {
      const total = getTotalVoters(poll);
      if (total === 0) return 0;
      const opt = poll.options.find((o) => o.id === optionId);
      if (!opt) return 0;
      return Math.round((opt.voterIds.length / total) * 100);
    },
    [getTotalVoters]
  );

  // 최다 득표 옵션 ID (마감 투표에서 하이라이트 용도)
  const getTopOptionId = useCallback((poll: GroupPoll): string | null => {
    if (poll.options.length === 0) return null;
    const sorted = [...poll.options].sort(
      (a, b) => b.voterIds.length - a.voterIds.length
    );
    if (sorted[0].voterIds.length === 0) return null;
    return sorted[0].id;
  }, []);

  return {
    polls,
    activePolls,
    expiredPolls,
    loading: false,
    currentUserId,
    createPoll,
    vote,
    unvote,
    deletePoll,
    getMyVotedOptionIds,
    hasVoted,
    getTotalVoters,
    getOptionPercent,
    getTopOptionId,
    isPollExpired,
  };
}
