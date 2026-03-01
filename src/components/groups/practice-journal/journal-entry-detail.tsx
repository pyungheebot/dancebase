"use client";

import { Music, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatYearMonthDay } from "@/lib/date-utils";
import type { GroupPracticeJournalEntry } from "@/types";

// ============================================
// 일지 항목 상세 뷰
// ============================================

export function JournalEntryDetail({
  entry,
}: {
  entry: GroupPracticeJournalEntry;
}) {
  return (
    <div
      className="space-y-2.5 pt-2 border-t border-border/40"
      role="region"
      aria-label="연습 일지 상세"
    >
      {/* 연습 내용 요약 */}
      {entry.contentSummary && (
        <div>
          <p
            id="content-summary-label"
            className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1"
          >
            연습 내용
          </p>
          <p
            className="text-xs text-foreground/80 leading-relaxed whitespace-pre-line"
            aria-labelledby="content-summary-label"
          >
            {entry.contentSummary}
          </p>
        </div>
      )}

      {/* 진행 곡/안무 */}
      {entry.songs.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
            <Music className="h-3 w-3" aria-hidden="true" />
            진행 곡/안무
          </p>
          <ul className="flex flex-wrap gap-1" aria-label="진행 곡/안무 목록">
            {entry.songs.map((song, i) => (
              <li key={i}>
                <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 border-purple-200">
                  {song}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 달성 목표 */}
      {entry.achievedGoals.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
            <CheckCircle2
              className="h-3 w-3 text-green-500"
              aria-hidden="true"
            />
            달성 목표
          </p>
          <ul className="space-y-0.5" aria-label="달성 목표 목록">
            {entry.achievedGoals.map((goal, i) => (
              <li
                key={i}
                className="text-[10px] text-foreground/80 flex items-start gap-1 pl-1"
              >
                <span className="text-green-500 mt-0.5 shrink-0" aria-hidden="true">
                  ✓
                </span>
                {goal}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 미달성 사항 */}
      {entry.unachievedItems.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
            <XCircle
              className="h-3 w-3 text-orange-500"
              aria-hidden="true"
            />
            미달성 사항
          </p>
          <ul className="space-y-0.5" aria-label="미달성 사항 목록">
            {entry.unachievedItems.map((item, i) => (
              <li
                key={i}
                className="text-[10px] text-foreground/80 flex items-start gap-1 pl-1"
              >
                <span className="text-orange-400 mt-0.5 shrink-0" aria-hidden="true">
                  △
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 다음 연습 계획 */}
      {entry.nextPlanNote && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
            <ArrowRight
              className="h-3 w-3 text-blue-500"
              aria-hidden="true"
            />
            다음 연습 계획
          </p>
          <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-line pl-1 border-l-2 border-blue-200">
            {entry.nextPlanNote}
          </p>
        </div>
      )}

      {/* 작성자 */}
      <p className="text-[9px] text-muted-foreground text-right">
        <span className="sr-only">작성자:</span>
        작성: {entry.authorName} &middot;{" "}
        <time dateTime={entry.createdAt}>{formatYearMonthDay(entry.createdAt)}</time>
      </p>
    </div>
  );
}
