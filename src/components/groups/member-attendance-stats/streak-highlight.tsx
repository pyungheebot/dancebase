"use client";

import React, { useMemo } from "react";
import { Flame } from "lucide-react";
import type { MemberAttendStatSummary } from "@/types";

export interface StreakHighlightProps {
  summaries: MemberAttendStatSummary[];
}

export const StreakHighlight = React.memo(function StreakHighlight({
  summaries,
}: StreakHighlightProps) {
  const topStreaks = useMemo(
    () =>
      [...summaries]
        .filter((s) => s.currentStreak > 0)
        .sort((a, b) => b.currentStreak - a.currentStreak)
        .slice(0, 5),
    [summaries]
  );

  if (topStreaks.length === 0) return null;

  return (
    <section
      className="rounded-lg bg-orange-50 border border-orange-100 px-3 py-2"
      aria-label="연속 출석 스트릭"
    >
      <div className="flex items-center gap-1 mb-1.5">
        <Flame className="h-3.5 w-3.5 text-orange-500" aria-hidden="true" />
        <span className="text-[11px] font-semibold text-orange-700" id="streak-heading">
          연속 출석 스트릭
        </span>
      </div>
      <ul
        className="flex flex-wrap gap-2"
        role="list"
        aria-labelledby="streak-heading"
      >
        {topStreaks.map((s) => (
          <li
            key={s.memberName}
            className="flex items-center gap-1 bg-card rounded px-2 py-0.5 border border-orange-100"
            aria-label={`${s.memberName} ${s.currentStreak}일 연속 출석`}
          >
            <span className="text-[11px] font-medium text-gray-700">
              {s.memberName}
            </span>
            <span
              className="text-[10px] font-bold text-orange-500"
              aria-hidden="true"
            >
              {s.currentStreak}일
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
});
