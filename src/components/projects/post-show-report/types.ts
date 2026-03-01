// ============================================================
// post-show-report 서브모듈 공통 타입 / 상수 / 유틸
// ============================================================

import type { PostShowReportSection } from "@/types";

// ── 섹션 레이블 ────────────────────────────────────────────────

export const SECTION_LABELS: Record<PostShowReportSection, string> = {
  choreography: "안무",
  staging: "무대연출",
  sound: "음향",
  lighting: "조명",
  costume: "의상",
  audience_reaction: "관객반응",
};

// ── 섹션 색상 ─────────────────────────────────────────────────

export const SECTION_COLORS: Record<PostShowReportSection, string> = {
  choreography: "text-pink-600",
  staging: "text-blue-600",
  sound: "text-orange-600",
  lighting: "text-yellow-600",
  costume: "text-purple-600",
  audience_reaction: "text-green-600",
};

// ── 점수 색상 헬퍼 ────────────────────────────────────────────

export function scoreColor(score: number): string {
  if (score >= 4.5) return "text-green-600";
  if (score >= 3.5) return "text-blue-600";
  if (score >= 2.5) return "text-yellow-600";
  return "text-red-600";
}

// ── 매출 포맷 헬퍼 ────────────────────────────────────────────

export function formatRevenue(amount: number): string {
  return amount.toLocaleString("ko-KR") + "원";
}

// ── 폼 데이터 타입 ────────────────────────────────────────────

import type { PostShowReportEntry, PostShowReportSectionScore } from "@/types";
import { makeDefaultSectionScores } from "@/hooks/use-post-show-report";

export type ReportFormData = {
  title: string;
  performanceDate: string;
  overallReview: string;
  sectionScores: PostShowReportSectionScore[];
  highlights: string;
  improvements: string;
  nextSuggestions: string;
  audienceCount: string;
  revenue: string;
  author: string;
  notes: string;
};

export function makeInitialForm(initial?: PostShowReportEntry): ReportFormData {
  return {
    title: initial?.title ?? "",
    performanceDate:
      initial?.performanceDate ?? new Date().toISOString().slice(0, 10),
    overallReview: initial?.overallReview ?? "",
    sectionScores: initial?.sectionScores ?? makeDefaultSectionScores(),
    highlights: initial?.highlights.join("\n") ?? "",
    improvements: initial?.improvements.join("\n") ?? "",
    nextSuggestions: initial?.nextSuggestions.join("\n") ?? "",
    audienceCount: initial?.audienceCount?.toString() ?? "",
    revenue: initial?.revenue?.toString() ?? "",
    author: initial?.author ?? "",
    notes: initial?.notes ?? "",
  };
}
