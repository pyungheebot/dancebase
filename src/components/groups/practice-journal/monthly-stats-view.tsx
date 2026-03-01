"use client";

import { BarChart2 } from "lucide-react";
import type { GroupPracticeJournalMonthStat } from "@/types";
import { formatDuration, formatYearMonth } from "./types";

// ============================================
// 월간 통계 뷰
// ============================================

type MonthlyStatsViewProps = {
  monthStats: GroupPracticeJournalMonthStat[];
};

export function MonthlyStatsView({ monthStats }: MonthlyStatsViewProps) {
  if (monthStats.length === 0) return null;

  return (
    <div
      className="bg-muted/20 rounded-md px-2.5 py-2 space-y-1.5"
      role="region"
      aria-label="월간 연습 통계"
    >
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
        <BarChart2 className="h-3 w-3" aria-hidden="true" />
        월간 통계
      </p>
      <dl className="space-y-1">
        {monthStats.slice(0, 4).map((stat) => (
          <div
            key={stat.yearMonth}
            className="flex items-center justify-between text-[10px]"
          >
            <dt className="text-muted-foreground">
              {formatYearMonth(stat.yearMonth)}
            </dt>
            <dd className="flex items-center gap-2 text-foreground/70">
              <span>{stat.entryCount}회</span>
              <span className="text-orange-600 font-medium">
                {formatDuration(stat.totalMinutes)}
              </span>
              <span className="text-cyan-600">
                평균 {stat.avgParticipants.toFixed(1)}명
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
