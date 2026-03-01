"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import { loadFromStorage, saveToStorage } from "@/lib/local-storage";
import type {
  PracticeFeedbackData,
  PracticeFeedbackSession,
  PracticeFeedbackResponse,
  PracticeFeedbackRating,
  PracticeFeedbackAggregate,
} from "@/types";

// ============================================
// localStorage 유틸
// ============================================

function storageKey(groupId: string): string {
  return `dancebase:practice-feedback-session:${groupId}`;
}

// ============================================
// 집계 계산 유틸
// ============================================

function emptyRating(): PracticeFeedbackRating {
  return { choreography: 0, music: 0, environment: 0, atmosphere: 0 };
}

function aggregateSession(session: PracticeFeedbackSession): PracticeFeedbackAggregate {
  const total = session.responses.length;

  if (total === 0) {
    return {
      sessionId: session.id,
      practiceDate: session.practiceDate,
      title: session.title,
      totalResponses: 0,
      averageOverall: 0,
      averageCategories: emptyRating(),
      goodPointsList: [],
      improvementsList: [],
    };
  }

  const sumOverall = session.responses.reduce((s, r) => s + r.overallRating, 0);
  const sumCategories = session.responses.reduce(
    (acc, r) => ({
      choreography: acc.choreography + r.categoryRatings.choreography,
      music: acc.music + r.categoryRatings.music,
      environment: acc.environment + r.categoryRatings.environment,
      atmosphere: acc.atmosphere + r.categoryRatings.atmosphere,
    }),
    emptyRating()
  );

  const averageCategories: PracticeFeedbackRating = {
    choreography: Math.round((sumCategories.choreography / total) * 10) / 10,
    music: Math.round((sumCategories.music / total) * 10) / 10,
    environment: Math.round((sumCategories.environment / total) * 10) / 10,
    atmosphere: Math.round((sumCategories.atmosphere / total) * 10) / 10,
  };

  const goodPointsList = session.responses
    .filter((r) => r.goodPoints && r.goodPoints.trim() !== "")
    .map((r) => r.goodPoints as string);

  const improvementsList = session.responses
    .filter((r) => r.improvements && r.improvements.trim() !== "")
    .map((r) => r.improvements as string);

  return {
    sessionId: session.id,
    practiceDate: session.practiceDate,
    title: session.title,
    totalResponses: total,
    averageOverall: Math.round((sumOverall / total) * 10) / 10,
    averageCategories,
    goodPointsList,
    improvementsList,
  };
}

// ============================================
// 훅
// ============================================

export function usePracticeFeedbackSession(groupId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.practiceFeedbackSession(groupId),
    () => loadFromStorage<PracticeFeedbackData>(storageKey(groupId), {} as PracticeFeedbackData),
    {
      fallbackData: {
        groupId,
        sessions: [],
        updatedAt: new Date().toISOString(),
      },
    }
  );

  const sessions: PracticeFeedbackSession[] = useMemo(() => data?.sessions ?? [], [data?.sessions]);

  // 세션 생성
  const createSession = useCallback(
    (params: { practiceDate: string; title?: string }): PracticeFeedbackSession => {
      const current = loadFromStorage<PracticeFeedbackData>(storageKey(groupId), {} as PracticeFeedbackData);
      const newSession: PracticeFeedbackSession = {
        id: crypto.randomUUID(),
        groupId,
        practiceDate: params.practiceDate,
        title: params.title,
        responses: [],
        createdAt: new Date().toISOString(),
      };
      const updated: PracticeFeedbackData = {
        ...current,
        sessions: [newSession, ...current.sessions],
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(storageKey(groupId), updated);
      mutate(updated, false);
      return newSession;
    },
    [groupId, mutate]
  );

  // 세션 삭제
  const deleteSession = useCallback(
    (sessionId: string): void => {
      const current = loadFromStorage<PracticeFeedbackData>(storageKey(groupId), {} as PracticeFeedbackData);
      const updated: PracticeFeedbackData = {
        ...current,
        sessions: current.sessions.filter((s) => s.id !== sessionId),
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(storageKey(groupId), updated);
      mutate(updated, false);
    },
    [groupId, mutate]
  );

  // 피드백 응답 제출
  const submitResponse = useCallback(
    (
      sessionId: string,
      params: {
        authorName: string;
        isAnonymous: boolean;
        overallRating: number;
        categoryRatings: PracticeFeedbackRating;
        goodPoints?: string;
        improvements?: string;
      }
    ): boolean => {
      const current = loadFromStorage<PracticeFeedbackData>(storageKey(groupId), {} as PracticeFeedbackData);
      const sessionIndex = current.sessions.findIndex((s) => s.id === sessionId);
      if (sessionIndex === -1) return false;

      const newResponse: PracticeFeedbackResponse = {
        id: crypto.randomUUID(),
        sessionId,
        authorName: params.isAnonymous ? "익명" : params.authorName,
        isAnonymous: params.isAnonymous,
        overallRating: params.overallRating,
        categoryRatings: params.categoryRatings,
        goodPoints: params.goodPoints?.trim() || undefined,
        improvements: params.improvements?.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      const updatedSessions = [...current.sessions];
      updatedSessions[sessionIndex] = {
        ...updatedSessions[sessionIndex],
        responses: [...updatedSessions[sessionIndex].responses, newResponse],
      };

      const updated: PracticeFeedbackData = {
        ...current,
        sessions: updatedSessions,
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(storageKey(groupId), updated);
      mutate(updated, false);
      return true;
    },
    [groupId, mutate]
  );

  // 피드백 응답 삭제
  const deleteResponse = useCallback(
    (sessionId: string, responseId: string): void => {
      const current = loadFromStorage<PracticeFeedbackData>(storageKey(groupId), {} as PracticeFeedbackData);
      const sessionIndex = current.sessions.findIndex((s) => s.id === sessionId);
      if (sessionIndex === -1) return;

      const updatedSessions = [...current.sessions];
      updatedSessions[sessionIndex] = {
        ...updatedSessions[sessionIndex],
        responses: updatedSessions[sessionIndex].responses.filter(
          (r) => r.id !== responseId
        ),
      };

      const updated: PracticeFeedbackData = {
        ...current,
        sessions: updatedSessions,
        updatedAt: new Date().toISOString(),
      };
      saveToStorage(storageKey(groupId), updated);
      mutate(updated, false);
    },
    [groupId, mutate]
  );

  // 세션별 집계
  const getAggregate = useCallback(
    (sessionId: string): PracticeFeedbackAggregate | null => {
      const session = sessions.find((s) => s.id === sessionId);
      if (!session) return null;
      return aggregateSession(session);
    },
    [sessions]
  );

  // 전체 평균 만족도
  const overallAverageRating = (() => {
    const allResponses = sessions.flatMap((s) => s.responses);
    if (allResponses.length === 0) return 0;
    const sum = allResponses.reduce((acc, r) => acc + r.overallRating, 0);
    return Math.round((sum / allResponses.length) * 10) / 10;
  })();

  // 전체 피드백 수
  const totalResponseCount = sessions.reduce(
    (acc, s) => acc + s.responses.length,
    0
  );

  // 날짜 내림차순 정렬된 세션
  const sortedSessions = [...sessions].sort(
    (a, b) =>
      new Date(b.practiceDate).getTime() - new Date(a.practiceDate).getTime()
  );

  return {
    sessions: sortedSessions,
    loading: isLoading,
    refetch: () => mutate(),
    createSession,
    deleteSession,
    submitResponse,
    deleteResponse,
    getAggregate,
    overallAverageRating,
    totalResponseCount,
  };
}
