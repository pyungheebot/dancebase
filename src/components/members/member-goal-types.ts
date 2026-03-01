import type {
  MemberGoalCategory,
  MemberGoalPriority,
} from "@/types";

// ============================================
// 레이블 상수
// ============================================

export const CATEGORY_LABELS: Record<MemberGoalCategory, string> = {
  technique: "테크닉",
  flexibility: "유연성",
  stamina: "체력",
  performance: "퍼포먼스",
  attendance: "출석",
  leadership: "리더십",
  other: "기타",
};

export const CATEGORY_COLORS: Record<MemberGoalCategory, string> = {
  technique: "bg-purple-100 text-purple-700 border-purple-200",
  flexibility: "bg-pink-100 text-pink-700 border-pink-200",
  stamina: "bg-orange-100 text-orange-700 border-orange-200",
  performance: "bg-cyan-100 text-cyan-700 border-cyan-200",
  attendance: "bg-blue-100 text-blue-700 border-blue-200",
  leadership: "bg-indigo-100 text-indigo-700 border-indigo-200",
  other: "bg-gray-100 text-gray-600 border-gray-200",
};

// 카테고리 차트 막대 색상 (bg-*-400 수준)
export const CATEGORY_BAR_COLORS: Record<MemberGoalCategory, string> = {
  technique: "bg-purple-400",
  flexibility: "bg-pink-400",
  stamina: "bg-orange-400",
  performance: "bg-cyan-400",
  attendance: "bg-blue-400",
  leadership: "bg-indigo-400",
  other: "bg-gray-400",
};

export const PRIORITY_LABELS: Record<MemberGoalPriority, string> = {
  high: "높음",
  medium: "보통",
  low: "낮음",
};

export const PRIORITY_COLORS: Record<MemberGoalPriority, string> = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-green-100 text-green-700 border-green-200",
};

export const ALL_CATEGORIES: MemberGoalCategory[] = [
  "technique",
  "flexibility",
  "stamina",
  "performance",
  "attendance",
  "leadership",
  "other",
];

// ============================================
// 폼 타입
// ============================================

export type AddGoalFormData = {
  memberName: string;
  category: MemberGoalCategory;
  title: string;
  description: string;
  priority: MemberGoalPriority;
  targetDate: string;
  milestones: string[];
};

export const DEFAULT_ADD_GOAL_FORM: Omit<AddGoalFormData, "memberName"> = {
  category: "technique",
  title: "",
  description: "",
  priority: "medium",
  targetDate: "",
  milestones: [],
};

// ============================================
// 유틸 함수
// ============================================

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function progressBarColor(progress: number): string {
  if (progress <= 30) return "bg-red-400";
  if (progress <= 70) return "bg-yellow-400";
  return "bg-green-500";
}

export function sortGoalStatus(status: string): number {
  const order: Record<string, number> = {
    active: 0,
    completed: 1,
    abandoned: 2,
  };
  return order[status] ?? 3;
}
