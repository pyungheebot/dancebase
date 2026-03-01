import type {
  MemberAttendStatStatus,
  MemberAttendStatPeriod,
} from "@/types";

// ─── 상수 ────────────────────────────────────────────────────

export const STATUS_LABEL: Record<MemberAttendStatStatus, string> = {
  present: "출석",
  late: "지각",
  early_leave: "조퇴",
  absent: "결석",
};

export const STATUS_BAR_COLOR: Record<MemberAttendStatStatus, string> = {
  present: "bg-green-500",
  late: "bg-yellow-400",
  early_leave: "bg-orange-400",
  absent: "bg-red-400",
};

export const STATUS_BADGE_CLASS: Record<MemberAttendStatStatus, string> = {
  present: "bg-green-100 text-green-700 hover:bg-green-100",
  late: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
  early_leave: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  absent: "bg-red-100 text-red-600 hover:bg-red-100",
};

export const PERIOD_LABEL: Record<MemberAttendStatPeriod, string> = {
  weekly: "이번 주",
  monthly: "이번 달",
  all: "전체",
};

export const ALL_STATUSES: MemberAttendStatStatus[] = [
  "present",
  "late",
  "early_leave",
  "absent",
];

export const ALL_PERIODS: MemberAttendStatPeriod[] = [
  "weekly",
  "monthly",
  "all",
];

// ─── 헬퍼 함수 ───────────────────────────────────────────────

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getRateColor(rate: number): string {
  if (rate >= 90) return "bg-green-500";
  if (rate >= 75) return "bg-green-400";
  if (rate >= 60) return "bg-yellow-400";
  if (rate >= 40) return "bg-orange-400";
  return "bg-red-400";
}

export function getRateTextColor(rate: number): string {
  if (rate >= 90) return "text-green-600";
  if (rate >= 75) return "text-green-500";
  if (rate >= 60) return "text-yellow-600";
  if (rate >= 40) return "text-orange-500";
  return "text-red-500";
}
