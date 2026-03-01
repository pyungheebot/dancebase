"use client";

// ============================================================
// 무대 메모 카드 — 보드 목록 아이템 (React.memo)
// ============================================================

import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2 } from "lucide-react";
import type { StageMemoBoard } from "@/types";

interface BoardListItemProps {
  board: StageMemoBoard;
  onOpen: () => void;
  onDelete: () => void;
}

export const BoardListItem = memo(function BoardListItem({
  board,
  onOpen,
  onDelete,
}: BoardListItemProps) {
  const unresolvedCount = board.notes.filter((n) => !n.isResolved).length;
  const highCount = board.notes.filter(
    (n) => n.priority === "high" && !n.isResolved
  ).length;

  const summaryText = [
    `메모 ${board.notes.length}개`,
    unresolvedCount > 0 ? `미해결 ${unresolvedCount}개` : "",
    highCount > 0 ? `고우선 ${highCount}개` : "",
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <article
      className="border border-border/50 rounded-lg p-3 bg-background hover:border-rose-300 transition-colors group"
      aria-label={`보드: ${board.title}, ${summaryText}`}
    >
      <div className="flex items-start justify-between gap-2">
        {/* 보드 정보 (클릭 영역) */}
        <button
          type="button"
          className="flex-1 min-w-0 text-left cursor-pointer"
          onClick={onOpen}
          aria-label={`${board.title} 보드 열기`}
        >
          <p className="text-xs font-medium truncate">{board.title}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5" aria-live="polite">
            메모 {board.notes.length}개
            {unresolvedCount > 0 && ` · 미해결 ${unresolvedCount}개`}
          </p>
        </button>

        {/* 배지 & 삭제 */}
        <div className="flex items-center gap-1 shrink-0" role="group" aria-label="보드 상태">
          {highCount > 0 && (
            <Badge
              className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700 gap-0.5"
              aria-label={`고우선순위 미해결 ${highCount}개`}
            >
              <AlertTriangle className="h-2.5 w-2.5" aria-hidden="true" />
              {highCount}
            </Badge>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-1 opacity-0 group-hover:opacity-100 transition-opacity focus-visible:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label={`${board.title} 보드 삭제`}
          >
            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </article>
  );
});
