"use client";

import { calcDaysLeft } from "@/hooks/use-time-capsule";

// ============================================
// 날짜 포맷 헬퍼
// ============================================

export function dateToYMD(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// ============================================
// D-Day 배지
// ============================================

export function DDayBadge({ openDate }: { openDate: string }) {
  const days = calcDaysLeft(openDate);
  const label =
    days > 0 ? `D-${days}` : days === 0 ? "D-Day" : `D+${Math.abs(days)}`;
  const color =
    days > 0
      ? "bg-blue-100 text-blue-700"
      : days === 0
        ? "bg-amber-100 text-amber-700"
        : "bg-green-100 text-green-700";
  return (
    <span
      className={`text-[10px] font-mono font-semibold px-1.5 py-0 rounded shrink-0 ${color}`}
    >
      {label}
    </span>
  );
}
