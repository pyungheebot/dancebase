"use client";

import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Circle,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
} from "lucide-react";
import type {
  SafetyChecklistItem,
  SafetyChecklistStatus,
} from "@/types";
import {
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
} from "./types";

// ============================================================
// Props
// ============================================================

export interface ItemRowProps {
  item: SafetyChecklistItem;
  onStatusChange: (itemId: string, status: SafetyChecklistStatus) => void;
  onEdit: (item: SafetyChecklistItem) => void;
  onDelete: (itemId: string) => void;
}

// ============================================================
// 상태 순환 순서
// ============================================================

const NEXT_STATUS: Record<SafetyChecklistStatus, SafetyChecklistStatus> = {
  pending: "checked",
  checked: "issue",
  issue: "pending",
};

const STATUS_ICONS: Record<SafetyChecklistStatus, React.ReactNode> = {
  pending: <Circle className="h-4 w-4 text-gray-400" aria-hidden="true" />,
  checked: <CheckCircle2 className="h-4 w-4 text-green-500" aria-hidden="true" />,
  issue: <XCircle className="h-4 w-4 text-red-500" aria-hidden="true" />,
};

// ============================================================
// 컴포넌트 (React.memo)
// ============================================================

export const ItemRow = memo(function ItemRow({
  item,
  onStatusChange,
  onEdit,
  onDelete,
}: ItemRowProps) {
  const nextStatus = NEXT_STATUS[item.status];
  const rowBg =
    item.status === "checked"
      ? "bg-green-50 border-green-100"
      : item.status === "issue"
      ? "bg-red-50 border-red-100"
      : "bg-card border-gray-100";

  const handleStatusKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onStatusChange(item.id, nextStatus);
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onEdit(item);
    }
  };

  const handleDeleteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onDelete(item.id);
    }
  };

  const checkedTimeLabel =
    item.checkedAt
      ? new Date(item.checkedAt).toLocaleString("ko-KR", {
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  return (
    <div
      role="listitem"
      className={`flex items-start gap-2 p-2 rounded-lg border text-xs transition-colors ${rowBg}`}
      aria-label={`${item.content}, 상태: ${STATUS_LABELS[item.status]}, 우선순위: ${PRIORITY_LABELS[item.priority]}`}
    >
      {/* 상태 토글 버튼 */}
      <button
        type="button"
        onClick={() => onStatusChange(item.id, nextStatus)}
        onKeyDown={handleStatusKeyDown}
        className="mt-0.5 flex-shrink-0 hover:opacity-70 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        aria-label={`상태 변경: ${STATUS_LABELS[item.status]} → ${STATUS_LABELS[nextStatus]}`}
        aria-pressed={item.status === "checked"}
      >
        {STATUS_ICONS[item.status]}
      </button>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`font-medium ${
              item.status === "checked" ? "line-through text-gray-400" : ""
            }`}
            aria-hidden={item.status === "checked" ? "true" : undefined}
          >
            {item.content}
          </span>
          {item.status === "checked" && (
            <span className="sr-only">{item.content} (확인 완료)</span>
          )}
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${PRIORITY_COLORS[item.priority]}`}
            aria-label={`우선순위: ${PRIORITY_LABELS[item.priority]}`}
          >
            {PRIORITY_LABELS[item.priority]}
          </Badge>
        </div>

        <dl className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500 flex-wrap">
          {item.assignee && (
            <div className="flex items-center gap-0.5">
              <dt className="sr-only">담당자</dt>
              <dd>담당: {item.assignee}</dd>
            </div>
          )}
          {checkedTimeLabel && (
            <div>
              <dt className="sr-only">
                {item.status === "checked" ? "확인 시각" : "처리 시각"}
              </dt>
              <dd>
                {item.status === "checked" ? "확인" : "처리"}:{" "}
                <time dateTime={item.checkedAt}>{checkedTimeLabel}</time>
              </dd>
            </div>
          )}
          {item.notes && (
            <div className="min-w-0">
              <dt className="sr-only">비고</dt>
              <dd className="text-gray-400 italic truncate max-w-[200px]">
                {item.notes}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* 상태 배지 */}
      <Badge
        variant="outline"
        className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${STATUS_COLORS[item.status]}`}
        aria-hidden="true"
      >
        {STATUS_LABELS[item.status]}
      </Badge>

      {/* 편집/삭제 버튼 */}
      <div
        className="flex items-center gap-0.5 flex-shrink-0"
        role="group"
        aria-label={`${item.content} 항목 관리`}
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => onEdit(item)}
          onKeyDown={handleEditKeyDown}
          aria-label={`${item.content} 수정`}
        >
          <Pencil className="h-3 w-3" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
          onClick={() => onDelete(item.id)}
          onKeyDown={handleDeleteKeyDown}
          aria-label={`${item.content} 삭제`}
        >
          <Trash2 className="h-3 w-3" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
});
