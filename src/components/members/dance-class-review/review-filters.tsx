"use client";

import { Filter } from "lucide-react";
import {
  DIFFICULTY_LABELS,
  DIFFICULTY_ORDER,
  DIFFICULTY_COLORS,
} from "@/hooks/use-dance-class-review";
import type { DanceClassDifficulty } from "@/types";

// ============================================================
// 리뷰 필터 컴포넌트
// ============================================================

interface ReviewFiltersProps {
  filterDifficulty: DanceClassDifficulty | "all";
  setFilterDifficulty: (v: DanceClassDifficulty | "all") => void;
  filterGenre: string;
  setFilterGenre: (v: string) => void;
  genres: string[];
}

export function ReviewFilters({
  filterDifficulty,
  setFilterDifficulty,
  filterGenre,
  setFilterGenre,
  genres,
}: ReviewFiltersProps) {
  return (
    <div
      className="flex flex-wrap items-center gap-1.5"
      role="group"
      aria-label="수업 평가 필터"
    >
      <Filter className="h-3 w-3 text-muted-foreground shrink-0" aria-hidden="true" />

      {/* 난이도 필터 */}
      <fieldset className="contents">
        <legend className="sr-only">난이도 필터</legend>
        <button
          type="button"
          onClick={() => setFilterDifficulty("all")}
          aria-pressed={filterDifficulty === "all"}
          className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
            filterDifficulty === "all"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-muted-foreground border-border hover:bg-accent"
          }`}
        >
          전체 난이도
        </button>
        {DIFFICULTY_ORDER.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() =>
              setFilterDifficulty(d === filterDifficulty ? "all" : d)
            }
            aria-pressed={filterDifficulty === d}
            className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
              filterDifficulty === d
                ? `${DIFFICULTY_COLORS[d].badge} border-current`
                : "bg-background text-muted-foreground border-border hover:bg-accent"
            }`}
          >
            {DIFFICULTY_LABELS[d]}
          </button>
        ))}
      </fieldset>

      {/* 장르 필터 */}
      {genres.length > 0 && (
        <>
          <span className="text-[10px] text-muted-foreground mx-0.5" aria-hidden="true">|</span>
          <fieldset className="contents">
            <legend className="sr-only">장르 필터</legend>
            <button
              type="button"
              onClick={() => setFilterGenre("all")}
              aria-pressed={filterGenre === "all"}
              className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                filterGenre === "all"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:bg-accent"
              }`}
            >
              전체 장르
            </button>
            {genres.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setFilterGenre(g === filterGenre ? "all" : g)}
                aria-pressed={filterGenre === g}
                className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                  filterGenre === g
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:bg-accent"
                }`}
              >
                {g}
              </button>
            ))}
          </fieldset>
        </>
      )}
    </div>
  );
}
