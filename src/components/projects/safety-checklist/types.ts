import type {
  SafetyChecklistCategory,
  SafetyChecklistStatus,
  SafetyChecklistPriority,
} from "@/types";

// ============================================================
// 레이블 & 색상 상수
// ============================================================

export const CATEGORY_LABELS: Record<SafetyChecklistCategory, string> = {
  stage: "무대안전",
  electric: "전기",
  fire: "소방",
  emergency: "응급",
  audience: "관객안전",
  etc: "기타",
};

export const CATEGORY_COLORS: Record<SafetyChecklistCategory, string> = {
  stage: "bg-purple-100 text-purple-700 border-purple-200",
  electric: "bg-yellow-100 text-yellow-700 border-yellow-200",
  fire: "bg-red-100 text-red-700 border-red-200",
  emergency: "bg-orange-100 text-orange-700 border-orange-200",
  audience: "bg-blue-100 text-blue-700 border-blue-200",
  etc: "bg-gray-100 text-gray-700 border-gray-200",
};

export const STATUS_LABELS: Record<SafetyChecklistStatus, string> = {
  pending: "미확인",
  checked: "확인완료",
  issue: "문제발견",
};

export const STATUS_COLORS: Record<SafetyChecklistStatus, string> = {
  pending: "bg-gray-100 text-gray-600 border-gray-200",
  checked: "bg-green-100 text-green-700 border-green-200",
  issue: "bg-red-100 text-red-700 border-red-200",
};

export const PRIORITY_LABELS: Record<SafetyChecklistPriority, string> = {
  high: "높음",
  medium: "보통",
  low: "낮음",
};

export const PRIORITY_COLORS: Record<SafetyChecklistPriority, string> = {
  high: "bg-red-50 text-red-600 border-red-200",
  medium: "bg-yellow-50 text-yellow-600 border-yellow-200",
  low: "bg-green-50 text-green-600 border-green-200",
};

export const CATEGORIES: SafetyChecklistCategory[] = [
  "stage",
  "electric",
  "fire",
  "emergency",
  "audience",
  "etc",
];

export const PRIORITIES: SafetyChecklistPriority[] = ["high", "medium", "low"];

// ============================================================
// 기본 템플릿 항목
// ============================================================

export const DEFAULT_TEMPLATES: Array<{
  category: SafetyChecklistCategory;
  content: string;
  priority: SafetyChecklistPriority;
}> = [
  { category: "stage", content: "무대 바닥 고정 상태 확인", priority: "high" },
  { category: "stage", content: "조명 장비 결박 상태 확인", priority: "high" },
  { category: "stage", content: "무대 진입/퇴장 통로 확보", priority: "medium" },
  { category: "electric", content: "전기 배선 절연 상태 확인", priority: "high" },
  { category: "electric", content: "차단기 용량 적합 여부 확인", priority: "high" },
  { category: "electric", content: "접지 연결 상태 확인", priority: "medium" },
  { category: "fire", content: "소화기 위치 및 상태 확인", priority: "high" },
  { category: "fire", content: "비상구 표시등 점등 확인", priority: "high" },
  { category: "fire", content: "스프링클러 작동 여부 확인", priority: "medium" },
  { category: "emergency", content: "구급함 위치 및 내용물 확인", priority: "high" },
  { category: "emergency", content: "비상연락망 게시 및 공유", priority: "high" },
  { category: "emergency", content: "응급처치 가능 인원 배치", priority: "medium" },
  { category: "audience", content: "객석 통로 장애물 제거", priority: "high" },
  { category: "audience", content: "비상구 안내 방송 준비", priority: "medium" },
  { category: "audience", content: "관객 정원 초과 여부 확인", priority: "high" },
];

// ============================================================
// 공유 폼 파라미터 타입
// ============================================================

export interface ItemFormParams {
  category: SafetyChecklistCategory;
  content: string;
  assignee?: string;
  priority: SafetyChecklistPriority;
  notes?: string;
}
