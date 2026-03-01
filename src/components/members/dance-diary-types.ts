// ─── 댄스 일기 공유 타입, 상수, 유틸 ────────────────────────────────────────
// 서브컴포넌트에서 공통으로 사용하는 값들을 한 곳에 모아 관리

import type { DiaryCardEmotion, DiaryCardEmotionMeta } from "@/types";

// 감정 목록 상수
export const EMOTION_LIST: DiaryCardEmotionMeta[] = [
  { value: "happy", label: "행복", emoji: "😊", color: "bg-green-400" },
  { value: "neutral", label: "보통", emoji: "😐", color: "bg-yellow-400" },
  { value: "sad", label: "슬픔", emoji: "😢", color: "bg-blue-400" },
  { value: "passionate", label: "열정", emoji: "🔥", color: "bg-orange-400" },
  { value: "frustrated", label: "답답", emoji: "😤", color: "bg-red-400" },
];

// 빠른 조회를 위한 감정 맵 (value → meta)
export const EMOTION_MAP = Object.fromEntries(
  EMOTION_LIST.map((e) => [e.value, e])
) as Record<DiaryCardEmotion, DiaryCardEmotionMeta>;

// 컨디션 레이블 (인덱스 1~5)
export const CONDITION_LABELS = ["", "매우나쁨", "나쁨", "보통", "좋음", "최상"];

// 컨디션 색상 클래스 (인덱스 1~5)
export const CONDITION_COLORS = [
  "",
  "bg-red-400",
  "bg-orange-400",
  "bg-yellow-400",
  "bg-green-400",
  "bg-emerald-500",
];

// ─── 폼 타입 & 초기값 ─────────────────────────────────────────────────────────

export type DiaryForm = {
  date: string;
  title: string;
  content: string;
  emotion: DiaryCardEmotion;
  condition: number;
  discovery: string;
  tags: string[];
};

/** 기본 폼 초기값 생성 */
export function getDefaultForm(date: string): DiaryForm {
  return {
    date,
    title: "",
    content: "",
    emotion: "happy",
    condition: 3,
    discovery: "",
    tags: [],
  };
}

// ─── 날짜 유틸 ────────────────────────────────────────────────────────────────

/** 오늘 날짜를 YYYY-MM-DD 형식으로 반환 */
export function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** 해당 연월의 일 수 반환 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** 해당 연월 1일의 요일(0=일요일) 반환 */
export function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}
