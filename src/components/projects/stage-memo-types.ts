// ============================================================
// 무대 메모 카드 — 상수, 레이블, 유효성 검증 규칙
// ============================================================

import type { StageMemoZone, StageMemoPriority } from "@/types";

// ============================================================
// 구역 레이블 & 그리드 배치
// ============================================================

export const ZONE_LABELS: Record<StageMemoZone, string> = {
  "upstage-left": "상수 좌",
  "upstage-center": "상수 중",
  "upstage-right": "상수 우",
  "center-left": "중앙 좌",
  center: "중앙",
  "center-right": "중앙 우",
  "downstage-left": "하수 좌",
  "downstage-center": "하수 중",
  "downstage-right": "하수 우",
};

/** 3x3 그리드 순서 (행 × 열) */
export const ZONE_GRID: StageMemoZone[][] = [
  ["upstage-left", "upstage-center", "upstage-right"],
  ["center-left", "center", "center-right"],
  ["downstage-left", "downstage-center", "downstage-right"],
];

// ============================================================
// 우선순위 레이블 & 색상
// ============================================================

export const PRIORITY_LABELS: Record<StageMemoPriority, string> = {
  high: "높음",
  medium: "보통",
  low: "낮음",
};

export const PRIORITY_COLORS: Record<StageMemoPriority, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-blue-100 text-blue-700",
};

export const PRIORITY_DOT_COLORS: Record<StageMemoPriority, string> = {
  high: "bg-red-500",
  medium: "bg-yellow-500",
  low: "bg-blue-500",
};

export const PRIORITY_NOTE_BG: Record<StageMemoPriority, string> = {
  high: "bg-red-50 border-red-200",
  medium: "bg-yellow-50 border-yellow-200",
  low: "bg-blue-50 border-blue-200",
};

// ============================================================
// 메모 필터
// ============================================================

export type NoteFilter = "all" | "unresolved" | "high";

export const FILTER_LABELS: Record<NoteFilter, string> = {
  all: "전체",
  unresolved: "미해결",
  high: "고우선",
};

// ============================================================
// 유효성 검증 규칙
// ============================================================

export const VALIDATION = {
  BOARD_TITLE_MAX: 100,
  NOTE_CONTENT_MAX: 500,
  AUTHOR_MAX: 50,
  TAGS_MAX: 10,
} as const;
