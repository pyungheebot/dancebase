"use client";

// ============================================================
// 댄스 수업 수강 기록 - 필터 바
// ============================================================

import { Filter } from "lucide-react";
import {
  CLASS_LOG_LEVEL_LABELS,
  CLASS_LOG_LEVEL_ORDER,
  CLASS_LOG_LEVEL_COLORS,
  CLASS_LOG_SOURCE_LABELS,
  CLASS_LOG_SOURCE_COLORS,
  type DanceClassLogStats,
} from "@/hooks/use-dance-class-log";
import type { DanceClassLogSource, DanceClassLogLevel } from "@/types";

interface ClassLogFilterBarProps {
  filterGenre: string;
  filterSource: DanceClassLogSource | "all";
  filterLevel: DanceClassLogLevel | "all";
  onGenreChange: (genre: string) => void;
  onSourceChange: (source: DanceClassLogSource | "all") => void;
  onLevelChange: (level: DanceClassLogLevel | "all") => void;
  stats: DanceClassLogStats;
}

export function ClassLogFilterBar({
  filterGenre,
  filterSource,
  filterLevel,
  onGenreChange,
  onSourceChange,
  onLevelChange,
  stats,
}: ClassLogFilterBarProps) {
  return (
    // 필터 바 컨테이너 - 접근성: toolbar 역할 부여
    <div
      className="flex flex-wrap items-center gap-1.5"
      role="toolbar"
      aria-label="수업 기록 필터"
    >
      <Filter className="h-3 w-3 text-muted-foreground shrink-0" aria-hidden="true" />

      {/* 출처 필터 버튼 그룹 */}
      <div role="group" aria-label="출처 필터" className="flex flex-wrap gap-1">
        {(["all", "internal", "external"] as const).map((src) => (
          <button
            key={src}
            type="button"
            aria-pressed={filterSource === src}
            onClick={() => onSourceChange(src)}
            className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
              filterSource === src
                ? src === "all"
                  ? "bg-primary text-primary-foreground border-primary"
                  : `${CLASS_LOG_SOURCE_COLORS[src].badge} border-current`
                : "bg-background text-muted-foreground border-border hover:bg-accent"
            }`}
          >
            {src === "all" ? "전체 출처" : CLASS_LOG_SOURCE_LABELS[src]}
          </button>
        ))}
      </div>

      <span className="text-[10px] text-muted-foreground mx-0.5" aria-hidden="true">
        |
      </span>

      {/* 장르 필터 버튼 그룹 */}
      <div role="group" aria-label="장르 필터" className="flex flex-wrap gap-1">
        <button
          type="button"
          aria-pressed={filterGenre === "all"}
          onClick={() => onGenreChange("all")}
          className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
            filterGenre === "all"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-muted-foreground border-border hover:bg-accent"
          }`}
        >
          전체 장르
        </button>
        {stats.genres.map((g) => (
          <button
            key={g}
            type="button"
            aria-pressed={filterGenre === g}
            onClick={() => onGenreChange(g === filterGenre ? "all" : g)}
            className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
              filterGenre === g
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:bg-accent"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      <span className="text-[10px] text-muted-foreground mx-0.5" aria-hidden="true">
        |
      </span>

      {/* 레벨 필터 버튼 그룹 */}
      <div role="group" aria-label="레벨 필터" className="flex flex-wrap gap-1">
        {CLASS_LOG_LEVEL_ORDER.map((lv) => (
          <button
            key={lv}
            type="button"
            aria-pressed={filterLevel === lv}
            onClick={() => onLevelChange(lv === filterLevel ? "all" : lv)}
            className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
              filterLevel === lv
                ? `${CLASS_LOG_LEVEL_COLORS[lv].badge} border-current`
                : "bg-background text-muted-foreground border-border hover:bg-accent"
            }`}
          >
            {CLASS_LOG_LEVEL_LABELS[lv]}
          </button>
        ))}
      </div>
    </div>
  );
}
