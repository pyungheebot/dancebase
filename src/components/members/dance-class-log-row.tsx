"use client";

// ============================================================
// 댄스 수업 수강 기록 - 수업 행 아이템 (React.memo 최적화)
// ============================================================

import { memo } from "react";
import { User, Calendar, Clock, Tag, BookOpen, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CLASS_LOG_LEVEL_LABELS,
  CLASS_LOG_LEVEL_COLORS,
  CLASS_LOG_SOURCE_LABELS,
  CLASS_LOG_SOURCE_COLORS,
} from "@/hooks/use-dance-class-log";
import type { DanceClassLogEntry } from "@/types";
import { formatYearMonthDay } from "@/lib/date-utils";
import { formatDuration } from "./dance-class-log-types";
import { StarRating } from "./dance-class-log-star-rating";

interface ClassLogRowProps {
  entry: DanceClassLogEntry;
  onEdit: () => void;
  onDelete: () => void;
}

// React.memo - 다른 항목 편집 시 불필요한 리렌더 방지
export const ClassLogRow = memo(function ClassLogRow({
  entry,
  onEdit,
  onDelete,
}: ClassLogRowProps) {
  const levelColors = CLASS_LOG_LEVEL_COLORS[entry.level];
  const sourceColors = CLASS_LOG_SOURCE_COLORS[entry.source];
  const duration = formatDuration(entry.durationMin);

  return (
    <div
      className="rounded-lg border bg-background hover:bg-muted/20 transition-colors p-3 space-y-2"
      role="listitem"
      aria-label={`${entry.className} 수업 기록`}
    >
      {/* 헤더 행: 수업명, 배지, 편집/삭제 버튼 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="text-xs font-semibold truncate">{entry.className}</span>
          {/* 레벨 배지 */}
          <Badge
            className={`text-[10px] px-1.5 py-0 border shrink-0 ${levelColors.badge}`}
          >
            {CLASS_LOG_LEVEL_LABELS[entry.level]}
          </Badge>
          {/* 출처 배지 */}
          <Badge
            className={`text-[10px] px-1.5 py-0 border shrink-0 ${sourceColors.badge}`}
          >
            {CLASS_LOG_SOURCE_LABELS[entry.source]}
          </Badge>
          {/* 장르 배지 */}
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
            {entry.genre}
          </Badge>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
            onClick={onEdit}
            aria-label={`${entry.className} 수업 편집`}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
            aria-label={`${entry.className} 수업 삭제`}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 메타 정보: 강사, 날짜, 시간, 별점 */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <User className="h-3 w-3" aria-hidden="true" />
          {entry.instructor}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Calendar className="h-3 w-3" aria-hidden="true" />
          {formatYearMonthDay(entry.date)}
          {entry.startTime && (
            <span className="ml-0.5">{entry.startTime}</span>
          )}
        </span>
        {duration && (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {duration}
          </span>
        )}
        <StarRating value={entry.selfRating} readOnly size="sm" />
      </div>

      {/* 내용 요약 (선택 필드) */}
      {entry.summary && (
        <p className="text-[11px] text-foreground/80 bg-muted/40 rounded px-2 py-1 leading-relaxed">
          <BookOpen className="h-2.5 w-2.5 inline mr-1 text-muted-foreground" aria-hidden="true" />
          {entry.summary}
        </p>
      )}

      {/* 배운 기술 태그 목록 */}
      {entry.skills.length > 0 && (
        <div className="flex flex-wrap items-center gap-1" role="list" aria-label="배운 기술">
          <Tag className="h-2.5 w-2.5 text-muted-foreground shrink-0" aria-hidden="true" />
          {entry.skills.map((skill) => (
            <span
              key={skill}
              role="listitem"
              className="text-[10px] px-1.5 py-0.5 rounded bg-teal-100/60 text-teal-700 border border-teal-200"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* 추가 메모 (선택 필드) */}
      {entry.notes && (
        <p className="text-[11px] text-muted-foreground bg-muted/30 rounded px-2 py-1 leading-relaxed">
          {entry.notes}
        </p>
      )}
    </div>
  );
});
