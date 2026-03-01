"use client";

// ============================================
// 회의록 유형 배지 컴포넌트
// ============================================

import { cn } from "@/lib/utils";
import type { MeetingMinutesType } from "@/types";
import { TYPE_META } from "./meeting-minutes-types";

type TypeBadgeProps = {
  type: MeetingMinutesType;
};

export function TypeBadge({ type }: TypeBadgeProps) {
  const meta = TYPE_META[type];
  return (
    <span
      className={cn(
        "text-[9px] px-1.5 py-0 rounded-full font-medium shrink-0",
        meta.bgColor,
        meta.color
      )}
      aria-label={`회의 유형: ${meta.label}`}
    >
      {meta.label}
    </span>
  );
}
