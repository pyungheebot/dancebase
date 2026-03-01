"use client";

// ============================================
// 회의록 목록 항목 컴포넌트 (React.memo 적용)
// ============================================

import { memo, useState } from "react";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { formatYearMonthDay } from "@/lib/date-utils";
import type { MeetingMinutesEntry } from "@/types";
import { TypeBadge } from "./type-badge";
import { MinutesDetail } from "./minutes-detail";

type MinutesItemProps = {
  entry: MeetingMinutesEntry;
  onDelete: (id: string) => void;
};

export const MinutesItem = memo(function MinutesItem({
  entry,
  onDelete,
}: MinutesItemProps) {
  const [open, setOpen] = useState(false);

  // 전체 실행과제 수 계산
  const totalActions = entry.agendaItems.reduce(
    (s, a) => s + a.actionItems.length,
    0
  );

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="bg-muted/30 rounded-md overflow-hidden">
        {/* 항목 헤더 - 클릭 시 상세 펼침 */}
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center gap-1.5 px-2.5 py-2 text-left hover:bg-muted/50 transition-colors"
            aria-expanded={open}
            aria-label={`${entry.title} 상세 ${open ? "접기" : "펼치기"}`}
          >
            {open ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
            )}

            {/* 회의 날짜 */}
            <span className="text-[10px] text-muted-foreground shrink-0 font-mono w-[72px]">
              {formatYearMonthDay(entry.date)}
            </span>

            {/* 회의 제목 */}
            <span className="text-xs font-medium flex-1 truncate">
              {entry.title}
            </span>

            {/* 유형 배지 */}
            <TypeBadge type={entry.type} />

            {/* 참석 인원 */}
            <span className="text-[9px] text-muted-foreground shrink-0">
              {entry.attendees.length}명
            </span>

            {/* 안건 수 */}
            {entry.agendaItems.length > 0 && (
              <span className="text-[9px] text-muted-foreground shrink-0">
                안건 {entry.agendaItems.length}
              </span>
            )}

            {/* 실행과제 수 */}
            {totalActions > 0 && (
              <span className="text-[9px] px-1 py-0 rounded bg-orange-100 text-orange-700 shrink-0">
                과제 {totalActions}
              </span>
            )}

            {/* 삭제 버튼 */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(entry.id);
              }}
              className="shrink-0 ml-0.5"
              aria-label={`${entry.title} 회의록 삭제`}
            >
              <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500 transition-colors" />
            </button>
          </button>
        </CollapsibleTrigger>

        {/* 상세 내용 (펼침 시 표시) */}
        <CollapsibleContent>
          <div className="px-2.5 pb-2.5 border-t border-border/30">
            <MinutesDetail entry={entry} />
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
});
