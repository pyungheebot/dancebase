"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  MeetingVoteData,
  MeetingVoteAgendaItem,
  MeetingVoteOption,
} from "@/types";

// ——————————————————————————————
// 결과 계산 유틸
// ——————————————————————————————

export type AgendaOptionResult = {
  optionId: string;
  text: string;
  count: number;
  percentage: number;
};

export type AgendaResult = {
  agendaId: string;
  totalVotes: number;
  options: AgendaOptionResult[];
};

function calcResults(agenda: MeetingVoteAgendaItem): AgendaResult {
  const totalVotes = agenda.votes.length;
  const options: AgendaOptionResult[] = agenda.options.map((opt) => {
    const count = agenda.votes.filter((v) => v.optionId === opt.id).length;
    const percentage = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);
    return { optionId: opt.id, text: opt.text, count, percentage };
  });
  return { agendaId: agenda.id, totalVotes, options };
}

// ——————————————————————————————
// 훅
// ——————————————————————————————

const STORAGE_KEY = (groupId: string) => `meeting-agenda-vote-${groupId}`;

export function useMeetingVote(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.meetingAgendaVote(groupId),
    () => loadFromStorage<MeetingVoteData>(STORAGE_KEY(groupId), {} as MeetingVoteData),
    { revalidateOnFocus: false }
  );

  const voteData: MeetingVoteData = data ?? {
    groupId,
    agendas: [],
    updatedAt: new Date().toISOString(),
  };

  // ——— 안건 생성 ———
  const createAgenda = useCallback(
    (params: {
      meetingTitle: string;
      question: string;
      options: string[];
      isMultiSelect: boolean;
      isAnonymous: boolean;
      deadline: string | null;
    }) => {
      const current = loadFromStorage<MeetingVoteData>(STORAGE_KEY(groupId), {} as MeetingVoteData);
      const newOptions: MeetingVoteOption[] = params.options.map((text) => ({
        id: crypto.randomUUID(),
        text,
      }));
      const newAgenda: MeetingVoteAgendaItem = {
        id: crypto.randomUUID(),
        meetingTitle: params.meetingTitle,
        question: params.question,
        options: newOptions,
        votes: [],
        isMultiSelect: params.isMultiSelect,
        isAnonymous: params.isAnonymous,
        isClosed: false,
        deadline: params.deadline,
        createdAt: new Date().toISOString(),
      };
      const updated: MeetingVoteData = {
        ...current,
        agendas: [newAgenda, ...current.agendas],
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(STORAGE_KEY(groupId), updated);
      mutate(updated, false);
    },
    [groupId, mutate]
  );

  // ——— 안건 삭제 ———
  const deleteAgenda = useCallback(
    (agendaId: string) => {
      const current = loadFromStorage<MeetingVoteData>(STORAGE_KEY(groupId), {} as MeetingVoteData);
      const updated: MeetingVoteData = {
        ...current,
        agendas: current.agendas.filter((a) => a.id !== agendaId),
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(STORAGE_KEY(groupId), updated);
      mutate(updated, false);
    },
    [groupId, mutate]
  );

  // ——— 안건 마감 ———
  const closeAgenda = useCallback(
    (agendaId: string) => {
      const current = loadFromStorage<MeetingVoteData>(STORAGE_KEY(groupId), {} as MeetingVoteData);
      const updated: MeetingVoteData = {
        ...current,
        agendas: current.agendas.map((a) =>
          a.id === agendaId ? { ...a, isClosed: true } : a
        ),
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(STORAGE_KEY(groupId), updated);
      mutate(updated, false);
    },
    [groupId, mutate]
  );

  // ——— 투표 등록 ———
  const castVote = useCallback(
    (agendaId: string, optionIds: string[], voterName: string) => {
      const current = loadFromStorage<MeetingVoteData>(STORAGE_KEY(groupId), {} as MeetingVoteData);
      const now = new Date().toISOString();
      const updated: MeetingVoteData = {
        ...current,
        agendas: current.agendas.map((a) => {
          if (a.id !== agendaId) return a;
          // 단일 선택이면 기존 투표자 표 제거 후 재등록
          const filteredVotes = a.isMultiSelect
            ? a.votes.filter((v) => v.voterName !== voterName)
            : a.votes.filter((v) => v.voterName !== voterName);
          const newVotes = optionIds.map((optionId) => ({
            optionId,
            voterName,
            votedAt: now,
          }));
          return { ...a, votes: [...filteredVotes, ...newVotes] };
        }),
        updatedAt: now,
      };
      saveToStorage(STORAGE_KEY(groupId), updated);
      mutate(updated, false);
    },
    [groupId, mutate]
  );

  // ——— 투표 취소 ———
  const removeVote = useCallback(
    (agendaId: string, voterName: string) => {
      const current = loadFromStorage<MeetingVoteData>(STORAGE_KEY(groupId), {} as MeetingVoteData);
      const updated: MeetingVoteData = {
        ...current,
        agendas: current.agendas.map((a) =>
          a.id !== agendaId
            ? a
            : { ...a, votes: a.votes.filter((v) => v.voterName !== voterName) }
        ),
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(STORAGE_KEY(groupId), updated);
      mutate(updated, false);
    },
    [groupId, mutate]
  );

  // ——— 결과 계산 ———
  const getAgendaResults = useCallback(
    (agendaId: string): AgendaResult | null => {
      const agenda = voteData.agendas.find((a) => a.id === agendaId);
      if (!agenda) return null;
      return calcResults(agenda);
    },
    [voteData.agendas]
  );

  // ——————————————————————————————
  // 통계
  // ——————————————————————————————

  const totalAgendas = voteData.agendas.length;
  const activeAgendas = voteData.agendas.filter((a) => !a.isClosed).length;
  const totalVotes = voteData.agendas.reduce(
    (sum, a) => sum + a.votes.length,
    0
  );

  return {
    voteData,
    loading: isLoading,
    refetch: () => mutate(),
    // CRUD
    createAgenda,
    deleteAgenda,
    closeAgenda,
    // 투표
    castVote,
    removeVote,
    // 결과
    getAgendaResults,
    // 통계
    totalAgendas,
    activeAgendas,
    totalVotes,
  };
}
