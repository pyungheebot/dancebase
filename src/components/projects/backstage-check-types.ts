// ============================================================
// 백스테이지 체크 공유 타입, 상수, 헬퍼 유틸
// ============================================================

import type { BackstageCategory } from "@/types";

// ── 모든 카테고리 목록 ──
export const ALL_BACKSTAGE_CATEGORIES: BackstageCategory[] = [
  "sound",
  "lighting",
  "costume",
  "props",
  "safety",
  "communication",
  "other",
];

// ── 카테고리 표시 순서 ──
export const ORDERED_CATEGORIES: BackstageCategory[] = [
  "sound",
  "lighting",
  "costume",
  "props",
  "safety",
  "communication",
  "other",
];

// ── 카테고리 한글 레이블 ──
export function categoryLabel(category: BackstageCategory): string {
  switch (category) {
    case "sound":
      return "음향";
    case "lighting":
      return "조명";
    case "costume":
      return "의상";
    case "props":
      return "소품";
    case "safety":
      return "안전";
    case "communication":
      return "통신";
    case "other":
      return "기타";
  }
}

// ── 카테고리 아이콘 색상 ──
export function categoryIconColor(category: BackstageCategory): string {
  switch (category) {
    case "sound":
      return "text-blue-500";
    case "lighting":
      return "text-yellow-500";
    case "costume":
      return "text-pink-500";
    case "props":
      return "text-orange-500";
    case "safety":
      return "text-red-500";
    case "communication":
      return "text-cyan-500";
    case "other":
      return "text-gray-400";
  }
}

// ── 우선순위 한글 레이블 ──
export function priorityLabel(priority: "high" | "medium" | "low"): string {
  switch (priority) {
    case "high":
      return "높음";
    case "medium":
      return "보통";
    case "low":
      return "낮음";
  }
}

// ── 우선순위 배지 CSS 클래스 ──
export function priorityBadgeClass(priority: "high" | "medium" | "low"): string {
  switch (priority) {
    case "high":
      return "bg-red-100 text-red-700 border-red-200 hover:bg-red-100";
    case "medium":
      return "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100";
    case "low":
      return "bg-green-100 text-green-700 border-green-200 hover:bg-green-100";
  }
}

// ── 진행률 배지 CSS 클래스 ──
export function progressBadgeClass(pct: number): string {
  if (pct >= 100)
    return "bg-green-100 text-green-700 border-green-200 hover:bg-green-100";
  if (pct >= 50)
    return "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100";
  return "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100";
}
