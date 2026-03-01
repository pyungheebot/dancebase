"use client";

// ============================================================
// audience-feedback — 통계/차트 + 결과 분석 탭
//   - StarDisplay      : 별점 표시
//   - HorizontalBar    : 수평 바 차트
//   - QuestionResultView : 질문별 결과
//   - ResultsView      : 설문 전체 결과
//   - AnalyticsTab     : 결과 분석 탭 (메인 진입점)
// ============================================================

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Star, BarChart2 } from "lucide-react";
import { type QuestionResult, type SurveyResults } from "@/hooks/use-audience-feedback";
import type { AudienceFeedbackSurveyItem } from "@/types";
import { getRatingBarColor, getQuestionTypeBadgeClass } from "./audience-feedback-types";

// ============================================================
// 별점 표시
// ============================================================

export function StarDisplay({ value }: { value: number }) {
  const rounded = Math.round(value);
  return (
    <span
      className="text-yellow-400 text-xs"
      aria-label={`별점 ${value}점`}
    >
      {"★".repeat(rounded)}
      {"☆".repeat(5 - rounded)}
    </span>
  );
}

// ============================================================
// 수평 바 차트
// ============================================================

function HorizontalBar({
  label,
  count,
  total,
  color = "bg-blue-500",
}: {
  label: string;
  count: number;
  total: number;
  color?: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2" role="row">
      <span
        className="w-20 text-xs text-muted-foreground shrink-0 truncate"
        role="rowheader"
      >
        {label}
      </span>
      <div
        className="flex-1 bg-muted rounded-full h-2 overflow-hidden"
        role="meter"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} ${count}명 (${pct.toFixed(0)}%)`}
      >
        <div
          className={`h-2 rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
          aria-hidden="true"
        />
      </div>
      <span className="w-6 text-xs font-medium text-right shrink-0" role="cell">
        {count}
      </span>
    </div>
  );
}

// ============================================================
// 질문별 결과 뷰어
// ============================================================

function QuestionResultView({ result }: { result: QuestionResult }) {
  if (result.type === "rating") {
    const total = result.totalAnswers;
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <StarDisplay value={result.averageScore} />
          <span className="text-sm font-semibold">{result.averageScore.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">
            / 5 ({total}명 응답)
          </span>
        </div>
        <div
          className="space-y-1"
          role="table"
          aria-label="별점 분포"
        >
          {[5, 4, 3, 2, 1].map((star) => (
            <HorizontalBar
              key={star}
              label={`${star}점`}
              count={result.distribution[star] ?? 0}
              total={total}
              color={getRatingBarColor(star)}
            />
          ))}
        </div>
      </div>
    );
  }

  if (result.type === "text") {
    return (
      <div
        className="space-y-1"
        aria-live="polite"
        aria-label="주관식 응답 목록"
      >
        {result.responses.length === 0 ? (
          <p className="text-xs text-muted-foreground" role="status">
            응답 없음
          </p>
        ) : (
          <ul
            className="space-y-1 max-h-32 overflow-y-auto"
            aria-label={`${result.responses.length}개 응답`}
          >
            {result.responses.map((r, i) => (
              <li
                key={i}
                className="text-xs bg-muted/50 rounded px-2 py-1 leading-relaxed"
              >
                {r}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // choice
  const total = Object.values(result.distribution).reduce((a, b) => a + b, 0);
  return (
    <div
      className="space-y-1"
      role="table"
      aria-label="객관식 응답 분포"
    >
      {result.choices.length === 0 ? (
        <p className="text-xs text-muted-foreground" role="status">
          보기 없음
        </p>
      ) : (
        result.choices.map((c) => (
          <HorizontalBar
            key={c}
            label={c}
            count={result.distribution[c] ?? 0}
            total={total}
            color="bg-purple-500"
          />
        ))
      )}
    </div>
  );
}

// ============================================================
// 설문 결과 전체 뷰
// ============================================================

function ResultsView({ results }: { results: SurveyResults }) {
  return (
    <section aria-label={`${results.title} 설문 결과`} className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium truncate">{results.title}</p>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
          {results.totalResponses}명 응답
        </Badge>
      </div>
      {results.totalResponses === 0 ? (
        <p
          className="text-xs text-muted-foreground text-center py-4"
          role="status"
        >
          아직 응답이 없습니다
        </p>
      ) : (
        <div className="space-y-3" role="list" aria-label="질문별 결과">
          {results.questionResults.map((qr) => (
            <div
              key={qr.questionId}
              role="listitem"
              className="border rounded-lg p-2.5 space-y-1.5"
            >
              <p className="text-xs font-medium text-muted-foreground">
                {qr.question}
                <Badge
                  variant="outline"
                  className={`ml-1.5 text-[9px] px-1 py-0 ${getQuestionTypeBadgeClass(qr.type)}`}
                >
                  {qr.type === "rating"
                    ? "별점"
                    : qr.type === "text"
                    ? "주관식"
                    : "객관식"}
                </Badge>
              </p>
              <QuestionResultView result={qr} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ============================================================
// 통계 요약 카드
// ============================================================

function StatsSummary({
  totalSurveys,
  totalResponses,
  averageRating,
}: {
  totalSurveys: number;
  totalResponses: number;
  averageRating: number;
}) {
  return (
    <div
      className="grid grid-cols-3 gap-2"
      role="list"
      aria-label="전체 통계 요약"
    >
      <div
        className="border rounded-lg p-2 text-center"
        role="listitem"
        aria-label={`총 설문 ${totalSurveys}개`}
      >
        <p className="text-base font-bold text-primary" aria-hidden="true">
          {totalSurveys}
        </p>
        <p className="text-[10px] text-muted-foreground">총 설문</p>
      </div>
      <div
        className="border rounded-lg p-2 text-center"
        role="listitem"
        aria-label={`총 응답 ${totalResponses}명`}
      >
        <p className="text-base font-bold text-blue-600" aria-hidden="true">
          {totalResponses}
        </p>
        <p className="text-[10px] text-muted-foreground">총 응답</p>
      </div>
      <div
        className="border rounded-lg p-2 text-center"
        role="listitem"
        aria-label={`평균 별점 ${averageRating > 0 ? averageRating.toFixed(1) : "없음"}`}
      >
        <div className="flex items-center justify-center gap-0.5" aria-hidden="true">
          <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
          <p className="text-base font-bold text-yellow-600">
            {averageRating > 0 ? averageRating.toFixed(1) : "-"}
          </p>
        </div>
        <p className="text-[10px] text-muted-foreground">평균 별점</p>
      </div>
    </div>
  );
}

// ============================================================
// 결과 분석 탭 (외부 진입점)
// ============================================================

export function AnalyticsTab({
  surveys,
  getSurveyResults,
  totalSurveys,
  totalResponses,
  averageRating,
}: {
  surveys: AudienceFeedbackSurveyItem[];
  getSurveyResults: (surveyId: string) => SurveyResults | null;
  totalSurveys: number;
  totalResponses: number;
  averageRating: number;
}) {
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(
    surveys.length > 0 ? surveys[0].id : null
  );

  const results = selectedSurveyId ? getSurveyResults(selectedSurveyId) : null;

  if (surveys.length === 0) {
    return (
      <div
        className="text-center py-8 text-muted-foreground text-xs"
        role="status"
      >
        <BarChart2
          className="h-8 w-8 mx-auto mb-2 opacity-30"
          aria-hidden="true"
        />
        <p>분석할 설문 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StatsSummary
        totalSurveys={totalSurveys}
        totalResponses={totalResponses}
        averageRating={averageRating}
      />

      {/* 설문 선택 */}
      <div
        className="flex flex-wrap gap-1.5"
        role="group"
        aria-label="분석할 설문 선택"
      >
        {surveys.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={selectedSurveyId === s.id}
            aria-label={`${s.title} 설문 결과 보기`}
            className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors truncate max-w-[140px] ${
              selectedSurveyId === s.id
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:bg-muted"
            }`}
            onClick={() => setSelectedSurveyId(s.id)}
          >
            {s.title}
          </button>
        ))}
      </div>

      {/* 선택된 설문 결과 */}
      <div aria-live="polite">
        {results ? (
          <ResultsView results={results} />
        ) : (
          <p
            className="text-xs text-muted-foreground text-center py-4"
            role="status"
          >
            설문을 선택하면 결과를 확인할 수 있습니다
          </p>
        )}
      </div>
    </div>
  );
}
