"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import type { SafetyCheckItem } from "@/types";
import { CATEGORY_ICONS } from "./types";
import { ItemStatusBadge } from "./status-badge";

// ============================================================
// 점검 항목 행 (React.memo로 불필요한 리렌더링 방지)
// ============================================================

interface CheckItemRowProps {
  item: SafetyCheckItem;
  onStatusChange: (status: SafetyCheckItem["status"]) => void;
  onRemove: () => void;
}

export const CheckItemRow = React.memo(function CheckItemRow({
  item,
  onStatusChange,
  onRemove,
}: CheckItemRowProps) {
  const Icon = CATEGORY_ICONS[item.category];

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Delete" || e.key === "Backspace") {
      onRemove();
    }
  }

  return (
    <div
      role="listitem"
      className="flex items-start gap-2 rounded-md border border-border bg-background p-2"
    >
      <Icon
        className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0"
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium leading-snug truncate">
          {item.description}
        </p>
        {item.notes && (
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
            {item.notes}
          </p>
        )}
        {item.inspectorName && (
          <p className="text-[10px] text-muted-foreground">
            점검자: {item.inspectorName}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Select
          value={item.status}
          onValueChange={(v) => onStatusChange(v as SafetyCheckItem["status"])}
        >
          <SelectTrigger
            className="h-6 w-24 text-[10px] px-1.5 border-0 bg-transparent focus:ring-0"
            aria-label={`${item.description} 상태 변경`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pass" className="text-xs">
              통과
            </SelectItem>
            <SelectItem value="fail" className="text-xs">
              실패
            </SelectItem>
            <SelectItem value="pending" className="text-xs">
              보류
            </SelectItem>
            <SelectItem value="na" className="text-xs">
              해당없음
            </SelectItem>
          </SelectContent>
        </Select>
        <ItemStatusBadge status={item.status} />
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
          onKeyDown={handleKeyDown}
          aria-label={`${item.description} 항목 삭제`}
        >
          <Trash2 className="h-3 w-3" aria-hidden="true" />
          <span className="sr-only">항목 삭제</span>
        </Button>
      </div>
    </div>
  );
});
