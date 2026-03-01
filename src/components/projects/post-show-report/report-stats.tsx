"use client";

import { POST_SHOW_SECTIONS } from "@/hooks/use-post-show-report";
import type { PostShowReportSection } from "@/types";
import { StarDisplay } from "./star-display";
import { SECTION_COLORS, SECTION_LABELS, scoreColor, formatRevenue } from "./types";

type StatsShape = {
  totalReports: number;
  overallAvg: number;
  totalAudience: number;
  totalRevenue: number;
  sectionAvgMap: Partial<Record<PostShowReportSection, number>>;
};

/**
 * 통계 요약 카드 (보고서 수 / 종합 점수 / 총 관객 / 총 매출)
 *
 * 접근성: role="status" aria-live, dl/dt/dd
 */
export function ReportStatsSummary({ stats }: { stats: StatsShape }) {
  return (
    <dl
      className="grid grid-cols-4 gap-2 rounded-md bg-muted/30 p-3"
      role="status"
      aria-live="polite"
      aria-label="공연 사후 분석 통계 요약"
    >
      <div className="text-center space-y-0.5">
        <dt className="text-[10px] text-muted-foreground">보고서</dt>
        <dd className="text-sm font-bold text-indigo-600">
          {stats.totalReports}건
        </dd>
      </div>
      <div className="text-center space-y-0.5">
        <dt className="text-[10px] text-muted-foreground">종합 점수</dt>
        <dd className={`text-sm font-bold ${scoreColor(stats.overallAvg)}`}>
          {stats.overallAvg > 0 ? `${stats.overallAvg.toFixed(1)}점` : "-"}
        </dd>
      </div>
      <div className="text-center space-y-0.5">
        <dt className="text-[10px] text-muted-foreground">총 관객</dt>
        <dd className="text-sm font-bold text-blue-600">
          {stats.totalAudience > 0
            ? `${stats.totalAudience.toLocaleString()}명`
            : "-"}
        </dd>
      </div>
      <div className="text-center space-y-0.5">
        <dt className="text-[10px] text-muted-foreground">총 매출</dt>
        <dd className="text-sm font-bold text-green-600">
          {stats.totalRevenue > 0 ? formatRevenue(stats.totalRevenue) : "-"}
        </dd>
      </div>
    </dl>
  );
}

/**
 * 섹션별 종합 평균 그리드
 *
 * 접근성: dl/dt/dd, aria-label
 */
export function ReportSectionAverages({
  sectionAvgMap,
}: {
  sectionAvgMap: Partial<Record<PostShowReportSection, number>>;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold text-muted-foreground">
        섹션별 종합 평균
      </p>
      <dl
        className="grid grid-cols-3 gap-x-4 gap-y-1"
        aria-label="섹션별 종합 평균 점수"
      >
        {POST_SHOW_SECTIONS.map((section) => {
          const avg = sectionAvgMap[section];
          if (avg === undefined) return null;
          return (
            <div key={section} className="flex items-center justify-between">
              <dt className={`text-[10px] ${SECTION_COLORS[section]}`}>
                {SECTION_LABELS[section]}
              </dt>
              <dd className="flex items-center gap-1">
                <StarDisplay
                  value={avg}
                  aria-label={`${SECTION_LABELS[section]} 평균 ${avg.toFixed(1)}점`}
                />
                <span
                  className={`text-[10px] font-semibold w-5 text-right ${scoreColor(avg)}`}
                >
                  {avg.toFixed(1)}
                </span>
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
