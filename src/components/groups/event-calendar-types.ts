import type { GroupEventRsvpStatus } from "@/types";
import { CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import React from "react";

// ============================================================
// 상수
// ============================================================

export const WEEK_DAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

export const RSVP_OPTIONS: {
  status: GroupEventRsvpStatus;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    status: "참석",
    label: "참석",
    icon: React.createElement(CheckCircle2, { className: "h-3 w-3" }),
  },
  {
    status: "미참석",
    label: "미참석",
    icon: React.createElement(XCircle, { className: "h-3 w-3" }),
  },
  {
    status: "미정",
    label: "미정",
    icon: React.createElement(HelpCircle, { className: "h-3 w-3" }),
  },
];

// ============================================================
// 날짜 헬퍼
// ============================================================

export function toYMD(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}
