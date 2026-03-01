"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PostShowReportSectionScore } from "@/types";
import { SECTION_COLORS, SECTION_LABELS } from "./types";

/**
 * 섹션별 점수 + 코멘트 입력 행
 *
 * 접근성: Label htmlFor/id 매칭, aria-label, input min/max
 */
export function SectionScoreRow({
  sectionScore,
  onChange,
}: {
  sectionScore: PostShowReportSectionScore;
  onChange: (updated: PostShowReportSectionScore) => void;
}) {
  const scoreInputId = `score-${sectionScore.section}`;
  const commentInputId = `comment-${sectionScore.section}`;
  const label = SECTION_LABELS[sectionScore.section];

  return (
    <div
      className="space-y-1.5 rounded-md border p-2.5"
      role="group"
      aria-label={`${label} 평가`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-medium ${SECTION_COLORS[sectionScore.section]}`}
          id={`label-${sectionScore.section}`}
        >
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          <Label
            htmlFor={scoreInputId}
            className="text-[10px] text-muted-foreground"
          >
            점수
          </Label>
          <Input
            id={scoreInputId}
            type="number"
            min={1}
            max={5}
            step={1}
            value={sectionScore.score}
            aria-describedby={`label-${sectionScore.section}`}
            aria-label={`${label} 점수 (1~5)`}
            onChange={(e) =>
              onChange({
                ...sectionScore,
                score: Math.min(5, Math.max(1, parseInt(e.target.value) || 1)),
              })
            }
            onKeyDown={(e) => {
              if (e.key === "ArrowUp") {
                e.preventDefault();
                onChange({
                  ...sectionScore,
                  score: Math.min(5, sectionScore.score + 1),
                });
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                onChange({
                  ...sectionScore,
                  score: Math.max(1, sectionScore.score - 1),
                });
              }
            }}
            className="h-6 w-12 text-xs text-center"
          />
          <span
            className="text-[10px] text-muted-foreground"
            aria-hidden="true"
          >
            /5
          </span>
        </div>
      </div>
      <Label htmlFor={commentInputId} className="sr-only">
        {label} 코멘트
      </Label>
      <Input
        id={commentInputId}
        placeholder="코멘트 (선택)"
        value={sectionScore.comment}
        aria-label={`${label} 코멘트`}
        onChange={(e) =>
          onChange({ ...sectionScore, comment: e.target.value })
        }
        className="h-7 text-xs"
      />
    </div>
  );
}
