"use client";

import { memo, useState } from "react";
import { CalendarIcon, ChevronDown, ChevronRight, Plus, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatYearMonthDay } from "@/lib/date-utils";
import { SessionAggregateView } from "./session-aggregate-view";
import type { PracticeFeedbackSession, PracticeFeedbackAggregate } from "@/types";

type SessionItemProps = {
  session: PracticeFeedbackSession;
  aggregate: PracticeFeedbackAggregate;
  onDeleteSession: (id: string) => void;
  onOpenFeedbackForm: (sessionId: string) => void;
};

export const SessionItem = memo(function SessionItem({
  session,
  aggregate,
  onDeleteSession,
  onOpenFeedbackForm,
}: SessionItemProps) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = `session-details-${session.id}`;

  return (
    <div className="border border-border/60 rounded-md overflow-hidden">
      {/* 세션 헤더 */}
      <button
        type="button"
        className="w-full flex items-center gap-2 px-2.5 py-2 text-left hover:bg-muted/20 transition-colors"
        onClick={() => setExpanded((p) => !p)}
        aria-expanded={expanded}
        aria-controls={detailsId}
      >
        <CalendarIcon className="h-3 w-3 text-muted-foreground shrink-0" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">
            {session.title || formatYearMonthDay(session.practiceDate)}
          </p>
          {session.title && (
            <p className="text-[9px] text-muted-foreground">
              <time dateTime={session.practiceDate}>
                {formatYearMonthDay(session.practiceDate)}
              </time>
            </p>
          )}
        </div>

        {aggregate.totalResponses > 0 && (
          <div className="flex items-center gap-1 shrink-0" aria-label={`평균 ${aggregate.averageOverall.toFixed(1)}점`}>
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" aria-hidden="true" />
            <span className="text-[10px] font-semibold">
              {aggregate.averageOverall.toFixed(1)}
            </span>
          </div>
        )}

        <Badge
          className={cn(
            "text-[9px] px-1.5 py-0 shrink-0",
            aggregate.totalResponses > 0
              ? "bg-indigo-100 text-indigo-700 border-indigo-200"
              : "bg-muted text-muted-foreground"
          )}
        >
          <span aria-label={`${aggregate.totalResponses}명 참여`}>
            {aggregate.totalResponses}명
          </span>
        </Badge>

        {expanded ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" aria-hidden="true" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" aria-hidden="true" />
        )}
      </button>

      {/* 세션 상세 */}
      {expanded && (
        <div
          id={detailsId}
          className="px-2.5 pb-2.5 space-y-2 border-t border-border/40 pt-2"
        >
          {aggregate.totalResponses > 0 ? (
            <SessionAggregateView aggregate={aggregate} />
          ) : (
            <p className="text-[10px] text-muted-foreground text-center py-2" role="alert">
              아직 피드백이 없습니다
            </p>
          )}

          {/* 액션 버튼 */}
          <div className="flex gap-1.5" role="group" aria-label="세션 액션">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-6 text-[10px] flex-1 gap-1"
              onClick={() => onOpenFeedbackForm(session.id)}
            >
              <Plus className="h-3 w-3" aria-hidden="true" />
              피드백 제출
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => onDeleteSession(session.id)}
              aria-label={`${session.title || formatYearMonthDay(session.practiceDate)} 세션 삭제`}
            >
              <Trash2 className="h-3 w-3" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});
