"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FITNESS_CATEGORY_COLORS } from "@/hooks/use-fitness-test";
import type { TestItemRowProps } from "./types";

/**
 * 항목 관리 탭 - 개별 테스트 항목 행
 * React.memo로 감싸 불필요한 리렌더링을 방지합니다.
 */
export const TestItemRow = React.memo(function TestItemRow({
  item,
  onDelete,
}: TestItemRowProps) {
  const colors = FITNESS_CATEGORY_COLORS[item.category];
  const directionLabel = item.higherIsBetter ? "높을수록 좋음" : "낮을수록 좋음";
  const directionId = `item-direction-${item.name.replace(/\s+/g, "-")}`;

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onDelete();
    }
  }

  return (
    <div
      role="listitem"
      className="flex items-center justify-between rounded-md border bg-background px-3 py-2 gap-2"
    >
      <div className="flex items-center gap-2 min-w-0">
        <p className="text-xs font-medium truncate" id={directionId}>
          {item.name}
        </p>
        <dl className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <dt className="sr-only">단위</dt>
            <dd className="text-[10px] text-muted-foreground shrink-0">
              단위: {item.unit}
            </dd>
          </div>
          <div className="flex items-center gap-1">
            <dt className="sr-only">방향</dt>
            <dd
              className={`text-[9px] shrink-0 ${
                item.higherIsBetter ? "text-green-600" : "text-orange-600"
              }`}
            >
              {directionLabel}
            </dd>
          </div>
        </dl>
      </div>
      <Button
        size="sm"
        variant="ghost"
        aria-label={`${item.name} 항목 삭제`}
        aria-describedby={directionId}
        className={`h-6 w-6 p-0 shrink-0 ${colors.text} hover:text-destructive`}
        onClick={onDelete}
        onKeyDown={handleKeyDown}
      >
        <Trash2 className="h-3 w-3" aria-hidden="true" />
      </Button>
    </div>
  );
});
