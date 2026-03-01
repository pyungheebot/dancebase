import type {
  PerformanceFeeRole,
  PerformanceFeeAdjustmentType,
} from "@/types";

// ============================================================
// 레이블 & 색상 상수
// ============================================================

export const ROLE_LABELS: Record<PerformanceFeeRole, string> = {
  main: "메인",
  sub: "서브",
  extra: "엑스트라",
  staff: "스태프",
};

export const ROLE_COLORS: Record<PerformanceFeeRole, string> = {
  main: "bg-purple-100 text-purple-700 border-purple-200",
  sub: "bg-blue-100 text-blue-700 border-blue-200",
  extra: "bg-orange-100 text-orange-700 border-orange-200",
  staff: "bg-gray-100 text-gray-600 border-gray-200",
};

export const ROLE_ORDER: PerformanceFeeRole[] = [
  "main",
  "sub",
  "extra",
  "staff",
];

export const ADJ_TYPE_LABELS: Record<PerformanceFeeAdjustmentType, string> = {
  rehearsal: "리허설 수당",
  overtime: "초과근무 수당",
  transport: "교통비 공제",
  meal: "식비 공제",
  other: "기타",
};

export const ADJ_TYPES_ALLOWANCE: PerformanceFeeAdjustmentType[] = [
  "rehearsal",
  "overtime",
  "other",
];

export const ADJ_TYPES_DEDUCTION: PerformanceFeeAdjustmentType[] = [
  "transport",
  "meal",
  "other",
];

// ============================================================
// 멤버 추가/수정 폼 타입
// ============================================================

export type EntryFormData = {
  memberName: string;
  role: PerformanceFeeRole;
  baseFee: string;
  notes: string;
};

export const EMPTY_ENTRY_FORM: EntryFormData = {
  memberName: "",
  role: "sub",
  baseFee: "",
  notes: "",
};

// ============================================================
// 수당/공제 항목 폼 타입
// ============================================================

export type AdjFormData = {
  kind: "allowance" | "deduction";
  type: PerformanceFeeAdjustmentType;
  label: string;
  amount: string;
};

export const EMPTY_ADJ_FORM: AdjFormData = {
  kind: "allowance",
  type: "rehearsal",
  label: "",
  amount: "",
};

// ============================================================
// 유틸리티
// ============================================================

export function formatKRW(amount: number): string {
  return amount.toLocaleString("ko-KR") + "원";
}
