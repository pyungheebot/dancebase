"use client";

import { memo, useState, useId } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  Activity,
} from "lucide-react";
import { ALL_TRAITS } from "@/hooks/use-dance-style-analysis";
import type { DanceStyleSnapshot } from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";
import { RadarChart } from "./radar-chart";
import { TraitBar } from "./trait-controls";

// ============================================================
// 스냅샷 목록 행 (접기/펼치기)
// ============================================================

type SnapshotRowProps = {
  snapshot: DanceStyleSnapshot;
  onEdit: () => void;
  onDelete: () => void;
};

export const SnapshotRow = memo(function SnapshotRow({
  snapshot,
  onEdit,
  onDelete,
}: SnapshotRowProps) {
  const [expanded, setExpanded] = useState(false);
  const detailId = useId();

  const avgScore =
    Math.round(
      (ALL_TRAITS.reduce((s, t) => s + snapshot.traitScores[t], 0) /
        ALL_TRAITS.length) *
        10
    ) / 10;

  const formattedDate = formatYearMonthDay(snapshot.date);

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* 헤더 행 */}
      <div
        className="flex items-center gap-2 px-3 py-2 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-controls={detailId}
        aria-label={`${formattedDate} 분석 기록, 평균 ${avgScore}점. ${expanded ? "접기" : "펼치기"}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
      >
        <Activity
          className="h-3.5 w-3.5 text-indigo-500 shrink-0"
          aria-hidden="true"
        />
        <span className="text-xs font-medium flex-1">{formattedDate}</span>

        <Badge
          className="text-[10px] px-1.5 py-0 bg-indigo-100 text-indigo-700 border-indigo-200"
          variant="outline"
        >
          평균 {avgScore}
        </Badge>

        {/* 주력 장르 배지 */}
        {snapshot.primaryGenres.slice(0, 2).map((g) => (
          <Badge
            key={g}
            variant="secondary"
            className="text-[10px] px-1.5 py-0"
          >
            {g}
          </Badge>
        ))}
        {snapshot.primaryGenres.length > 2 && (
          <span className="text-[10px] text-muted-foreground">
            +{snapshot.primaryGenres.length - 2}
          </span>
        )}

        <div className="flex gap-1 ml-auto" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={onEdit}
            aria-label={`${formattedDate} 분석 기록 수정`}
          >
            <Pencil className="h-3 w-3" aria-hidden="true" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            onClick={onDelete}
            aria-label={`${formattedDate} 분석 기록 삭제`}
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
          </Button>
        </div>

        {expanded ? (
          <ChevronUp
            className="h-3.5 w-3.5 text-muted-foreground shrink-0"
            aria-hidden="true"
          />
        ) : (
          <ChevronDown
            className="h-3.5 w-3.5 text-muted-foreground shrink-0"
            aria-hidden="true"
          />
        )}
      </div>

      {/* 상세 내용 */}
      <div
        id={detailId}
        hidden={!expanded}
        className="px-3 py-3 space-y-3 border-t bg-background"
        aria-live="polite"
      >
        {expanded && (
          <>
            <div className="flex gap-4">
              {/* 레이더 차트 */}
              <div className="flex-shrink-0">
                <RadarChart scores={snapshot.traitScores} size={150} />
              </div>

              {/* 특성 바 목록 */}
              <div
                className="flex-1 space-y-1.5 min-w-0"
                role="list"
                aria-label="특성별 점수"
              >
                {ALL_TRAITS.map((trait) => (
                  <div key={trait} role="listitem">
                    <TraitBar trait={trait} value={snapshot.traitScores[trait]} />
                  </div>
                ))}
              </div>
            </div>

            {/* 장르 및 태그 */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {snapshot.primaryGenres.length > 0 && (
                <div>
                  <span className="text-muted-foreground">주력 장르</span>
                  <div
                    className="flex flex-wrap gap-1 mt-1"
                    role="list"
                    aria-label="주력 장르"
                  >
                    {snapshot.primaryGenres.map((g) => (
                      <Badge
                        key={g}
                        className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-blue-200"
                        variant="outline"
                        role="listitem"
                      >
                        {g}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {snapshot.secondaryGenres.length > 0 && (
                <div>
                  <span className="text-muted-foreground">부력 장르</span>
                  <div
                    className="flex flex-wrap gap-1 mt-1"
                    role="list"
                    aria-label="부력 장르"
                  >
                    {snapshot.secondaryGenres.map((g) => (
                      <Badge
                        key={g}
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0"
                        role="listitem"
                      >
                        {g}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {snapshot.strengths.length > 0 && (
                <div>
                  <span className="text-muted-foreground">강점</span>
                  <div
                    className="flex flex-wrap gap-1 mt-1"
                    role="list"
                    aria-label="강점"
                  >
                    {snapshot.strengths.map((s) => (
                      <Badge
                        key={s}
                        className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200"
                        variant="outline"
                        role="listitem"
                      >
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {snapshot.weaknesses.length > 0 && (
                <div>
                  <span className="text-muted-foreground">약점</span>
                  <div
                    className="flex flex-wrap gap-1 mt-1"
                    role="list"
                    aria-label="약점"
                  >
                    {snapshot.weaknesses.map((w) => (
                      <Badge
                        key={w}
                        className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 border-orange-200"
                        variant="outline"
                        role="listitem"
                      >
                        {w}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 노트 */}
            {snapshot.notes && (
              <div className="bg-muted/40 rounded p-2">
                <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                  {snapshot.notes}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
});
