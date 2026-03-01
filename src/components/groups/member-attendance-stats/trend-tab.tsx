"use client";

import { TrendingUp } from "lucide-react";
import { MonthlyBarChart } from "./monthly-bar-chart";

const RATE_LEGEND = [
  { label: "90% 이상", cls: "bg-green-500" },
  { label: "75~89%", cls: "bg-green-400" },
  { label: "60~74%", cls: "bg-yellow-400" },
  { label: "40~59%", cls: "bg-orange-400" },
  { label: "40% 미만", cls: "bg-red-400" },
] as const;

export interface TrendTabProps {
  hasRecords: boolean;
  monthlyTrend: Array<{ label: string; rate: number }>;
}

export function TrendTab({ hasRecords, monthlyTrend }: TrendTabProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <TrendingUp className="h-3 w-3 text-gray-400" aria-hidden="true" />
        <span className="text-[11px] font-semibold text-gray-600">
          최근 6개월 출석률
        </span>
      </div>
      {!hasRecords ? (
        <div
          className="flex flex-col items-center justify-center py-8 text-gray-400"
          role="status"
          aria-live="polite"
        >
          <TrendingUp className="h-8 w-8 mb-2 opacity-30" aria-hidden="true" />
          <p className="text-xs">출석 기록을 추가해보세요.</p>
        </div>
      ) : (
        <>
          <MonthlyBarChart data={monthlyTrend} />
          {/* 출석률 범례 */}
          <div
            className="flex gap-3 flex-wrap pt-1"
            aria-label="출석률 색상 범례"
            role="list"
          >
            {RATE_LEGEND.map(({ label, cls }) => (
              <span
                key={label}
                className="flex items-center gap-1 text-[9px] text-gray-500"
                role="listitem"
              >
                <span
                  className={`inline-block h-2 w-2 rounded-sm ${cls}`}
                  aria-hidden="true"
                />
                {label}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
