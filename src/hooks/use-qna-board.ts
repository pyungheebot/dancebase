"use client";

import { useState, useEffect, useCallback } from "react";
import { swrKeys } from "@/lib/swr/keys";
import type { QnaQuestion, QnaAnswer, QnaStatus } from "@/types";

// ============================================
// localStorage 헬퍼
// ============================================

function storageKey(groupId: string): string {
  return `dancebase:qna:${groupId}`;
}

function loadQuestions(groupId: string): QnaQuestion[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(groupId));
    if (!raw) return [];
    return JSON.parse(raw) as QnaQuestion[];
  } catch {
    return [];
  }
}

function saveQuestions(groupId: string, questions: QnaQuestion[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(groupId), JSON.stringify(questions));
  } catch {
    // 무시
  }
}

// ============================================
// 카테고리 / 상태 상수
// ============================================

export const QNA_CATEGORIES = ["안무", "연습", "운영", "기타"] as const;
export type QnaCategory = (typeof QNA_CATEGORIES)[number] | "전체";

export const QNA_STATUS_FILTERS = ["전체", "open", "answered", "resolved"] as const;
export type QnaStatusFilter = (typeof QNA_STATUS_FILTERS)[number];

export const QNA_STATUS_LABEL: Record<QnaStatus, string> = {
  open: "미답변",
  answered: "답변됨",
  resolved: "해결됨",
};

// ============================================
// Q&A 보드 통계 타입
// ============================================

export type QnaStats = {
  total: number;
  openCount: number;
  answeredCount: number;
  resolvedCount: number;
};

// ============================================
// Q&A 보드 훅
// ============================================

export function useQnaBoard(groupId: string) {
  const [questions, setQuestions] = useState<QnaQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<QnaCategory>("전체");
  const [statusFilter, setStatusFilter] = useState<QnaStatusFilter>("전체");
  const [searchQuery, setSearchQuery] = useState("");

  // SWR 키 (localStorage 기반 갱신 트리거용)
  const _swrKey = swrKeys.qnaBoard(groupId);
  void _swrKey;

  // localStorage에서 질문 불러오기
  const reload = useCallback(() => {
    if (!groupId) return;
    const data = loadQuestions(groupId);
    setQuestions(data);
    setLoading(false);
  }, [groupId]);

  useEffect(() => {
    reload();
  }, [reload]);

  // 질문 추가
  const addQuestion = useCallback(
    (params: {
      title: string;
      content: string;
      authorName: string;
      category: string;
    }): QnaQuestion => {
      const newQuestion: QnaQuestion = {
        id: crypto.randomUUID(),
        title: params.title,
        content: params.content,
        authorName: params.authorName,
        category: params.category,
        status: "open",
        answers: [],
        createdAt: new Date().toISOString(),
      };
      const updated = [newQuestion, ...questions];
      saveQuestions(groupId, updated);
      setQuestions(updated);
      return newQuestion;
    },
    [groupId, questions]
  );

  // 질문 삭제
  const deleteQuestion = useCallback(
    (questionId: string): void => {
      const updated = questions.filter((q) => q.id !== questionId);
      saveQuestions(groupId, updated);
      setQuestions(updated);
    },
    [groupId, questions]
  );

  // 답변 추가
  const addAnswer = useCallback(
    (
      questionId: string,
      params: { content: string; authorName: string }
    ): void => {
      const newAnswer: QnaAnswer = {
        id: crypto.randomUUID(),
        content: params.content,
        authorName: params.authorName,
        isAccepted: false,
        createdAt: new Date().toISOString(),
      };
      const updated = questions.map((q) => {
        if (q.id !== questionId) return q;
        const newAnswers = [...q.answers, newAnswer];
        // 최초 답변 시 status를 "answered"로 변경
        const newStatus: QnaStatus =
          q.status === "open" ? "answered" : q.status;
        return { ...q, answers: newAnswers, status: newStatus };
      });
      saveQuestions(groupId, updated);
      setQuestions(updated);
    },
    [groupId, questions]
  );

  // 답변 채택 (isAccepted 토글 + 질문 상태를 resolved로 변경)
  const acceptAnswer = useCallback(
    (questionId: string, answerId: string): void => {
      const updated = questions.map((q) => {
        if (q.id !== questionId) return q;
        const newAnswers = q.answers.map((a) => ({
          ...a,
          isAccepted: a.id === answerId ? !a.isAccepted : false,
        }));
        const hasAccepted = newAnswers.some((a) => a.isAccepted);
        const newStatus: QnaStatus = hasAccepted
          ? "resolved"
          : q.answers.length > 0
          ? "answered"
          : "open";
        return { ...q, answers: newAnswers, status: newStatus };
      });
      saveQuestions(groupId, updated);
      setQuestions(updated);
    },
    [groupId, questions]
  );

  // 질문 상태 변경
  const changeStatus = useCallback(
    (questionId: string, status: QnaStatus): void => {
      const updated = questions.map((q) =>
        q.id === questionId ? { ...q, status } : q
      );
      saveQuestions(groupId, updated);
      setQuestions(updated);
    },
    [groupId, questions]
  );

  // 필터링된 질문 목록
  const filteredQuestions = questions.filter((q) => {
    const matchCategory =
      categoryFilter === "전체" || q.category === categoryFilter;
    const matchStatus =
      statusFilter === "전체" || q.status === statusFilter;
    const matchSearch =
      searchQuery.trim() === "" ||
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.authorName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchStatus && matchSearch;
  });

  // 통계
  const stats: QnaStats = {
    total: questions.length,
    openCount: questions.filter((q) => q.status === "open").length,
    answeredCount: questions.filter((q) => q.status === "answered").length,
    resolvedCount: questions.filter((q) => q.status === "resolved").length,
  };

  return {
    questions,
    filteredQuestions,
    loading,
    stats,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    addQuestion,
    deleteQuestion,
    addAnswer,
    acceptAnswer,
    changeStatus,
    refetch: reload,
  };
}
