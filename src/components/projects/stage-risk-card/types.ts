import type {
  StageRiskLevel,
  StageRiskCategory,
  StageRiskResponseStatus,
} from "@/types";

// ============================================================
// 레이블 & 색상 상수
// ============================================================

export const LEVEL_LABELS: Record<StageRiskLevel, string> = {
  critical: "위험",
  high: "높음",
  medium: "보통",
  low: "낮음",
};

export const LEVEL_COLORS: Record<StageRiskLevel, string> = {
  critical: "bg-red-100 text-red-700 border-red-300",
  high: "bg-orange-100 text-orange-700 border-orange-300",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-300",
  low: "bg-green-100 text-green-700 border-green-300",
};

export const LEVEL_DOT_COLORS: Record<StageRiskLevel, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
};

export const LEVEL_MATRIX_BG: Record<StageRiskLevel, string> = {
  critical: "bg-red-200 text-red-800",
  high: "bg-orange-200 text-orange-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-green-100 text-green-800",
};

export const LEVEL_ORDER: Record<StageRiskLevel, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export const CATEGORY_LABELS: Record<StageRiskCategory, string> = {
  stage_structure: "무대 구조",
  lighting_electric: "조명/전기",
  sound: "음향",
  audience_safety: "관객 안전",
  performer_safety: "출연자 안전",
  weather: "날씨(야외)",
  other: "기타",
};

export const CATEGORY_BADGE_COLORS: Record<StageRiskCategory, string> = {
  stage_structure: "bg-stone-100 text-stone-700 border-stone-200",
  lighting_electric: "bg-yellow-50 text-yellow-700 border-yellow-200",
  sound: "bg-blue-50 text-blue-700 border-blue-200",
  audience_safety: "bg-purple-50 text-purple-700 border-purple-200",
  performer_safety: "bg-amber-50 text-amber-700 border-amber-200",
  weather: "bg-sky-50 text-sky-700 border-sky-200",
  other: "bg-gray-100 text-gray-600 border-gray-200",
};

export const RESPONSE_LABELS: Record<StageRiskResponseStatus, string> = {
  pending: "미대응",
  in_progress: "대응중",
  done: "완료",
};

export const RESPONSE_COLORS: Record<StageRiskResponseStatus, string> = {
  pending: "bg-gray-100 text-gray-600 border-gray-300",
  in_progress: "bg-blue-100 text-blue-700 border-blue-300",
  done: "bg-green-100 text-green-700 border-green-300",
};

export const ALL_LEVELS: StageRiskLevel[] = ["critical", "high", "medium", "low"];

export const ALL_CATEGORIES: StageRiskCategory[] = [
  "stage_structure",
  "lighting_electric",
  "sound",
  "audience_safety",
  "performer_safety",
  "weather",
  "other",
];

export const ALL_RESPONSE_STATUSES: StageRiskResponseStatus[] = [
  "pending",
  "in_progress",
  "done",
];

// ============================================================
// 유효성 검증 규칙
// ============================================================

export const RISK_VALIDATION = {
  TITLE_MIN_LENGTH: 1,
  MITIGATION_MIN_LENGTH: 1,
  LIKELIHOOD_MIN: 1,
  LIKELIHOOD_MAX: 5,
  IMPACT_MIN: 1,
  IMPACT_MAX: 5,
} as const;

// ============================================================
// 리스크 점수 계산 유틸
// ============================================================

export function calcRiskLevel(score: number): StageRiskLevel {
  if (score <= 4) return "low";
  if (score <= 9) return "medium";
  if (score <= 15) return "high";
  return "critical";
}

// ============================================================
// 폼 제출 파라미터 타입
// ============================================================

export interface RiskFormParams {
  title: string;
  category: StageRiskCategory;
  likelihood: number;
  impact: number;
  mitigation: string;
  responseStatus: StageRiskResponseStatus;
}
