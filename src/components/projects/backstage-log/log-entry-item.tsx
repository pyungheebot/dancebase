"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import type { BackstageLogEntry } from "@/types";
import { CATEGORY_CONFIG, formatTime } from "./types";

// ============================================================
// 로그 항목 아이템 (React.memo)
// ============================================================

type LogEntryItemProps = {
  entry: BackstageLogEntry;
  sessionId: string;
  onResolve: (entryId: string) => void;
  onDelete: (sessionId: string, entryId: string) => void;
};

export const LogEntryItem = React.memo(function LogEntryItem({
  entry,
  sessionId,
  onResolve,
  onDelete,
}: LogEntryItemProps) {
  const cfg = CATEGORY_CONFIG[entry.category];

  return (
    <li
      className={`flex gap-2 p-2 rounded-md border text-xs ${
        entry.isResolved
          ? "opacity-50 bg-gray-50"
          : entry.category === "emergency"
          ? "bg-red-50 border-red-200"
          : "bg-card"
      }`}
      role="listitem"
      aria-label={`${cfg.label} - ${entry.senderName}: ${entry.message}`}
    >
      {/* 왼쪽: 카테고리 아이콘 */}
      <div
        className="flex flex-col items-center shrink-0 mt-0.5"
        aria-hidden="true"
      >
        <span
          className={`inline-flex items-center justify-center h-4 w-4 rounded-full border ${cfg.badgeClass}`}
          title={cfg.label}
        >
          {cfg.icon}
        </span>
      </div>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-medium text-[11px]">{entry.senderName}</span>
          <Badge
            variant="outline"
            className={`text-[10px] px-1 py-0 ${cfg.badgeClass}`}
          >
            {cfg.label}
          </Badge>
          <time
            dateTime={entry.timestamp}
            className="text-[10px] text-gray-400 flex items-center gap-0.5"
          >
            <Clock className="h-2.5 w-2.5" aria-hidden="true" />
            {formatTime(entry.timestamp)}
          </time>
        </div>
        <p className="mt-0.5 text-[11px] text-gray-700 break-words">
          {entry.message}
        </p>
        {entry.isResolved && entry.resolvedBy && (
          <p className="mt-0.5 text-[10px] text-green-600 flex items-center gap-0.5">
            <CheckCircle2 className="h-2.5 w-2.5" aria-hidden="true" />
            <span className="sr-only">처리자:</span>
            {entry.resolvedBy} 처리
          </p>
        )}
      </div>

      {/* 액션 */}
      {!entry.isResolved ? (
        <div className="flex flex-col gap-1 shrink-0" role="group" aria-label="항목 액션">
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0 text-green-500 hover:text-green-700"
            aria-label="해결 처리"
            onClick={() => onResolve(entry.id)}
          >
            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0 text-gray-400 hover:text-red-500"
            aria-label="항목 삭제"
            onClick={() => {
              onDelete(sessionId, entry.id);
              toast.success(TOAST.BACKSTAGE_LOG.ITEM_DELETED);
            }}
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          className="h-5 w-5 p-0 text-gray-400 hover:text-red-500 shrink-0 self-start"
          aria-label="항목 삭제"
          onClick={() => {
            onDelete(sessionId, entry.id);
            toast.success(TOAST.BACKSTAGE_LOG.ITEM_DELETED);
          }}
        >
          <Trash2 className="h-3 w-3" aria-hidden="true" />
        </Button>
      )}
    </li>
  );
});
