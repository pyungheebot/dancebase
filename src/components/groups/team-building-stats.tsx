"use client";

import { memo } from "react";
import { BarChart2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CATEGORY_COLOR, CATEGORY_ICON, CATEGORY_LABEL } from "./team-building-types";
import type { TeamBuildingCategory } from "@/types";

type TeamBuildingStatsProps = {
  totalEvents: number;
  completedEvents: number;
  averageRating: number;
  topCategory: TeamBuildingCategory | null;
};

export const TeamBuildingStats = memo(function TeamBuildingStats({
  totalEvents,
  completedEvents,
  averageRating,
  topCategory,
}: TeamBuildingStatsProps) {
  if (totalEvents === 0) return null;

  return (
    <section aria-label="팀빌딩 통계" className="space-y-2">
      <div className="grid grid-cols-3 gap-2" role="list">
        <div
          className="rounded-md bg-muted/40 p-2 text-center"
          role="listitem"
          aria-label={`총 활동 ${totalEvents}회`}
        >
          <p className="text-xs font-semibold" aria-hidden="true">
            {totalEvents}
          </p>
          <p className="text-[10px] text-muted-foreground">총 활동</p>
        </div>
        <div
          className="rounded-md bg-muted/40 p-2 text-center"
          role="listitem"
          aria-label={`완료 ${completedEvents}회`}
        >
          <p className="text-xs font-semibold text-green-600" aria-hidden="true">
            {completedEvents}
          </p>
          <p className="text-[10px] text-muted-foreground">완료</p>
        </div>
        <div
          className="rounded-md bg-muted/40 p-2 text-center"
          role="listitem"
          aria-label={`평균 만족도 ${averageRating > 0 ? `${averageRating}점` : "없음"}`}
        >
          <p className="text-xs font-semibold text-yellow-600" aria-hidden="true">
            {averageRating > 0 ? `${averageRating}점` : "-"}
          </p>
          <p className="text-[10px] text-muted-foreground">평균 만족도</p>
        </div>
      </div>

      {topCategory && (
        <div
          className="flex items-center gap-1.5 rounded-md bg-muted/40 px-2.5 py-1.5"
          aria-label={`인기 카테고리: ${CATEGORY_LABEL[topCategory]}`}
        >
          <BarChart2 className="h-3 w-3 text-muted-foreground shrink-0" aria-hidden="true" />
          <span className="text-[10px] text-muted-foreground">인기 카테고리</span>
          <Badge
            variant="secondary"
            className={cn(
              "ml-auto flex items-center gap-1 text-[10px] px-1.5 py-0",
              CATEGORY_COLOR[topCategory]
            )}
          >
            <span aria-hidden="true">{CATEGORY_ICON[topCategory]}</span>
            {CATEGORY_LABEL[topCategory]}
          </Badge>
        </div>
      )}
    </section>
  );
});
