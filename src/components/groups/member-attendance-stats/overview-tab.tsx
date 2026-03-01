"use client";

import { useMemo } from "react";
import { BarChart3 } from "lucide-react";
import type {
  MemberAttendStatRecord,
  MemberAttendStatSummary,
  MemberAttendStatPeriod,
} from "@/types";
import {
  ALL_STATUSES,
  STATUS_LABEL,
  STATUS_BAR_COLOR,
} from "./types";
import { StreakHighlight } from "./streak-highlight";

export interface OverviewTabProps {
  records: MemberAttendStatRecord[];
  summaries: MemberAttendStatSummary[];
  period: MemberAttendStatPeriod;
}

export function OverviewTab({ records, summaries, period }: OverviewTabProps) {
  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (period === "all") return true;
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const fmt = (d: Date) =>
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      if (period === "monthly") {
        const first = new Date(now.getFullYear(), now.getMonth(), 1);
        return r.date >= fmt(first) && r.date <= fmt(now);
      }
      // weekly
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      return r.date >= fmt(monday) && r.date <= fmt(now);
    });
  }, [records, period]);

  if (records.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-8 text-gray-400"
        role="status"
        aria-live="polite"
      >
        <BarChart3 className="h-8 w-8 mb-2 opacity-30" aria-hidden="true" />
        <p className="text-xs">출석 기록을 추가해보세요.</p>
      </div>
    );
  }

  const total = filtered.length;
  const counts = {
    present: 0,
    late: 0,
    early_leave: 0,
    absent: 0,
  } as Record<(typeof ALL_STATUSES)[number], number>;
  for (const r of filtered) counts[r.status]++;

  const distributionLabel = ALL_STATUSES.map(
    (s) => `${STATUS_LABEL[s]} ${Math.round((counts[s] / total) * 100)}%`
  ).join(", ");

  return (
    <div className="space-y-3" aria-live="polite">
      {total > 0 && (
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-gray-600">
            상태 분포
          </span>
          {/* 스택 바 */}
          <div
            className="flex h-3 rounded-full overflow-hidden gap-0.5"
            role="img"
            aria-label={`상태 분포: ${distributionLabel}`}
          >
            {ALL_STATUSES.map((s) => {
              const pct = Math.round((counts[s] / total) * 100);
              if (pct === 0) return null;
              return (
                <div
                  key={s}
                  className={`${STATUS_BAR_COLOR[s]} transition-all`}
                  style={{ width: `${pct}%` }}
                  aria-hidden="true"
                  title={`${STATUS_LABEL[s]}: ${counts[s]}건 (${pct}%)`}
                />
              );
            })}
          </div>
          <div className="flex gap-3 flex-wrap" aria-hidden="true">
            {ALL_STATUSES.map((s) => {
              const cnt = counts[s];
              const pct = total > 0 ? Math.round((cnt / total) * 100) : 0;
              return (
                <span
                  key={s}
                  className="flex items-center gap-1 text-[10px] text-gray-600"
                >
                  <span
                    className={`inline-block h-2 w-2 rounded-sm ${STATUS_BAR_COLOR[s]}`}
                    aria-hidden="true"
                  />
                  {STATUS_LABEL[s]} {cnt}건 ({pct}%)
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* 스트릭 하이라이트 */}
      <StreakHighlight summaries={summaries} />
    </div>
  );
}
