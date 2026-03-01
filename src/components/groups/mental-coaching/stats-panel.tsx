"use client";

import { BarChart2, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { useMentalCoaching } from "@/hooks/use-mental-coaching";
import { TOPIC_BADGE, STATUS_BADGE, STATUS_LABEL, ENERGY_EMOJI } from "./types";

// ============================================================
// 통계 패널
// ============================================================

type StatsPanelProps = {
  stats: ReturnType<typeof useMentalCoaching>["stats"];
};

export function StatsPanel({ stats }: StatsPanelProps) {
  if (stats.totalNotes === 0) return null;

  return (
    <section
      className="rounded-lg border p-3 space-y-3 bg-gray-50"
      aria-label="멘탈 코칭 통계"
    >
      <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
        <BarChart2 className="h-3 w-3" aria-hidden="true" />
        통계
      </p>

      {/* 요약 수치 */}
      <dl className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-card border p-2 text-center">
          <dt className="text-[10px] text-muted-foreground">총 노트</dt>
          <dd className="text-base font-bold text-blue-600">
            {stats.totalNotes}
          </dd>
        </div>
        <div className="rounded-lg bg-card border p-2 text-center">
          <dt className="text-[10px] text-muted-foreground">평균 에너지</dt>
          <dd
            className="text-base font-bold text-purple-600"
            aria-label={
              stats.avgEnergyLevel > 0
                ? `평균 에너지 ${stats.avgEnergyLevel}`
                : "데이터 없음"
            }
          >
            {stats.avgEnergyLevel > 0
              ? (
                <>
                  <span aria-hidden="true">
                    {ENERGY_EMOJI[Math.round(stats.avgEnergyLevel)]}{" "}
                  </span>
                  {stats.avgEnergyLevel}
                </>
              )
              : "-"}
          </dd>
        </div>
        <div className="rounded-lg bg-card border p-2 text-center">
          <dt className="text-[10px] text-muted-foreground">액션 완료</dt>
          <dd
            className="text-base font-bold text-green-600"
            aria-label={
              stats.totalActionItems > 0
                ? `액션 완료 ${stats.doneActionItems}/${stats.totalActionItems}`
                : "데이터 없음"
            }
          >
            {stats.totalActionItems > 0
              ? `${stats.doneActionItems}/${stats.totalActionItems}`
              : "-"}
          </dd>
        </div>
      </dl>

      {/* 주제별 분포 */}
      {stats.topicDistribution.length > 0 && (
        <div className="space-y-1" aria-label="주제별 분포">
          <p className="text-[10px] font-medium text-muted-foreground">
            주제별 분포
          </p>
          {stats.topicDistribution
            .slice()
            .sort((a, b) => b.count - a.count)
            .map(({ topic, count }) => (
              <div key={topic} className="flex items-center gap-2">
                <Badge
                  className={cn(
                    "text-[10px] px-1.5 py-0 w-20 justify-center shrink-0",
                    TOPIC_BADGE[topic]
                  )}
                  aria-hidden="true"
                >
                  {topic}
                </Badge>
                <div
                  className="flex-1 bg-gray-200 rounded-full h-1.5"
                  role="meter"
                  aria-label={`${topic} ${count}건`}
                  aria-valuenow={count}
                  aria-valuemin={0}
                  aria-valuemax={stats.totalNotes}
                >
                  <div
                    className="bg-blue-400 h-1.5 rounded-full"
                    style={{
                      width: `${(count / stats.totalNotes) * 100}%`,
                    }}
                  />
                </div>
                <span
                  className="text-[10px] text-muted-foreground w-4 text-right"
                  aria-hidden="true"
                >
                  {count}
                </span>
              </div>
            ))}
        </div>
      )}

      {/* 상태별 분포 */}
      {stats.statusDistribution.length > 0 && (
        <div
          className="flex gap-2 flex-wrap"
          aria-label="상태별 분포"
          role="list"
        >
          {stats.statusDistribution.map(({ status, count }) => (
            <div
              key={status}
              role="listitem"
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5",
                STATUS_BADGE[status]
              )}
              aria-label={`${STATUS_LABEL[status]} ${count}건`}
            >
              <TrendingUp className="h-2.5 w-2.5" aria-hidden="true" />
              <span className="text-[10px]">
                {STATUS_LABEL[status]} {count}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
