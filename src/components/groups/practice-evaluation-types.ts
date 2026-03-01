/**
 * 그룹 연습 평가표 - 공유 타입, 상수, 헬퍼 함수
 *
 * 여러 서브컴포넌트에서 공통으로 사용하는 타입과 순수 함수를 정의합니다.
 */

import type {
  PracticeEvalCriteria,
  PracticeEvalScore,
  PracticeEvalSession,
} from "@/types";

// ============================================
// 타입 재내보내기 (서브컴포넌트 단일 임포트 경로)
// ============================================

export type { PracticeEvalCriteria, PracticeEvalScore, PracticeEvalSession };

// ============================================
// 새 세션 폼 타입
// ============================================

export interface NewSessionForm {
  date: string;
  title: string;
  evaluator: string;
  notes: string;
  criteria: { name: string; maxScore: number }[];
}

export function emptyNewSessionForm(): NewSessionForm {
  return {
    date: new Date().toISOString().slice(0, 10),
    title: "",
    evaluator: "",
    notes: "",
    criteria: [{ name: "기술", maxScore: 10 }],
  };
}

// ============================================
// 멤버 추이 포인트 타입
// ============================================

export interface MemberTrendPoint {
  date: string;
  title: string;
  totalScore: number;
}

// ============================================
// 점수 비율 → 색상 헬퍼
// ============================================

export function scoreTextColor(ratio: number): string {
  if (ratio >= 0.9) return "text-emerald-600";
  if (ratio >= 0.7) return "text-blue-600";
  if (ratio >= 0.5) return "text-yellow-600";
  return "text-red-500";
}

export function scoreBarColor(ratio: number): string {
  if (ratio >= 0.9) return "bg-emerald-500";
  if (ratio >= 0.7) return "bg-blue-400";
  if (ratio >= 0.5) return "bg-yellow-400";
  return "bg-red-400";
}

// ============================================
// 기준 최대 합계 계산
// ============================================

export function calcMaxTotal(criteria: PracticeEvalCriteria[]): number {
  return criteria.reduce((sum, c) => sum + c.maxScore, 0);
}

// ============================================
// 순위 색상 상수
// ============================================

export const RANK_COLORS = [
  "text-yellow-500",  // 1위
  "text-gray-400",    // 2위
  "text-orange-400",  // 3위
] as const;

export const MEDAL_COLORS = RANK_COLORS;
