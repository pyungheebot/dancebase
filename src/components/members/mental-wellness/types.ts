import type { MentalWellnessEntry } from "@/types";

// ============================================================
// 상수
// ============================================================

export const MOOD_CONFIG: Record<
  MentalWellnessEntry["overallMood"],
  { label: string; emoji: string; color: string; bg: string; border: string }
> = {
  great: {
    label: "아주 좋음",
    emoji: "😄",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  good: {
    label: "좋음",
    emoji: "😊",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  okay: {
    label: "보통",
    emoji: "😐",
    color: "text-yellow-700",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
  },
  low: {
    label: "낮음",
    emoji: "😔",
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
  struggling: {
    label: "힘듦",
    emoji: "😢",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
  },
};

export const MOOD_KEYS = Object.keys(
  MOOD_CONFIG
) as MentalWellnessEntry["overallMood"][];

export const SLIDER_CONFIG = [
  {
    key: "confidence" as const,
    label: "자신감",
    color: "bg-blue-500",
    trackColor: "bg-blue-100",
    textColor: "text-blue-600",
  },
  {
    key: "stress" as const,
    label: "스트레스",
    color: "bg-red-500",
    trackColor: "bg-red-100",
    textColor: "text-red-600",
  },
  {
    key: "motivation" as const,
    label: "동기",
    color: "bg-green-500",
    trackColor: "bg-green-100",
    textColor: "text-green-600",
  },
  {
    key: "anxiety" as const,
    label: "불안",
    color: "bg-purple-500",
    trackColor: "bg-purple-100",
    textColor: "text-purple-600",
  },
];

export const PRESET_STRATEGIES = [
  "심호흡",
  "명상",
  "스트레칭",
  "음악 감상",
  "친구와 대화",
  "산책",
  "수면 충분히",
  "운동",
  "독서",
  "휴식",
];

// ============================================================
// 타입
// ============================================================

export type EntryForm = {
  date: string;
  confidence: number;
  stress: number;
  motivation: number;
  anxiety: number;
  overallMood: MentalWellnessEntry["overallMood"];
  journalNote: string;
  copingStrategies: string[];
};

// ============================================================
// 날짜 유틸
// ============================================================

export function getTodayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ============================================================
// 폼 유틸
// ============================================================

export function getDefaultForm(): EntryForm {
  return {
    date: getTodayStr(),
    confidence: 5,
    stress: 5,
    motivation: 5,
    anxiety: 5,
    overallMood: "okay",
    journalNote: "",
    copingStrategies: [],
  };
}

export function entryToForm(entry: import("@/types").MentalWellnessEntry): EntryForm {
  return {
    date: entry.date,
    confidence: entry.confidence,
    stress: entry.stress,
    motivation: entry.motivation,
    anxiety: entry.anxiety,
    overallMood: entry.overallMood,
    journalNote: entry.journalNote ?? "",
    copingStrategies: entry.copingStrategies ?? [],
  };
}
