"use client";

import useSWR from "swr";
import { useCallback } from "react";
import { swrKeys } from "@/lib/swr/keys";
import type {
  AudienceFeedbackData,
  AudienceFeedbackQuestion,
  AudienceFeedbackResponse,
  AudienceFeedbackSurveyItem,
} from "@/types";

// ——————————————————————————————
// localStorage 헬퍼
// ——————————————————————————————

function loadData(projectId: string): AudienceFeedbackData {
  if (typeof window === "undefined") {
    return { projectId, surveys: [], updatedAt: new Date().toISOString() };
  }
  try {
    const raw = localStorage.getItem(`audience-feedback-${projectId}`);
    if (!raw) {
      return { projectId, surveys: [], updatedAt: new Date().toISOString() };
    }
    return JSON.parse(raw) as AudienceFeedbackData;
  } catch {
    return { projectId, surveys: [], updatedAt: new Date().toISOString() };
  }
}

function persistData(data: AudienceFeedbackData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `audience-feedback-${data.projectId}`,
      JSON.stringify({ ...data, updatedAt: new Date().toISOString() })
    );
  } catch {
    // localStorage 접근 실패 시 무시
  }
}

// ——————————————————————————————
// 파라미터 타입
// ——————————————————————————————

export type CreateSurveyParams = {
  title: string;
  questions: Omit<AudienceFeedbackQuestion, "id">[];
};

export type AddQuestionParams = Omit<AudienceFeedbackQuestion, "id">;

export type UpdateQuestionParams = Partial<
  Omit<AudienceFeedbackQuestion, "id">
>;

export type SubmitResponseParams = {
  respondentName: string | null;
  answers: Record<string, string | number>;
};

// ——————————————————————————————
// 설문 결과 분석 타입
// ——————————————————————————————

export type RatingQuestionResult = {
  questionId: string;
  question: string;
  type: "rating";
  averageScore: number;
  totalAnswers: number;
  /** 별점 1~5 각 개수 */
  distribution: Record<number, number>;
};

export type TextQuestionResult = {
  questionId: string;
  question: string;
  type: "text";
  responses: string[];
};

export type ChoiceQuestionResult = {
  questionId: string;
  question: string;
  type: "choice";
  choices: string[];
  /** 보기 텍스트 -> 선택 수 */
  distribution: Record<string, number>;
};

export type QuestionResult =
  | RatingQuestionResult
  | TextQuestionResult
  | ChoiceQuestionResult;

export type SurveyResults = {
  surveyId: string;
  title: string;
  totalResponses: number;
  questionResults: QuestionResult[];
};

// ——————————————————————————————
// 훅
// ——————————————————————————————

export function useAudienceFeedback(projectId: string) {
  const { data, isLoading, mutate } = useSWR(
    swrKeys.audienceFeedback(projectId),
    () => loadData(projectId),
    { revalidateOnFocus: false }
  );

  const feedbackData: AudienceFeedbackData = data ?? {
    projectId,
    surveys: [],
    updatedAt: new Date().toISOString(),
  };

  // ——— 설문 생성 ———
  const createSurvey = useCallback(
    (params: CreateSurveyParams) => {
      const current = loadData(projectId);
      const newSurvey: AudienceFeedbackSurveyItem = {
        id: crypto.randomUUID(),
        title: params.title,
        questions: params.questions.map((q) => ({
          ...q,
          id: crypto.randomUUID(),
        })),
        responses: [],
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      const updated: AudienceFeedbackData = {
        ...current,
        surveys: [newSurvey, ...current.surveys],
        updatedAt: new Date().toISOString(),
      };
      persistData(updated);
      mutate(updated, false);
    },
    [projectId, mutate]
  );

  // ——— 설문 삭제 ———
  const deleteSurvey = useCallback(
    (surveyId: string) => {
      const current = loadData(projectId);
      const updated: AudienceFeedbackData = {
        ...current,
        surveys: current.surveys.filter((s) => s.id !== surveyId),
        updatedAt: new Date().toISOString(),
      };
      persistData(updated);
      mutate(updated, false);
    },
    [projectId, mutate]
  );

  // ——— 설문 활성/비활성 토글 ———
  const toggleSurveyActive = useCallback(
    (surveyId: string) => {
      const current = loadData(projectId);
      const updated: AudienceFeedbackData = {
        ...current,
        surveys: current.surveys.map((s) =>
          s.id !== surveyId ? s : { ...s, isActive: !s.isActive }
        ),
        updatedAt: new Date().toISOString(),
      };
      persistData(updated);
      mutate(updated, false);
    },
    [projectId, mutate]
  );

  // ——— 질문 추가 ———
  const addQuestion = useCallback(
    (surveyId: string, params: AddQuestionParams) => {
      const current = loadData(projectId);
      const newQuestion: AudienceFeedbackQuestion = {
        id: crypto.randomUUID(),
        ...params,
      };
      const updated: AudienceFeedbackData = {
        ...current,
        surveys: current.surveys.map((s) =>
          s.id !== surveyId
            ? s
            : { ...s, questions: [...s.questions, newQuestion] }
        ),
        updatedAt: new Date().toISOString(),
      };
      persistData(updated);
      mutate(updated, false);
    },
    [projectId, mutate]
  );

  // ——— 질문 수정 ———
  const updateQuestion = useCallback(
    (surveyId: string, questionId: string, params: UpdateQuestionParams) => {
      const current = loadData(projectId);
      const updated: AudienceFeedbackData = {
        ...current,
        surveys: current.surveys.map((s) =>
          s.id !== surveyId
            ? s
            : {
                ...s,
                questions: s.questions.map((q) =>
                  q.id !== questionId ? q : { ...q, ...params }
                ),
              }
        ),
        updatedAt: new Date().toISOString(),
      };
      persistData(updated);
      mutate(updated, false);
    },
    [projectId, mutate]
  );

  // ——— 질문 삭제 ———
  const removeQuestion = useCallback(
    (surveyId: string, questionId: string) => {
      const current = loadData(projectId);
      const updated: AudienceFeedbackData = {
        ...current,
        surveys: current.surveys.map((s) =>
          s.id !== surveyId
            ? s
            : {
                ...s,
                questions: s.questions.filter((q) => q.id !== questionId),
              }
        ),
        updatedAt: new Date().toISOString(),
      };
      persistData(updated);
      mutate(updated, false);
    },
    [projectId, mutate]
  );

  // ——— 응답 제출 ———
  const submitResponse = useCallback(
    (surveyId: string, params: SubmitResponseParams) => {
      const current = loadData(projectId);
      const newResponse: AudienceFeedbackResponse = {
        id: crypto.randomUUID(),
        respondentName: params.respondentName,
        answers: params.answers,
        submittedAt: new Date().toISOString(),
      };
      const updated: AudienceFeedbackData = {
        ...current,
        surveys: current.surveys.map((s) =>
          s.id !== surveyId
            ? s
            : { ...s, responses: [...s.responses, newResponse] }
        ),
        updatedAt: new Date().toISOString(),
      };
      persistData(updated);
      mutate(updated, false);
    },
    [projectId, mutate]
  );

  // ——— 설문 결과 분석 ———
  const getSurveyResults = useCallback(
    (surveyId: string): SurveyResults | null => {
      const current = loadData(projectId);
      const survey = current.surveys.find((s) => s.id === surveyId);
      if (!survey) return null;

      const questionResults: QuestionResult[] = survey.questions.map((q) => {
        if (q.type === "rating") {
          const distribution: Record<number, number> = {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
          };
          let totalScore = 0;
          let totalAnswers = 0;
          for (const response of survey.responses) {
            const answer = response.answers[q.id];
            if (answer !== undefined && answer !== "") {
              const score = Number(answer);
              if (!isNaN(score) && score >= 1 && score <= 5) {
                distribution[score] = (distribution[score] ?? 0) + 1;
                totalScore += score;
                totalAnswers++;
              }
            }
          }
          return {
            questionId: q.id,
            question: q.question,
            type: "rating",
            averageScore:
              totalAnswers === 0
                ? 0
                : Math.round((totalScore / totalAnswers) * 10) / 10,
            totalAnswers,
            distribution,
          };
        }

        if (q.type === "text") {
          const responses: string[] = [];
          for (const response of survey.responses) {
            const answer = response.answers[q.id];
            if (typeof answer === "string" && answer.trim() !== "") {
              responses.push(answer.trim());
            }
          }
          return {
            questionId: q.id,
            question: q.question,
            type: "text",
            responses,
          };
        }

        // choice
        const choices = q.choices ?? [];
        const distribution: Record<string, number> = {};
        for (const c of choices) {
          distribution[c] = 0;
        }
        for (const response of survey.responses) {
          const answer = response.answers[q.id];
          if (typeof answer === "string" && answer !== "") {
            distribution[answer] = (distribution[answer] ?? 0) + 1;
          }
        }
        return {
          questionId: q.id,
          question: q.question,
          type: "choice",
          choices,
          distribution,
        };
      });

      return {
        surveyId: survey.id,
        title: survey.title,
        totalResponses: survey.responses.length,
        questionResults,
      };
    },
    [projectId]
  );

  // ——————————————————————————————
  // 통계 계산
  // ——————————————————————————————

  const surveys = feedbackData.surveys;
  const totalSurveys = surveys.length;
  const totalResponses = surveys.reduce(
    (sum, s) => sum + s.responses.length,
    0
  );

  // 모든 설문의 rating 질문 평균 (전체 평균 별점)
  let ratingTotal = 0;
  let ratingCount = 0;
  for (const survey of surveys) {
    for (const question of survey.questions) {
      if (question.type === "rating") {
        for (const response of survey.responses) {
          const answer = response.answers[question.id];
          if (answer !== undefined && answer !== "") {
            const score = Number(answer);
            if (!isNaN(score) && score >= 1 && score <= 5) {
              ratingTotal += score;
              ratingCount++;
            }
          }
        }
      }
    }
  }
  const averageRating =
    ratingCount === 0
      ? 0
      : Math.round((ratingTotal / ratingCount) * 10) / 10;

  return {
    feedbackData,
    loading: isLoading,
    refetch: () => mutate(),
    // CRUD
    createSurvey,
    deleteSurvey,
    toggleSurveyActive,
    addQuestion,
    updateQuestion,
    removeQuestion,
    submitResponse,
    // 결과 분석
    getSurveyResults,
    // 통계
    totalSurveys,
    totalResponses,
    averageRating,
  };
}
