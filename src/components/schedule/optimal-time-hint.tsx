"use client";

import { Sparkles, TrendingUp } from "lucide-react";
import { useOptimalScheduleTime } from "@/hooks/use-optimal-schedule-time";
import type { DayOfWeek } from "@/hooks/use-optimal-schedule-time";

type OptimalTimeHintProps = {
  groupId: string;
  projectId?: string | null;
};

// 요일별 바 색상 (최고 요일은 강조)
const BAR_COLORS: Record<string, string> = {
  active: "bg-blue-500",
  inactive: "bg-muted",
};

// 시간대 아이콘 텍스트
const SLOT_EMOJI: Record<string, string> = {
  오전: "AM",
  오후: "PM",
  저녁: "NI",
};

export function OptimalTimeHint({ groupId, projectId }: OptimalTimeHintProps) {
  const { result, loading } = useOptimalScheduleTime(groupId, projectId);

  if (loading || !result) return null;

  const { bestDay, bestSlot, bestRate, dayStats, slotStats, analyzedCount } =
    result;

  // 요일 중 count > 0인 것만 표시
  const activeDayStats = dayStats.filter((d) => d.count > 0);

  // 시간대 중 count > 0인 것만 표시
  const activeSlotStats = slotStats.filter((s) => s.count > 0);

  if (activeDayStats.length === 0) return null;

  const maxDayRate = Math.max(...activeDayStats.map((d) => d.rate), 1);

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30 p-3 space-y-2.5">
      {/* 헤더 */}
      <div className="flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-blue-500 shrink-0" />
        <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
          추천 시간대
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground">
          최근 3개월 {analyzedCount}개 일정 분석
        </span>
      </div>

      {/* 최적 조합 뱃지 */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-md bg-blue-100 dark:bg-blue-900/50 px-2.5 py-1.5">
          <TrendingUp className="h-3 w-3 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-medium text-blue-800 dark:text-blue-300">
            {bestDay}요일 {bestSlot}
          </span>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
            평균 출석률 {bestRate}%
          </span>
        </div>
      </div>

      {/* 요일별 바 차트 (텍스트 기반) */}
      <div className="space-y-1">
        <p className="text-[10px] text-muted-foreground font-medium">
          요일별 평균 출석률
        </p>
        <div className="space-y-1">
          {dayStats.map((stat) => {
            if (stat.count === 0) return null;
            const isBest = stat.day === bestDay;
            const barWidth = maxDayRate > 0
              ? Math.round((stat.rate / maxDayRate) * 100)
              : 0;
            return (
              <div key={stat.day} className="flex items-center gap-2">
                <span
                  className={`text-[10px] w-4 shrink-0 font-medium ${
                    isBest
                      ? "text-blue-700 dark:text-blue-400"
                      : "text-muted-foreground"
                  }`}
                >
                  {stat.day}
                </span>
                <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isBest ? BAR_COLORS.active : "bg-blue-300/60 dark:bg-blue-700/60"
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span
                  className={`text-[10px] w-7 text-right shrink-0 tabular-nums ${
                    isBest
                      ? "text-blue-700 dark:text-blue-400 font-semibold"
                      : "text-muted-foreground"
                  }`}
                >
                  {stat.rate}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 시간대별 요약 */}
      {activeSlotStats.length > 0 && (
        <div className="flex gap-2 pt-0.5">
          {activeSlotStats.map((s) => {
            const isBestSlot = s.slot === bestSlot;
            return (
              <div
                key={s.slot}
                className={`flex items-center gap-1 rounded px-1.5 py-1 flex-1 justify-center ${
                  isBestSlot
                    ? "bg-blue-100 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800"
                    : "bg-muted/50"
                }`}
              >
                <span className="text-[9px] font-mono text-muted-foreground">
                  {SLOT_EMOJI[s.slot]}
                </span>
                <span
                  className={`text-[10px] font-medium ${
                    isBestSlot
                      ? "text-blue-700 dark:text-blue-400"
                      : "text-muted-foreground"
                  }`}
                >
                  {s.slot}
                </span>
                <span
                  className={`text-[10px] tabular-nums ${
                    isBestSlot
                      ? "text-blue-600 dark:text-blue-400 font-semibold"
                      : "text-muted-foreground"
                  }`}
                >
                  {s.rate}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
