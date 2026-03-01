"use client";

import { Music2 } from "lucide-react";
import type { useDanceCompetition } from "@/hooks/use-dance-competition";

// ============================================================
// 통계 섹션
// ============================================================

interface StatsSectionProps {
  stats: ReturnType<typeof useDanceCompetition>["stats"];
  years: string[];
  genres: string[];
}

export function StatsSection({ stats, years, genres }: StatsSectionProps) {
  return (
    <section aria-label="대회 참가 통계">
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-lg border bg-muted/30 p-2.5 text-center">
          <dt className="text-[10px] text-muted-foreground">총 참가</dt>
          <dd className="text-lg font-bold tabular-nums">
            {stats.totalRecords}
          </dd>
        </div>
        <div className="rounded-lg border bg-yellow-50 p-2.5 text-center">
          <dt className="text-[10px] text-muted-foreground">입상 횟수</dt>
          <dd className="text-lg font-bold tabular-nums text-yellow-600">
            {stats.placementCount}
          </dd>
        </div>
        <div className="rounded-lg border bg-muted/30 p-2.5 text-center">
          <dt className="text-[10px] text-muted-foreground">활동 연도</dt>
          <dd className="text-lg font-bold tabular-nums">{years.length}</dd>
        </div>
        <div className="rounded-lg border bg-muted/30 p-2.5 text-center">
          <dt className="text-[10px] text-muted-foreground">도전 장르</dt>
          <dd className="text-lg font-bold tabular-nums">{genres.length}</dd>
        </div>
      </dl>

      {/* 연도별 분포 */}
      {years.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">
            연도별 참가
          </p>
          <dl className="flex flex-wrap gap-2">
            {years.map((yr) => (
              <div
                key={yr}
                className="flex items-center gap-1 rounded-md border bg-muted/30 px-2 py-1 text-[10px]"
              >
                <dt className="font-medium">{yr}년</dt>
                <dd className="text-muted-foreground">
                  {stats.yearlyDistribution[yr] ?? 0}회
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* 장르별 분포 */}
      {genres.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">
            장르별 참가
          </p>
          <dl className="flex flex-wrap gap-2">
            {genres.map((g) => (
              <div
                key={g}
                className="flex items-center gap-1 rounded-md border bg-muted/30 px-2 py-1 text-[10px]"
              >
                <Music2
                  className="h-3 w-3 text-muted-foreground"
                  aria-hidden="true"
                />
                <dt className="font-medium">{g}</dt>
                <dd className="text-muted-foreground">
                  {stats.genreDistribution[g] ?? 0}회
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  );
}
