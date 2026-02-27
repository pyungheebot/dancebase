"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr/keys";
import type { MemberQuizData, QuizQuestion, QuizAttempt } from "@/types";

// ============================================
// localStorage 키
// ============================================

const LS_KEY = (groupId: string) => `dancebase:member-quiz:${groupId}`;

// ============================================
// localStorage 헬퍼
// ============================================

function loadData(groupId: string): MemberQuizData {
  if (typeof window === "undefined") {
    return { questions: [], attempts: [], createdAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(LS_KEY(groupId));
    if (!raw) {
      return { questions: [], attempts: [], createdAt: new Date().toISOString() };
    }
    return JSON.parse(raw) as MemberQuizData;
  } catch {
    return { questions: [], attempts: [], createdAt: new Date().toISOString() };
  }
}

function saveData(groupId: string, data: MemberQuizData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY(groupId), JSON.stringify(data));
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

// ============================================
// 훅
// ============================================

export function useMemberQuiz(groupId: string) {
  const { data, mutate } = useSWR(
    groupId ? swrKeys.memberQuiz(groupId) : null,
    () => loadData(groupId),
    { revalidateOnFocus: false }
  );

  const quizData: MemberQuizData = data ?? {
    questions: [],
    attempts: [],
    createdAt: new Date().toISOString(),
  };

  // ── 문제 추가 ────────────────────────────────────────────

  function addQuestion(
    params: Omit<QuizQuestion, "id">
  ): void {
    const newQuestion: QuizQuestion = {
      ...params,
      id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    };
    const next: MemberQuizData = {
      ...quizData,
      questions: [...quizData.questions, newQuestion],
    };
    saveData(groupId, next);
    mutate(next, false);
  }

  // ── 문제 삭제 ────────────────────────────────────────────

  function deleteQuestion(questionId: string): void {
    const next: MemberQuizData = {
      ...quizData,
      questions: quizData.questions.filter((q) => q.id !== questionId),
    };
    saveData(groupId, next);
    mutate(next, false);
  }

  // ── 퀴즈 시도 제출 ───────────────────────────────────────

  function submitAttempt(
    playerName: string,
    answers: { questionId: string; selectedIndex: number }[]
  ): QuizAttempt {
    const questionMap = new Map(quizData.questions.map((q) => [q.id, q]));

    const gradedAnswers = answers.map((a) => {
      const q = questionMap.get(a.questionId);
      return {
        questionId: a.questionId,
        selectedIndex: a.selectedIndex,
        isCorrect: q ? q.correctIndex === a.selectedIndex : false,
      };
    });

    const correctCount = gradedAnswers.filter((a) => a.isCorrect).length;

    const attempt: QuizAttempt = {
      id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      playerName,
      answers: gradedAnswers,
      score: correctCount,
      totalQuestions: answers.length,
      completedAt: new Date().toISOString(),
    };

    const next: MemberQuizData = {
      ...quizData,
      attempts: [...quizData.attempts, attempt],
    };
    saveData(groupId, next);
    mutate(next, false);

    return attempt;
  }

  // ── 리더보드 (점수 높은 순) ──────────────────────────────

  function getLeaderboard(): {
    playerName: string;
    bestScore: number;
    totalAttempts: number;
    bestAccuracy: number;
  }[] {
    const map = new Map<
      string,
      { bestScore: number; totalAttempts: number; bestAccuracy: number }
    >();

    for (const attempt of quizData.attempts) {
      const existing = map.get(attempt.playerName);
      const accuracy =
        attempt.totalQuestions > 0
          ? Math.round((attempt.score / attempt.totalQuestions) * 100)
          : 0;

      if (!existing) {
        map.set(attempt.playerName, {
          bestScore: attempt.score,
          totalAttempts: 1,
          bestAccuracy: accuracy,
        });
      } else {
        map.set(attempt.playerName, {
          bestScore: Math.max(existing.bestScore, attempt.score),
          totalAttempts: existing.totalAttempts + 1,
          bestAccuracy: Math.max(existing.bestAccuracy, accuracy),
        });
      }
    }

    return Array.from(map.entries())
      .map(([playerName, stats]) => ({ playerName, ...stats }))
      .sort((a, b) => {
        if (b.bestScore !== a.bestScore) return b.bestScore - a.bestScore;
        return b.bestAccuracy - a.bestAccuracy;
      });
  }

  // ── 특정 멤버 관련 문제 목록 ─────────────────────────────

  function getQuestionsAbout(memberName: string): QuizQuestion[] {
    return quizData.questions.filter((q) => q.aboutMember === memberName);
  }

  // ── 통계 ────────────────────────────────────────────────

  const totalQuestions = quizData.questions.length;
  const totalAttempts = quizData.attempts.length;

  const avgScore =
    totalAttempts > 0
      ? Math.round(
          quizData.attempts.reduce((acc, a) => acc + a.score, 0) / totalAttempts
        )
      : 0;

  const leaderboard = getLeaderboard();
  const topScorer = leaderboard.length > 0 ? leaderboard[0].playerName : null;

  return {
    // 데이터
    questions: quizData.questions,
    attempts: quizData.attempts,
    // 액션
    addQuestion,
    deleteQuestion,
    submitAttempt,
    getLeaderboard,
    getQuestionsAbout,
    // 통계
    totalQuestions,
    totalAttempts,
    avgScore,
    topScorer,
    // SWR
    loading: data === undefined,
    refetch: () => mutate(),
  };
}
