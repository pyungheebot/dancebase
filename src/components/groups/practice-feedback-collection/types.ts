import type { PracticeFeedbackRating } from "@/types";

// ============================================
// 날짜 헬퍼
// ============================================

export function dateToYMD(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// ============================================
// 카테고리 메타 상수
// ============================================

export const CATEGORY_META: Record<
  keyof PracticeFeedbackRating,
  { label: string; color: string }
> = {
  choreography: { label: "안무", color: "bg-purple-400" },
  music: { label: "음악", color: "bg-blue-400" },
  environment: { label: "환경", color: "bg-green-400" },
  atmosphere: { label: "분위기", color: "bg-pink-400" },
};

export const CATEGORY_KEYS: (keyof PracticeFeedbackRating)[] = [
  "choreography",
  "music",
  "environment",
  "atmosphere",
];

// ============================================
// 기본 평가 값
// ============================================

export const DEFAULT_RATING: PracticeFeedbackRating = {
  choreography: 3,
  music: 3,
  environment: 3,
  atmosphere: 3,
};
