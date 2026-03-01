"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  CalendarIcon,
  Clock,
  Users,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatYearMonthDay } from "@/lib/date-utils";
import type { GroupPracticeJournalEntry } from "@/types";
import { formatDuration } from "./types";
import { JournalEntryDetail } from "./journal-entry-detail";

// ============================================
// 일지 항목 (접이식) — React.memo로 최적화
// ============================================

type JournalEntryItemProps = {
  entry: GroupPracticeJournalEntry;
  onDelete: (id: string) => void;
  onEdit: (entry: GroupPracticeJournalEntry) => void;
};

export const JournalEntryItem = React.memo(function JournalEntryItem({
  entry,
  onDelete,
  onEdit,
}: JournalEntryItemProps) {
  const [expanded, setExpanded] = useState(false);

  const toggleId = `journal-entry-${entry.id}`;
  const detailId = `journal-detail-${entry.id}`;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setExpanded((p) => !p);
    }
  };

  return (
    <div className="border border-border/60 rounded-md overflow-hidden">
      {/* 항목 헤더 */}
      <button
        id={toggleId}
        type="button"
        className="w-full flex items-center gap-2 px-2.5 py-2 text-left hover:bg-muted/20 transition-colors"
        onClick={() => setExpanded((p) => !p)}
        onKeyDown={handleKeyDown}
        aria-expanded={expanded}
        aria-controls={detailId}
        aria-label={`${formatYearMonthDay(entry.date)} 연습 일지 ${expanded ? "접기" : "펼치기"}`}
      >
        <CalendarIcon className="h-3 w-3 text-muted-foreground shrink-0" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">
            <time dateTime={entry.date}>{formatYearMonthDay(entry.date)}</time>
          </p>
          <p className="text-[9px] text-muted-foreground line-clamp-1">
            {entry.contentSummary || "내용 없음"}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0" aria-hidden="true">
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDuration(entry.durationMinutes)}
          </span>
          <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <Users className="h-3 w-3" />
            {entry.participants.length}명
          </span>
        </div>

        {expanded ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" aria-hidden="true" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" aria-hidden="true" />
        )}
      </button>

      {/* 항목 상세 */}
      <div
        id={detailId}
        role="region"
        aria-labelledby={toggleId}
        aria-live="polite"
        hidden={!expanded}
      >
        {expanded && (
          <div className="px-2.5 pb-2.5">
            {/* 참여 멤버 */}
            {entry.participants.length > 0 && (
              <ul
                className="flex flex-wrap gap-1 pt-2 pb-2"
                aria-label="참여 멤버 목록"
              >
                {entry.participants.map((name, i) => (
                  <li key={i}>
                    <Badge className="text-[10px] px-1.5 py-0 bg-cyan-100 text-cyan-700 border-cyan-200">
                      {name}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}

            <JournalEntryDetail entry={entry} />

            {/* 액션 버튼 */}
            <div className="flex gap-1.5 mt-2.5" role="group" aria-label="일지 액션">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-6 text-[10px] flex-1 gap-1"
                onClick={() => onEdit(entry)}
                aria-label={`${formatYearMonthDay(entry.date)} 일지 수정`}
              >
                <Pencil className="h-3 w-3" aria-hidden="true" />
                수정
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => onDelete(entry.id)}
                aria-label={`${formatYearMonthDay(entry.date)} 일지 삭제`}
              >
                <Trash2 className="h-3 w-3" aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
