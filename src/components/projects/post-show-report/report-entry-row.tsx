"use client";

import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  BarChart2,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Users,
  DollarSign,
} from "lucide-react";
import { POST_SHOW_SECTIONS } from "@/hooks/use-post-show-report";
import type { PostShowReportEntry } from "@/types";
import { StarDisplay } from "./star-display";
import { SECTION_COLORS, SECTION_LABELS, scoreColor, formatRevenue } from "./types";

/**
 * 보고서 목록 행 - 접기/펼치기 + 상세 내용 표시
 *
 * React.memo: entry 참조가 바뀌지 않으면 재렌더 생략
 *
 * 접근성: aria-expanded, aria-controls, role=region,
 *         time dateTime, dl/dt/dd, aria-label, onKeyDown
 */
export const ReportEntryRow = memo(function ReportEntryRow({
  entry,
  onEdit,
  onDelete,
}: {
  entry: PostShowReportEntry;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  const avgScore =
    entry.sectionScores.length > 0
      ? Math.round(
          (entry.sectionScores.reduce((sum, s) => sum + s.score, 0) /
            entry.sectionScores.length) *
            10
        ) / 10
      : 0;

  const detailRegionId = `report-detail-${entry.id}`;
  const triggerId = `report-trigger-${entry.id}`;

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      aria-label={`${entry.title} 보고서`}
    >
      <div className="rounded-md border bg-card hover:bg-accent/30 transition-colors">
        <CollapsibleTrigger asChild>
          <div
            id={triggerId}
            role="button"
            tabIndex={0}
            aria-expanded={open}
            aria-controls={detailRegionId}
            className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-t-md"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setOpen((prev) => !prev);
              }
            }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium truncate">
                  {entry.title}
                </span>
                <time
                  dateTime={entry.performanceDate}
                  className="shrink-0"
                >
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0"
                  >
                    {entry.performanceDate}
                  </Badge>
                </time>
                {entry.audienceCount !== undefined &&
                  entry.audienceCount > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 shrink-0 bg-blue-50 text-blue-700 border-blue-200"
                    >
                      <Users className="h-2.5 w-2.5 mr-0.5" aria-hidden="true" />
                      <span>{entry.audienceCount.toLocaleString()}명</span>
                    </Badge>
                  )}
                {avgScore > 0 && (
                  <span
                    className={`text-xs font-semibold ${scoreColor(avgScore)}`}
                    aria-label={`종합 점수 ${avgScore.toFixed(1)}점`}
                  >
                    {avgScore.toFixed(1)}점
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                작성자: {entry.author}
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                aria-label={`${entry.title} 수정`}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Pencil className="h-3 w-3" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                aria-label={`${entry.title} 삭제`}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-3 w-3" aria-hidden="true" />
              </Button>
              {open ? (
                <ChevronUp
                  className="h-3.5 w-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
              ) : (
                <ChevronDown
                  className="h-3.5 w-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div
            id={detailRegionId}
            role="region"
            aria-label={`${entry.title} 상세 내용`}
            className="px-3 pb-3 space-y-3 border-t pt-2"
          >
            {/* 총평 */}
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-muted-foreground">
                총평
              </p>
              <p className="text-xs leading-relaxed bg-muted/30 rounded px-2 py-1.5">
                {entry.overallReview}
              </p>
            </div>

            {/* 섹션별 평가 */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <BarChart2 className="h-3 w-3" aria-hidden="true" />
                섹션별 평가
              </p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {POST_SHOW_SECTIONS.map((section) => {
                  const ss = entry.sectionScores.find(
                    (s) => s.section === section
                  );
                  if (!ss) return null;
                  return (
                    <div key={section} className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <dt
                          className={`text-[10px] ${SECTION_COLORS[section]}`}
                        >
                          {SECTION_LABELS[section]}
                        </dt>
                        <dd className="flex items-center gap-1">
                          <StarDisplay
                            value={ss.score}
                            aria-label={`${SECTION_LABELS[section]} ${ss.score}점`}
                          />
                          <span
                            className={`text-[10px] font-semibold w-4 text-right ${scoreColor(ss.score)}`}
                          >
                            {ss.score}
                          </span>
                        </dd>
                      </div>
                      {ss.comment && (
                        <p className="text-[10px] text-muted-foreground pl-1">
                          {ss.comment}
                        </p>
                      )}
                    </div>
                  );
                })}
              </dl>
            </div>

            {/* 잘된 점 */}
            {entry.highlights.length > 0 && (
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-green-700 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" aria-hidden="true" />
                  잘된 점 ({entry.highlights.length}개)
                </p>
                <ul
                  className="space-y-0.5"
                  aria-label={`잘된 점 ${entry.highlights.length}개`}
                >
                  {entry.highlights.map((item, i) => (
                    <li
                      key={i}
                      className="text-[11px] text-muted-foreground bg-green-50 border border-green-100 rounded px-2 py-1 leading-relaxed"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 개선할 점 */}
            {entry.improvements.length > 0 && (
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-red-700 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" aria-hidden="true" />
                  개선할 점 ({entry.improvements.length}개)
                </p>
                <ul
                  className="space-y-0.5"
                  aria-label={`개선할 점 ${entry.improvements.length}개`}
                >
                  {entry.improvements.map((item, i) => (
                    <li
                      key={i}
                      className="text-[11px] text-muted-foreground bg-red-50 border border-red-100 rounded px-2 py-1 leading-relaxed"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 다음 공연 제안 */}
            {entry.nextSuggestions.length > 0 && (
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-blue-700 flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" aria-hidden="true" />
                  다음 공연 제안 ({entry.nextSuggestions.length}개)
                </p>
                <ul
                  className="space-y-0.5"
                  aria-label={`다음 공연 제안 ${entry.nextSuggestions.length}개`}
                >
                  {entry.nextSuggestions.map((item, i) => (
                    <li
                      key={i}
                      className="text-[11px] text-muted-foreground bg-blue-50 border border-blue-100 rounded px-2 py-1 leading-relaxed"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 관객 수 / 매출 */}
            {(entry.audienceCount !== undefined ||
              entry.revenue !== undefined) && (
              <dl className="flex items-center gap-4">
                {entry.audienceCount !== undefined &&
                  entry.audienceCount > 0 && (
                    <div className="flex items-center gap-1">
                      <Users
                        className="h-3 w-3 text-blue-500"
                        aria-hidden="true"
                      />
                      <dt className="sr-only">관객 수</dt>
                      <dd className="text-[11px] text-muted-foreground">
                        관객 수:{" "}
                        <span className="font-medium text-blue-600">
                          {entry.audienceCount.toLocaleString()}명
                        </span>
                      </dd>
                    </div>
                  )}
                {entry.revenue !== undefined && entry.revenue > 0 && (
                  <div className="flex items-center gap-1">
                    <DollarSign
                      className="h-3 w-3 text-green-500"
                      aria-hidden="true"
                    />
                    <dt className="sr-only">매출</dt>
                    <dd className="text-[11px] text-muted-foreground">
                      매출:{" "}
                      <span className="font-medium text-green-600">
                        {formatRevenue(entry.revenue)}
                      </span>
                    </dd>
                  </div>
                )}
              </dl>
            )}

            {/* 비고 */}
            {entry.notes && (
              <p className="text-[11px] text-muted-foreground italic">
                비고: {entry.notes}
              </p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
});

ReportEntryRow.displayName = "ReportEntryRow";
