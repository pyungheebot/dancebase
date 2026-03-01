"use client";

import { memo } from "react";
import { Badge } from "@/components/ui/badge";

interface SectionStat {
  id: string;
  title: string;
  count: number;
}

interface CreditsStatsProps {
  sectionStats: SectionStat[];
  totalPeople: number;
}

export const CreditsStats = memo(function CreditsStats({
  sectionStats,
}: CreditsStatsProps) {
  if (sectionStats.length === 0) return null;

  return (
    <div
      className="flex flex-wrap gap-1 mb-3"
      role="list"
      aria-label="섹션별 인원 통계"
    >
      {sectionStats.map((s) => (
        <Badge
          key={s.id}
          variant="secondary"
          className="text-[10px] px-1.5 py-0 gap-0.5"
          role="listitem"
          aria-label={`${s.title} ${s.count}명`}
        >
          {s.title}
          <span className="text-muted-foreground ml-0.5" aria-hidden="true">
            {s.count}
          </span>
        </Badge>
      ))}
    </div>
  );
});
