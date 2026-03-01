"use client";

// ============================================
// 성장 통계 패널 + 자기평가 추이 차트
// ============================================

import { memo } from "react";
import { TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { GrowthJournalEntry, GrowthJournalMood } from "@/types";
import { MOOD_EMOJI } from "./growth-journal-types";

// ============================================
// 자기평가 추이 도트 차트 (최근 10개)
// ============================================

interface RatingDotChartProps {
  entries: GrowthJournalEntry[];
}

export const RatingDotChart = memo(function RatingDotChart({
  entries,
}: RatingDotChartProps) {
  // 날짜 최신 순 정렬 후 최근 10개 추출, 차트는 오래된 것부터 표시
  const recent = [...entries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10)
    .reverse();

  // 최소 2개 이상이어야 추이 차트 의미 있음
  if (recent.length < 2) return null;

  const avg = recent.reduce((sum, e) => sum + e.selfRating, 0) / recent.length;

  return (
    <div
      className="rounded-md border bg-muted/20 p-3 space-y-2"
      aria-label={`최근 자기평가 추이, 평균 ${avg.toFixed(1)}점`}
    >
      <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
        <TrendingUp className="h-3 w-3" aria-hidden="true" />
        최근 자기평가 추이 (최근 {recent.length}개)
        <span className="ml-auto text-foreground font-semibold">
          평균 {avg.toFixed(1)}점
        </span>
      </p>
      {/* 막대 차트 */}
      <div
        className="flex items-end gap-1.5 h-10"
        role="img"
        aria-label="자기평가 막대 차트"
      >
        {recent.map((e, i) => {
          const heightPct = (e.selfRating / 5) * 100;
          const isLast = i === recent.length - 1;
          return (
            <div
              key={e.id}
              className="flex-1 flex flex-col items-center justify-end gap-0.5"
              title={`${e.date}: ${e.selfRating}점`}
            >
              <div
                className={cn(
                  "w-full rounded-sm min-h-[4px] transition-all",
                  isLast
                    ? "bg-primary"
                    : e.selfRating >= 4
                    ? "bg-green-400"
                    : e.selfRating >= 3
                    ? "bg-yellow-400"
                    : "bg-red-400"
                )}
                style={{ height: `${heightPct}%` }}
              />
            </div>
          );
        })}
      </div>
      {/* 날짜 축 */}
      <div className="flex justify-between text-[9px] text-muted-foreground">
        <span>{recent[0]?.date.slice(5)}</span>
        <span>{recent[recent.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  );
});

// ============================================
// 통계 패널
// ============================================

interface StatsPanelProps {
  entries: GrowthJournalEntry[];
  totalEntries: number;
  averageSelfRating: number;
  moodDistribution: Record<GrowthJournalMood, number>;
  topSkillsPracticed: { skill: string; count: number }[];
}

export const StatsPanel = memo(function StatsPanel({
  entries,
  totalEntries,
  averageSelfRating,
  moodDistribution,
  topSkillsPracticed,
}: StatsPanelProps) {
  // 가장 빈도 높은 무드 계산
  const topMood = (
    Object.entries(moodDistribution) as [GrowthJournalMood, number][]
  ).sort((a, b) => b[1] - a[1])[0];

  return (
    <section
      className="rounded-md border bg-muted/20 p-3 space-y-3"
      aria-label="성장 통계"
    >
      <p className="text-xs font-medium flex items-center gap-1.5">
        <TrendingUp className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
        성장 통계
      </p>

      {/* 요약 숫자 3칸 */}
      <div className="grid grid-cols-3 gap-2" role="list" aria-label="통계 요약">
        <div
          className="rounded-md bg-background border px-2 py-2 text-center"
          role="listitem"
        >
          <p className="text-base font-bold">{totalEntries}</p>
          <p className="text-[10px] text-muted-foreground">총 일지</p>
        </div>
        <div
          className="rounded-md bg-background border px-2 py-2 text-center"
          role="listitem"
        >
          <p className="text-base font-bold">{averageSelfRating.toFixed(1)}</p>
          <p className="text-[10px] text-muted-foreground">평균 자기평가</p>
        </div>
        <div
          className="rounded-md bg-background border px-2 py-2 text-center"
          role="listitem"
        >
          <p className="text-lg leading-none">
            {topMood ? MOOD_EMOJI[topMood[0]] : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground">주요 무드</p>
        </div>
      </div>

      {/* 자기평가 추이 차트 */}
      <RatingDotChart entries={entries} />

      {/* Top 5 자주 연습한 스킬 */}
      {topSkillsPracticed.length > 0 && (
        <div>
          <p className="text-[10px] text-muted-foreground mb-1.5">
            자주 연습한 스킬 TOP 5
          </p>
          <div
            className="flex flex-wrap gap-1"
            role="list"
            aria-label="자주 연습한 스킬"
          >
            {topSkillsPracticed.map(({ skill, count }, i) => (
              <Badge
                key={skill}
                variant="secondary"
                className={cn(
                  "text-[10px] px-1.5 py-0 gap-1",
                  i === 0 && "bg-primary/10 text-primary border-primary/20"
                )}
                role="listitem"
              >
                {i === 0 && <span aria-hidden="true">🏅</span>}
                {skill}
                <span className="text-muted-foreground">({count})</span>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </section>
  );
});
