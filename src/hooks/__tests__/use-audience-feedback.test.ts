import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

// ============================================================
// use-audience-feedback.ts 핵심 로직 테스트
// ============================================================

// ──────────────────────────────────────────────────────────────
// getSurveyResults 로직을 인라인으로 복제하여 테스트
// ──────────────────────────────────────────────────────────────

type AudienceFeedbackQuestion = {
  id: string;
  question: string;
  type: "rating" | "text" | "choice";
  choices: string[] | null;
};

type AudienceFeedbackResponse = {
  id: string;
  respondentName: string | null;
  answers: Record<string, string | number>;
  submittedAt: string;
};

type AudienceFeedbackSurveyItem = {
  id: string;
  title: string;
  questions: AudienceFeedbackQuestion[];
  responses: AudienceFeedbackResponse[];
  isActive: boolean;
  createdAt: string;
};

type RatingQuestionResult = {
  questionId: string;
  question: string;
  type: "rating";
  averageScore: number;
  totalAnswers: number;
  distribution: Record<number, number>;
};

type TextQuestionResult = {
  questionId: string;
  question: string;
  type: "text";
  responses: string[];
};

type ChoiceQuestionResult = {
  questionId: string;
  question: string;
  type: "choice";
  choices: string[];
  distribution: Record<string, number>;
};

type QuestionResult = RatingQuestionResult | TextQuestionResult | ChoiceQuestionResult;

function computeQuestionResults(survey: AudienceFeedbackSurveyItem): QuestionResult[] {
  return survey.questions.map((q) => {
    if (q.type === "rating") {
      const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
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
        type: "rating" as const,
        averageScore:
          totalAnswers === 0 ? 0 : Math.round((totalScore / totalAnswers) * 10) / 10,
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
        type: "text" as const,
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
      type: "choice" as const,
      choices,
      distribution,
    };
  });
}

function computeAverageRating(surveys: AudienceFeedbackSurveyItem[]): number {
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
  return ratingCount === 0 ? 0 : Math.round((ratingTotal / ratingCount) * 10) / 10;
}

// ──────────────────────────────────────────────────────────────
// 1. rating 질문 결과 계산
// ──────────────────────────────────────────────────────────────

describe("rating 질문 결과 계산", () => {
  it("응답이 없으면 averageScore는 0이다", () => {
    const survey: AudienceFeedbackSurveyItem = {
      id: "s1",
      title: "공연 피드백",
      questions: [{ id: "q1", question: "전체 만족도", type: "rating", choices: null }],
      responses: [],
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    const results = computeQuestionResults(survey);
    const ratingResult = results[0] as RatingQuestionResult;
    expect(ratingResult.averageScore).toBe(0);
  });

  it("응답이 없으면 totalAnswers는 0이다", () => {
    const survey: AudienceFeedbackSurveyItem = {
      id: "s1",
      title: "공연 피드백",
      questions: [{ id: "q1", question: "전체 만족도", type: "rating", choices: null }],
      responses: [],
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    const results = computeQuestionResults(survey);
    const ratingResult = results[0] as RatingQuestionResult;
    expect(ratingResult.totalAnswers).toBe(0);
  });

  it("점수 5짜리 응답 3개 → averageScore는 5.0이다", () => {
    const survey: AudienceFeedbackSurveyItem = {
      id: "s1",
      title: "공연 피드백",
      questions: [{ id: "q1", question: "전체 만족도", type: "rating", choices: null }],
      responses: [
        { id: "r1", respondentName: null, answers: { q1: 5 }, submittedAt: "" },
        { id: "r2", respondentName: null, answers: { q1: 5 }, submittedAt: "" },
        { id: "r3", respondentName: null, answers: { q1: 5 }, submittedAt: "" },
      ],
      isActive: true,
      createdAt: "",
    };
    const results = computeQuestionResults(survey);
    const ratingResult = results[0] as RatingQuestionResult;
    expect(ratingResult.averageScore).toBe(5);
  });

  it("점수 4, 5, 3 → averageScore는 4.0이다", () => {
    const survey: AudienceFeedbackSurveyItem = {
      id: "s1",
      title: "테스트",
      questions: [{ id: "q1", question: "만족도", type: "rating", choices: null }],
      responses: [
        { id: "r1", respondentName: null, answers: { q1: 4 }, submittedAt: "" },
        { id: "r2", respondentName: null, answers: { q1: 5 }, submittedAt: "" },
        { id: "r3", respondentName: null, answers: { q1: 3 }, submittedAt: "" },
      ],
      isActive: true,
      createdAt: "",
    };
    const results = computeQuestionResults(survey);
    const ratingResult = results[0] as RatingQuestionResult;
    expect(ratingResult.averageScore).toBe(4);
  });

  it("소수점 평균은 1자리로 반올림된다 (4, 5 → 4.5)", () => {
    const survey: AudienceFeedbackSurveyItem = {
      id: "s1",
      title: "테스트",
      questions: [{ id: "q1", question: "만족도", type: "rating", choices: null }],
      responses: [
        { id: "r1", respondentName: null, answers: { q1: 4 }, submittedAt: "" },
        { id: "r2", respondentName: null, answers: { q1: 5 }, submittedAt: "" },
      ],
      isActive: true,
      createdAt: "",
    };
    const results = computeQuestionResults(survey);
    const ratingResult = results[0] as RatingQuestionResult;
    expect(ratingResult.averageScore).toBe(4.5);
  });

  it("범위 밖(0, 6) 점수는 계산에서 제외된다", () => {
    const survey: AudienceFeedbackSurveyItem = {
      id: "s1",
      title: "테스트",
      questions: [{ id: "q1", question: "만족도", type: "rating", choices: null }],
      responses: [
        { id: "r1", respondentName: null, answers: { q1: 0 }, submittedAt: "" },
        { id: "r2", respondentName: null, answers: { q1: 6 }, submittedAt: "" },
        { id: "r3", respondentName: null, answers: { q1: 4 }, submittedAt: "" },
      ],
      isActive: true,
      createdAt: "",
    };
    const results = computeQuestionResults(survey);
    const ratingResult = results[0] as RatingQuestionResult;
    expect(ratingResult.totalAnswers).toBe(1);
    expect(ratingResult.averageScore).toBe(4);
  });

  it("distribution 초기값은 1~5가 모두 0이다", () => {
    const survey: AudienceFeedbackSurveyItem = {
      id: "s1",
      title: "테스트",
      questions: [{ id: "q1", question: "만족도", type: "rating", choices: null }],
      responses: [],
      isActive: true,
      createdAt: "",
    };
    const results = computeQuestionResults(survey);
    const ratingResult = results[0] as RatingQuestionResult;
    expect(ratingResult.distribution[1]).toBe(0);
    expect(ratingResult.distribution[5]).toBe(0);
  });

  it("점수별 distribution이 올바르게 집계된다", () => {
    const survey: AudienceFeedbackSurveyItem = {
      id: "s1",
      title: "테스트",
      questions: [{ id: "q1", question: "만족도", type: "rating", choices: null }],
      responses: [
        { id: "r1", respondentName: null, answers: { q1: 5 }, submittedAt: "" },
        { id: "r2", respondentName: null, answers: { q1: 5 }, submittedAt: "" },
        { id: "r3", respondentName: null, answers: { q1: 3 }, submittedAt: "" },
      ],
      isActive: true,
      createdAt: "",
    };
    const results = computeQuestionResults(survey);
    const ratingResult = results[0] as RatingQuestionResult;
    expect(ratingResult.distribution[5]).toBe(2);
    expect(ratingResult.distribution[3]).toBe(1);
    expect(ratingResult.distribution[4]).toBe(0);
  });

  it("빈 문자열 답변은 무시된다", () => {
    const survey: AudienceFeedbackSurveyItem = {
      id: "s1",
      title: "테스트",
      questions: [{ id: "q1", question: "만족도", type: "rating", choices: null }],
      responses: [
        { id: "r1", respondentName: null, answers: { q1: "" }, submittedAt: "" },
        { id: "r2", respondentName: null, answers: { q1: 4 }, submittedAt: "" },
      ],
      isActive: true,
      createdAt: "",
    };
    const results = computeQuestionResults(survey);
    const ratingResult = results[0] as RatingQuestionResult;
    expect(ratingResult.totalAnswers).toBe(1);
  });
});

// ──────────────────────────────────────────────────────────────
// 2. text 질문 결과 계산
// ──────────────────────────────────────────────────────────────

describe("text 질문 결과 계산", () => {
  it("응답이 없으면 responses 배열이 비어있다", () => {
    const survey: AudienceFeedbackSurveyItem = {
      id: "s1",
      title: "피드백",
      questions: [{ id: "q1", question: "한 줄 소감", type: "text", choices: null }],
      responses: [],
      isActive: true,
      createdAt: "",
    };
    const results = computeQuestionResults(survey);
    const textResult = results[0] as TextQuestionResult;
    expect(textResult.responses).toHaveLength(0);
  });

  it("일반 텍스트 답변이 responses에 포함된다", () => {
    const survey: AudienceFeedbackSurveyItem = {
      id: "s1",
      title: "피드백",
      questions: [{ id: "q1", question: "한 줄 소감", type: "text", choices: null }],
      responses: [
        { id: "r1", respondentName: null, answers: { q1: "정말 좋았어요" }, submittedAt: "" },
        { id: "r2", respondentName: null, answers: { q1: "훌륭합니다" }, submittedAt: "" },
      ],
      isActive: true,
      createdAt: "",
    };
    const results = computeQuestionResults(survey);
    const textResult = results[0] as TextQuestionResult;
    expect(textResult.responses).toHaveLength(2);
    expect(textResult.responses[0]).toBe("정말 좋았어요");
  });

  it("빈 문자열 답변은 제외된다", () => {
    const survey: AudienceFeedbackSurveyItem = {
      id: "s1",
      title: "피드백",
      questions: [{ id: "q1", question: "한 줄 소감", type: "text", choices: null }],
      responses: [
        { id: "r1", respondentName: null, answers: { q1: "" }, submittedAt: "" },
        { id: "r2", respondentName: null, answers: { q1: "좋아요" }, submittedAt: "" },
      ],
      isActive: true,
      createdAt: "",
    };
    const results = computeQuestionResults(survey);
    const textResult = results[0] as TextQuestionResult;
    expect(textResult.responses).toHaveLength(1);
    expect(textResult.responses[0]).toBe("좋아요");
  });

  it("공백만 있는 답변은 제외된다", () => {
    const survey: AudienceFeedbackSurveyItem = {
      id: "s1",
      title: "피드백",
      questions: [{ id: "q1", question: "의견", type: "text", choices: null }],
      responses: [
        { id: "r1", respondentName: null, answers: { q1: "   " }, submittedAt: "" },
        { id: "r2", respondentName: null, answers: { q1: "좋아요" }, submittedAt: "" },
      ],
      isActive: true,
      createdAt: "",
    };
    const results = computeQuestionResults(survey);
    const textResult = results[0] as TextQuestionResult;
    expect(textResult.responses).toHaveLength(1);
  });

  it("답변의 앞뒤 공백이 트리밍된다", () => {
    const survey: AudienceFeedbackSurveyItem = {
      id: "s1",
      title: "피드백",
      questions: [{ id: "q1", question: "의견", type: "text", choices: null }],
      responses: [
        { id: "r1", respondentName: null, answers: { q1: "  멋져요  " }, submittedAt: "" },
      ],
      isActive: true,
      createdAt: "",
    };
    const results = computeQuestionResults(survey);
    const textResult = results[0] as TextQuestionResult;
    expect(textResult.responses[0]).toBe("멋져요");
  });
});

// ──────────────────────────────────────────────────────────────
// 3. choice 질문 결과 계산
// ──────────────────────────────────────────────────────────────

describe("choice 질문 결과 계산", () => {
  it("choices가 null이면 빈 배열로 처리된다", () => {
    const survey: AudienceFeedbackSurveyItem = {
      id: "s1",
      title: "피드백",
      questions: [{ id: "q1", question: "최고였던 것", type: "choice", choices: null }],
      responses: [],
      isActive: true,
      createdAt: "",
    };
    const results = computeQuestionResults(survey);
    const choiceResult = results[0] as ChoiceQuestionResult;
    expect(choiceResult.choices).toEqual([]);
  });

  it("choices가 있으면 distribution 초기값이 0으로 세팅된다", () => {
    const survey: AudienceFeedbackSurveyItem = {
      id: "s1",
      title: "피드백",
      questions: [
        { id: "q1", question: "최고 순간", type: "choice", choices: ["안무", "음악", "의상"] },
      ],
      responses: [],
      isActive: true,
      createdAt: "",
    };
    const results = computeQuestionResults(survey);
    const choiceResult = results[0] as ChoiceQuestionResult;
    expect(choiceResult.distribution["안무"]).toBe(0);
    expect(choiceResult.distribution["음악"]).toBe(0);
    expect(choiceResult.distribution["의상"]).toBe(0);
  });

  it("응답 선택이 distribution에 올바르게 집계된다", () => {
    const survey: AudienceFeedbackSurveyItem = {
      id: "s1",
      title: "피드백",
      questions: [
        { id: "q1", question: "최고 순간", type: "choice", choices: ["안무", "음악", "의상"] },
      ],
      responses: [
        { id: "r1", respondentName: null, answers: { q1: "안무" }, submittedAt: "" },
        { id: "r2", respondentName: null, answers: { q1: "안무" }, submittedAt: "" },
        { id: "r3", respondentName: null, answers: { q1: "음악" }, submittedAt: "" },
      ],
      isActive: true,
      createdAt: "",
    };
    const results = computeQuestionResults(survey);
    const choiceResult = results[0] as ChoiceQuestionResult;
    expect(choiceResult.distribution["안무"]).toBe(2);
    expect(choiceResult.distribution["음악"]).toBe(1);
    expect(choiceResult.distribution["의상"]).toBe(0);
  });

  it("빈 문자열 선택 응답은 집계에서 제외된다", () => {
    const survey: AudienceFeedbackSurveyItem = {
      id: "s1",
      title: "피드백",
      questions: [
        { id: "q1", question: "최고 순간", type: "choice", choices: ["안무", "음악"] },
      ],
      responses: [
        { id: "r1", respondentName: null, answers: { q1: "" }, submittedAt: "" },
        { id: "r2", respondentName: null, answers: { q1: "안무" }, submittedAt: "" },
      ],
      isActive: true,
      createdAt: "",
    };
    const results = computeQuestionResults(survey);
    const choiceResult = results[0] as ChoiceQuestionResult;
    expect(choiceResult.distribution["안무"]).toBe(1);
  });

  it("questionId, question, type이 올바르게 반환된다", () => {
    const survey: AudienceFeedbackSurveyItem = {
      id: "s1",
      title: "피드백",
      questions: [
        { id: "qX", question: "가장 인상적인 부분", type: "choice", choices: ["A", "B"] },
      ],
      responses: [],
      isActive: true,
      createdAt: "",
    };
    const results = computeQuestionResults(survey);
    const choiceResult = results[0] as ChoiceQuestionResult;
    expect(choiceResult.questionId).toBe("qX");
    expect(choiceResult.question).toBe("가장 인상적인 부분");
    expect(choiceResult.type).toBe("choice");
  });
});

// ──────────────────────────────────────────────────────────────
// 4. 전체 평균 별점 계산 (computeAverageRating)
// ──────────────────────────────────────────────────────────────

describe("전체 평균 별점 계산", () => {
  it("설문이 없으면 0을 반환한다", () => {
    expect(computeAverageRating([])).toBe(0);
  });

  it("rating 질문이 없으면 0을 반환한다", () => {
    const surveys: AudienceFeedbackSurveyItem[] = [
      {
        id: "s1",
        title: "텍스트만",
        questions: [{ id: "q1", question: "의견", type: "text", choices: null }],
        responses: [{ id: "r1", respondentName: null, answers: { q1: "좋아요" }, submittedAt: "" }],
        isActive: true,
        createdAt: "",
      },
    ];
    expect(computeAverageRating(surveys)).toBe(0);
  });

  it("모든 응답의 rating 평균을 계산한다", () => {
    const surveys: AudienceFeedbackSurveyItem[] = [
      {
        id: "s1",
        title: "설문1",
        questions: [{ id: "q1", question: "만족도", type: "rating", choices: null }],
        responses: [
          { id: "r1", respondentName: null, answers: { q1: 4 }, submittedAt: "" },
          { id: "r2", respondentName: null, answers: { q1: 5 }, submittedAt: "" },
        ],
        isActive: true,
        createdAt: "",
      },
    ];
    expect(computeAverageRating(surveys)).toBe(4.5);
  });

  it("여러 설문의 rating을 통합하여 평균을 계산한다", () => {
    const surveys: AudienceFeedbackSurveyItem[] = [
      {
        id: "s1",
        title: "설문1",
        questions: [{ id: "q1", question: "만족도", type: "rating", choices: null }],
        responses: [
          { id: "r1", respondentName: null, answers: { q1: 5 }, submittedAt: "" },
        ],
        isActive: true,
        createdAt: "",
      },
      {
        id: "s2",
        title: "설문2",
        questions: [{ id: "q2", question: "추천도", type: "rating", choices: null }],
        responses: [
          { id: "r2", respondentName: null, answers: { q2: 3 }, submittedAt: "" },
        ],
        isActive: true,
        createdAt: "",
      },
    ];
    expect(computeAverageRating(surveys)).toBe(4);
  });

  it("범위 밖 점수는 전체 평균 계산에서 제외된다", () => {
    const surveys: AudienceFeedbackSurveyItem[] = [
      {
        id: "s1",
        title: "설문1",
        questions: [{ id: "q1", question: "만족도", type: "rating", choices: null }],
        responses: [
          { id: "r1", respondentName: null, answers: { q1: 10 }, submittedAt: "" },
          { id: "r2", respondentName: null, answers: { q1: 4 }, submittedAt: "" },
        ],
        isActive: true,
        createdAt: "",
      },
    ];
    expect(computeAverageRating(surveys)).toBe(4);
  });
});

// ──────────────────────────────────────────────────────────────
// 5. 통계 계산 (totalSurveys, totalResponses)
// ──────────────────────────────────────────────────────────────

describe("통계 계산", () => {
  it("설문이 없을 때 totalSurveys는 0이다", () => {
    const surveys: AudienceFeedbackSurveyItem[] = [];
    expect(surveys.length).toBe(0);
  });

  it("totalResponses는 모든 설문의 응답 수 합계다", () => {
    const surveys: AudienceFeedbackSurveyItem[] = [
      {
        id: "s1",
        title: "설문1",
        questions: [],
        responses: [
          { id: "r1", respondentName: null, answers: {}, submittedAt: "" },
          { id: "r2", respondentName: null, answers: {}, submittedAt: "" },
        ],
        isActive: true,
        createdAt: "",
      },
      {
        id: "s2",
        title: "설문2",
        questions: [],
        responses: [
          { id: "r3", respondentName: null, answers: {}, submittedAt: "" },
        ],
        isActive: true,
        createdAt: "",
      },
    ];
    const totalResponses = surveys.reduce((sum, s) => sum + s.responses.length, 0);
    expect(totalResponses).toBe(3);
  });

  it("모든 응답이 없으면 totalResponses는 0이다", () => {
    const surveys: AudienceFeedbackSurveyItem[] = [
      { id: "s1", title: "설문1", questions: [], responses: [], isActive: true, createdAt: "" },
      { id: "s2", title: "설문2", questions: [], responses: [], isActive: true, createdAt: "" },
    ];
    const totalResponses = surveys.reduce((sum, s) => sum + s.responses.length, 0);
    expect(totalResponses).toBe(0);
  });
});

// ──────────────────────────────────────────────────────────────
// 6. 설문 활성/비활성 토글 로직
// ──────────────────────────────────────────────────────────────

function toggleSurveyActive(
  surveys: AudienceFeedbackSurveyItem[],
  surveyId: string
): AudienceFeedbackSurveyItem[] {
  return surveys.map((s) => (s.id !== surveyId ? s : { ...s, isActive: !s.isActive }));
}

describe("설문 활성/비활성 토글", () => {
  it("isActive가 true인 설문을 토글하면 false가 된다", () => {
    const surveys: AudienceFeedbackSurveyItem[] = [
      { id: "s1", title: "설문1", questions: [], responses: [], isActive: true, createdAt: "" },
    ];
    const result = toggleSurveyActive(surveys, "s1");
    expect(result[0].isActive).toBe(false);
  });

  it("isActive가 false인 설문을 토글하면 true가 된다", () => {
    const surveys: AudienceFeedbackSurveyItem[] = [
      { id: "s1", title: "설문1", questions: [], responses: [], isActive: false, createdAt: "" },
    ];
    const result = toggleSurveyActive(surveys, "s1");
    expect(result[0].isActive).toBe(true);
  });

  it("다른 설문에는 영향을 주지 않는다", () => {
    const surveys: AudienceFeedbackSurveyItem[] = [
      { id: "s1", title: "설문1", questions: [], responses: [], isActive: true, createdAt: "" },
      { id: "s2", title: "설문2", questions: [], responses: [], isActive: true, createdAt: "" },
    ];
    const result = toggleSurveyActive(surveys, "s1");
    expect(result[1].isActive).toBe(true);
  });

  it("존재하지 않는 ID를 토글해도 목록이 그대로다", () => {
    const surveys: AudienceFeedbackSurveyItem[] = [
      { id: "s1", title: "설문1", questions: [], responses: [], isActive: true, createdAt: "" },
    ];
    const result = toggleSurveyActive(surveys, "s99");
    expect(result[0].isActive).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────
// 7. 설문 삭제 로직
// ──────────────────────────────────────────────────────────────

function deleteSurvey(
  surveys: AudienceFeedbackSurveyItem[],
  surveyId: string
): AudienceFeedbackSurveyItem[] {
  return surveys.filter((s) => s.id !== surveyId);
}

describe("설문 삭제", () => {
  it("지정한 ID의 설문이 제거된다", () => {
    const surveys: AudienceFeedbackSurveyItem[] = [
      { id: "s1", title: "설문1", questions: [], responses: [], isActive: true, createdAt: "" },
      { id: "s2", title: "설문2", questions: [], responses: [], isActive: true, createdAt: "" },
    ];
    const result = deleteSurvey(surveys, "s1");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("s2");
  });

  it("존재하지 않는 ID를 삭제해도 목록이 변경되지 않는다", () => {
    const surveys: AudienceFeedbackSurveyItem[] = [
      { id: "s1", title: "설문1", questions: [], responses: [], isActive: true, createdAt: "" },
    ];
    const result = deleteSurvey(surveys, "s99");
    expect(result).toHaveLength(1);
  });

  it("빈 목록에서 삭제해도 에러가 발생하지 않는다", () => {
    const result = deleteSurvey([], "s1");
    expect(result).toHaveLength(0);
  });
});

// ──────────────────────────────────────────────────────────────
// 8. 질문 추가/삭제 로직
// ──────────────────────────────────────────────────────────────

function addQuestion(
  surveys: AudienceFeedbackSurveyItem[],
  surveyId: string,
  question: AudienceFeedbackQuestion
): AudienceFeedbackSurveyItem[] {
  return surveys.map((s) =>
    s.id !== surveyId ? s : { ...s, questions: [...s.questions, question] }
  );
}

function removeQuestion(
  surveys: AudienceFeedbackSurveyItem[],
  surveyId: string,
  questionId: string
): AudienceFeedbackSurveyItem[] {
  return surveys.map((s) =>
    s.id !== surveyId
      ? s
      : { ...s, questions: s.questions.filter((q) => q.id !== questionId) }
  );
}

describe("질문 추가", () => {
  it("지정한 설문에 질문이 추가된다", () => {
    const surveys: AudienceFeedbackSurveyItem[] = [
      { id: "s1", title: "설문1", questions: [], responses: [], isActive: true, createdAt: "" },
    ];
    const newQ: AudienceFeedbackQuestion = { id: "q1", question: "만족도", type: "rating", choices: null };
    const result = addQuestion(surveys, "s1", newQ);
    expect(result[0].questions).toHaveLength(1);
    expect(result[0].questions[0].id).toBe("q1");
  });

  it("다른 설문에는 질문이 추가되지 않는다", () => {
    const surveys: AudienceFeedbackSurveyItem[] = [
      { id: "s1", title: "설문1", questions: [], responses: [], isActive: true, createdAt: "" },
      { id: "s2", title: "설문2", questions: [], responses: [], isActive: true, createdAt: "" },
    ];
    const newQ: AudienceFeedbackQuestion = { id: "q1", question: "만족도", type: "rating", choices: null };
    const result = addQuestion(surveys, "s1", newQ);
    expect(result[1].questions).toHaveLength(0);
  });
});

describe("질문 삭제", () => {
  it("지정한 질문이 삭제된다", () => {
    const surveys: AudienceFeedbackSurveyItem[] = [
      {
        id: "s1",
        title: "설문1",
        questions: [
          { id: "q1", question: "Q1", type: "rating", choices: null },
          { id: "q2", question: "Q2", type: "text", choices: null },
        ],
        responses: [],
        isActive: true,
        createdAt: "",
      },
    ];
    const result = removeQuestion(surveys, "s1", "q1");
    expect(result[0].questions).toHaveLength(1);
    expect(result[0].questions[0].id).toBe("q2");
  });

  it("존재하지 않는 질문 ID 삭제 시 변화 없다", () => {
    const surveys: AudienceFeedbackSurveyItem[] = [
      {
        id: "s1",
        title: "설문1",
        questions: [{ id: "q1", question: "Q1", type: "rating", choices: null }],
        responses: [],
        isActive: true,
        createdAt: "",
      },
    ];
    const result = removeQuestion(surveys, "s1", "q99");
    expect(result[0].questions).toHaveLength(1);
  });
});
