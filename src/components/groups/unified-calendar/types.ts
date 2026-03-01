import type { UnifiedEventType } from "@/types";

// ============================================================
// 상수
// ============================================================

export const ALL_TYPES: UnifiedEventType[] = [
  "practice",
  "performance",
  "meeting",
  "social",
  "competition",
  "workshop",
  "other",
];

export const DAYS_OF_WEEK = ["일", "월", "화", "수", "목", "금", "토"];

// ============================================================
// 폼 기본값
// ============================================================

export const DEFAULT_FORM = {
  title: "",
  type: "practice" as UnifiedEventType,
  date: "",
  startTime: "10:00",
  endTime: "12:00",
  location: "",
  description: "",
  participants: [] as string[],
  isAllDay: false,
  reminder: false,
  createdBy: "",
};

// ============================================================
// 유틸리티
// ============================================================

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}
