"use client";

// ============================================================
// 댄스 수업 수강 기록 - 통계 배지 & 레벨 분포 차트
// ============================================================

import { GraduationCap, Clock, Star, BarChart2 } from "lucide-react";
import {
  CLASS_LOG_LEVEL_LABELS,
  CLASS_LOG_LEVEL_ORDER,
  CLASS_LOG_LEVEL_COLORS,
  type DanceClassLogStats,
} from "@/hooks/use-dance-class-log";

// ──────────────────────────────────────────
// StatBadge - 단일 통계 배지
// ──────────────────────────────────────────

interface StatBadgeProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}

const COLOR_MAP: Record<string, string> = {
  teal: "bg-teal-50 border-teal-200",
  blue: "bg-blue-50 border-blue-200",
  yellow: "bg-yellow-50 border-yellow-200",
};

function StatBadge({ icon, label, value, color }: StatBadgeProps) {
  return (
    <div
      className={`flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2 ${
        COLOR_MAP[color] ?? "bg-muted/30 border-border"
      }`}
      aria-label={`${label}: ${value}`}
    >
      <div className="flex items-center gap-1">
        {icon}
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <span className="text-xs font-semibold">{value}</span>
    </div>
  );
}

// ──────────────────────────────────────────
// ClassLogSummaryStats - 3개 통계 배지 묶음
// ──────────────────────────────────────────

interface ClassLogSummaryStatsProps {
  totalCount: number;
  stats: DanceClassLogStats;
}

export function ClassLogSummaryStats({
  totalCount,
  stats,
}: ClassLogSummaryStatsProps) {
  return (
    // 요약 통계 그리드 (총 수업 / 최근 30일 / 평균 평가)
    <div className="grid grid-cols-3 gap-2" role="region" aria-label="수업 통계">
      <StatBadge
        icon={<GraduationCap className="h-3 w-3 text-teal-500" />}
        label="총 수업"
        value={`${totalCount}회`}
        color="teal"
      />
      <StatBadge
        icon={<Clock className="h-3 w-3 text-blue-500" />}
        label="최근 30일"
        value={`${stats.recentMonthCount}회`}
        color="blue"
      />
      <StatBadge
        icon={<Star className="h-3 w-3 text-yellow-500" />}
        label="평균 평가"
        value={`${stats.avgRating} / 5`}
        color="yellow"
      />
    </div>
  );
}

// ──────────────────────────────────────────
// ClassLogLevelChart - 레벨별 분포 바 차트
// ──────────────────────────────────────────

interface ClassLogLevelChartProps {
  stats: DanceClassLogStats;
}

export function ClassLogLevelChart({ stats }: ClassLogLevelChartProps) {
  // 레벨별 최대값 (0 방지를 위해 1 이상 보장)
  const maxCount = Math.max(...Object.values(stats.byLevel), 1);

  return (
    <div className="space-y-1.5" role="region" aria-label="레벨 분포">
      <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
        <BarChart2 className="h-3 w-3" aria-hidden="true" />
        레벨 분포
      </div>
      <div className="space-y-1.5">
        {CLASS_LOG_LEVEL_ORDER.map((lv) => {
          const count = stats.byLevel[lv];
          const pct = Math.round((count / maxCount) * 100);
          return (
            <div key={lv} className="flex items-center gap-2" role="row">
              <span
                className={`text-[10px] w-14 shrink-0 font-medium ${CLASS_LOG_LEVEL_COLORS[lv].text}`}
                aria-label={`${CLASS_LOG_LEVEL_LABELS[lv]} 레벨`}
              >
                {CLASS_LOG_LEVEL_LABELS[lv]}
              </span>
              {/* 게이지 바 */}
              <div
                className="flex-1 h-2 rounded-full bg-muted overflow-hidden"
                role="progressbar"
                aria-valuenow={count}
                aria-valuemin={0}
                aria-valuemax={maxCount}
                aria-label={`${count}회`}
              >
                <div
                  className={`h-full rounded-full transition-all duration-500 ${CLASS_LOG_LEVEL_COLORS[lv].bar}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span
                className="text-[10px] w-4 text-right text-muted-foreground shrink-0"
                aria-label={`${count}회`}
              >
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
