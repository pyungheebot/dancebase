"use client";

import React from "react";
import { Pencil, Trash2, Music, ThumbsUp, ThumbsDown, User, Calendar, Banknote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
} from "@/hooks/use-dance-class-review";
import { StarRating } from "./star-rating";
import type { ReviewRowProps } from "./types";

// ============================================================
// 리뷰 행 컴포넌트 (React.memo 적용)
// ============================================================

export const ReviewRow = React.memo(function ReviewRow({
  review,
  onEdit,
  onDelete,
  formatYearMonthDay,
  formatCost,
}: ReviewRowProps) {
  const colors = DIFFICULTY_COLORS[review.difficulty];
  const costStr = formatCost(review.cost);

  return (
    <article
      className="rounded-lg border bg-background hover:bg-muted/20 transition-colors p-3 space-y-2"
      aria-label={`${review.className} 수업 평가`}
    >
      {/* 헤더 행 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="text-xs font-semibold truncate">{review.className}</span>
          <Badge
            className={`text-[10px] px-1.5 py-0 border shrink-0 ${colors.badge}`}
            aria-label={`난이도: ${DIFFICULTY_LABELS[review.difficulty]}`}
          >
            {DIFFICULTY_LABELS[review.difficulty]}
          </Badge>
          {review.genre && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
              <Music className="h-2.5 w-2.5 mr-0.5" aria-hidden="true" />
              <span aria-label={`장르: ${review.genre}`}>{review.genre}</span>
            </Badge>
          )}
          {review.wouldRepeat ? (
            <span
              className="flex items-center gap-0.5 text-[10px] text-emerald-600 font-medium shrink-0"
              aria-label="재수강 의향 있음"
            >
              <ThumbsUp className="h-3 w-3" aria-hidden="true" />
              재수강
            </span>
          ) : (
            <span
              className="flex items-center gap-0.5 text-[10px] text-muted-foreground shrink-0"
              aria-label="재수강 의향 없음"
            >
              <ThumbsDown className="h-3 w-3" aria-hidden="true" />
              재수강 안함
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
            onClick={onEdit}
            aria-label={`${review.className} 평가 수정`}
          >
            <Pencil className="h-3 w-3" aria-hidden="true" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
            aria-label={`${review.className} 평가 삭제`}
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* 메타 정보 */}
      <dl className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <dt className="sr-only">별점</dt>
        <dd>
          <StarRating value={review.rating} readOnly size="sm" />
        </dd>
        {review.instructorName && (
          <>
            <dt className="sr-only">강사</dt>
            <dd className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <User className="h-3 w-3" aria-hidden="true" />
              {review.instructorName}
            </dd>
          </>
        )}
        <dt className="sr-only">수강 날짜</dt>
        <dd className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Calendar className="h-3 w-3" aria-hidden="true" />
          <time dateTime={review.date}>{formatYearMonthDay(review.date)}</time>
        </dd>
        {costStr && (
          <>
            <dt className="sr-only">수업료</dt>
            <dd className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Banknote className="h-3 w-3" aria-hidden="true" />
              {costStr}
            </dd>
          </>
        )}
      </dl>

      {/* 배운 점 */}
      {review.takeaways && (
        <p className="text-[11px] text-muted-foreground bg-muted/40 rounded px-2 py-1 leading-relaxed">
          {review.takeaways}
        </p>
      )}
    </article>
  );
});

ReviewRow.displayName = "ReviewRow";
