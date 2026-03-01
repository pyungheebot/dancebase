// ============================================
// 성장 일지 공유 타입 및 상수
// ============================================

import type { GrowthJournalMood } from "@/types";

// 무드 이모지 매핑
export const MOOD_EMOJI: Record<GrowthJournalMood, string> = {
  motivated: "🔥",
  confident: "💪",
  neutral: "😐",
  struggling: "😓",
  discouraged: "😞",
};

// 무드 한글 레이블
export const MOOD_LABEL: Record<GrowthJournalMood, string> = {
  motivated: "의욕충만",
  confident: "자신감",
  neutral: "평범",
  struggling: "힘듦",
  discouraged: "기운없음",
};

// 무드 표시 순서
export const MOOD_ORDER: GrowthJournalMood[] = [
  "motivated",
  "confident",
  "neutral",
  "struggling",
  "discouraged",
];

// ============================================
// 폼 타입 정의
// ============================================

export type FormValues = {
  memberName: string;
  date: string;
  title: string;
  content: string;
  mood: GrowthJournalMood;
  skillsPracticed: string;
  achievementsToday: string;
  challengesFaced: string;
  nextGoals: string;
  selfRating: number;
};

// ============================================
// 날짜 / 리스트 유틸리티
// ============================================

/** 오늘 날짜를 YYYY-MM-DD 형식으로 반환 */
export function getTodayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** 쉼표로 구분된 문자열을 배열로 변환 */
export function parseList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 배열을 쉼표로 구분된 문자열로 변환 */
export function joinList(arr: string[]): string {
  return arr.join(", ");
}
