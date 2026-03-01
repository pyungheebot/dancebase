import type {
  DanceGoalCategory,
  DanceGoalPriority,
  DanceGoalStatus,
} from "@/types";

// ============================================
// 레이블 상수
// ============================================

export const CATEGORY_LABELS: Record<DanceGoalCategory, string> = {
  technique: "기술",
  flexibility: "유연성",
  strength: "체력",
  performance: "퍼포먼스",
  choreography: "안무",
  other: "기타",
};

export const CATEGORY_COLORS: Record<DanceGoalCategory, string> = {
  technique: "bg-blue-100 text-blue-700",
  flexibility: "bg-green-100 text-green-700",
  strength: "bg-orange-100 text-orange-700",
  performance: "bg-purple-100 text-purple-700",
  choreography: "bg-pink-100 text-pink-700",
  other: "bg-gray-100 text-gray-600",
};

export const PRIORITY_LABELS: Record<DanceGoalPriority, string> = {
  high: "높음",
  medium: "보통",
  low: "낮음",
};

export const PRIORITY_COLORS: Record<DanceGoalPriority, string> = {
  high: "text-red-500",
  medium: "text-yellow-500",
  low: "text-blue-400",
};

export const STATUS_LABELS: Record<DanceGoalStatus, string> = {
  active: "진행 중",
  completed: "완료",
  paused: "일시중지",
};

export const STATUS_COLORS: Record<DanceGoalStatus, string> = {
  active: "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700",
  paused: "bg-yellow-100 text-yellow-700",
};

export const PROGRESS_BAR_COLORS: Record<DanceGoalStatus, string> = {
  active: "bg-green-500",
  completed: "bg-blue-500",
  paused: "bg-yellow-400",
};

// ============================================
// 카테고리 바 색상 (통계 차트용)
// ============================================

export const CATEGORY_BAR_COLORS: Record<DanceGoalCategory, string> = {
  technique: "#3b82f6",
  flexibility: "#22c55e",
  strength: "#f97316",
  performance: "#a855f7",
  choreography: "#ec4899",
  other: "#9ca3af",
};

// ============================================
// 폼 타입
// ============================================

export type GoalFormData = {
  title: string;
  description: string;
  category: DanceGoalCategory;
  priority: DanceGoalPriority;
  targetDate: string;
};

export const DEFAULT_FORM: GoalFormData = {
  title: "",
  description: "",
  category: "technique",
  priority: "medium",
  targetDate: "",
};

// ============================================
// 필터 타입
// ============================================

export type FilterCategory = DanceGoalCategory | "all";
export type FilterStatus = DanceGoalStatus | "all";

// ============================================
// 유틸 함수
// ============================================

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isOverdue(
  targetDate: string | null,
  status: DanceGoalStatus
): boolean {
  if (!targetDate || status !== "active") return false;
  return targetDate < todayStr();
}
