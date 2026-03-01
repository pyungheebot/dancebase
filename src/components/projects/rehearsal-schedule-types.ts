import type {
  RehearsalScheduleType as RehearsalType,
  RehearsalScheduleStatus as RehearsalStatus,
} from "@/types";

// ============================================================
// 상수 & 라벨
// ============================================================

export const TYPE_LABELS: Record<RehearsalType, string> = {
  full: "전체 런스루",
  partial: "부분 연습",
  tech: "기술 리허설",
  dress: "드레스 리허설",
  blocking: "블로킹",
};

export const TYPE_BADGE_CLASS: Record<RehearsalType, string> = {
  full: "bg-blue-100 text-blue-700 border-blue-200",
  partial: "bg-green-100 text-green-700 border-green-200",
  tech: "bg-orange-100 text-orange-700 border-orange-200",
  dress: "bg-purple-100 text-purple-700 border-purple-200",
  blocking: "bg-cyan-100 text-cyan-700 border-cyan-200",
};

export const TYPE_DOT_CLASS: Record<RehearsalType, string> = {
  full: "bg-blue-500",
  partial: "bg-green-500",
  tech: "bg-orange-500",
  dress: "bg-purple-500",
  blocking: "bg-cyan-500",
};

export const STATUS_LABELS: Record<RehearsalStatus, string> = {
  scheduled: "예정",
  completed: "완료",
  cancelled: "취소",
};

export const STATUS_BADGE_CLASS: Record<RehearsalStatus, string> = {
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
};

export const ALL_TYPES: RehearsalType[] = [
  "full",
  "partial",
  "tech",
  "dress",
  "blocking",
];

export const ALL_STATUSES_FILTER: (RehearsalStatus | "all")[] = [
  "all",
  "scheduled",
  "completed",
  "cancelled",
];

// ============================================================
// 유효성 검증 규칙
// ============================================================

export const VALIDATION_RULES = {
  TITLE_MIN_LENGTH: 1,
  TITLE_MAX_LENGTH: 100,
  NOTES_MAX_LENGTH: 500,
  CHECKLIST_ITEM_MAX_LENGTH: 200,
} as const;

// ============================================================
// 헬퍼 함수
// ============================================================

/**
 * 오늘로부터 해당 날짜까지 남은 일수를 계산합니다.
 * 음수이면 이미 지난 날짜입니다.
 */
export function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  return Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
}

/**
 * 체크리스트 완료 퍼센트(0~100)를 계산합니다.
 */
export function calcChecklistProgress(
  total: number,
  checked: number
): number {
  if (total === 0) return 0;
  return Math.round((checked / total) * 100);
}
