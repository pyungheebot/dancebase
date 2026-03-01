"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Pencil,
  CheckCircle2,
  Circle,
  X,
} from "lucide-react";
import type { PerformanceFeeEntry } from "@/types";
import { ROLE_LABELS, ROLE_COLORS, formatKRW } from "./types";

// ============================================================
// 멤버 행 컴포넌트 (React.memo로 불필요한 리렌더 방지)
// ============================================================

export const EntryRow = React.memo(function EntryRow({
  entry,
  onEdit,
  onDelete,
  onToggleSettle,
  onAddAdj,
  onDeleteAdj,
}: {
  entry: PerformanceFeeEntry;
  onEdit: () => void;
  onDelete: () => void;
  onToggleSettle: () => void;
  onAddAdj: () => void;
  onDeleteAdj: (adjId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isSettled = entry.status === "settled";

  const allowances = entry.adjustments.filter((a) => a.amount > 0);
  const deductions = entry.adjustments.filter((a) => a.amount < 0);

  const detailPanelId = `entry-row-detail-${entry.id}`;
  const settleButtonLabel = isSettled
    ? "정산 완료 (클릭 시 취소)"
    : "미정산 (클릭 시 완료 처리)";

  return (
    <div className="border rounded-md overflow-hidden" role="listitem">
      {/* 헤더 행 */}
      <div className="flex items-center gap-2 px-3 py-2 bg-background">
        {/* 정산 상태 아이콘 */}
        <button
          type="button"
          onClick={onToggleSettle}
          className="flex-shrink-0"
          aria-label={settleButtonLabel}
          aria-pressed={isSettled}
          title={settleButtonLabel}
        >
          {isSettled ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" aria-hidden="true" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          )}
        </button>

        {/* 이름 & 역할 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-xs font-medium truncate ${
                isSettled ? "line-through text-muted-foreground" : ""
              }`}
            >
              {entry.memberName}
            </span>
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 ${ROLE_COLORS[entry.role]}`}
            >
              {ROLE_LABELS[entry.role]}
            </Badge>
            {isSettled && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 bg-green-50 text-green-700 border-green-200"
                role="status"
              >
                정산완료
              </Badge>
            )}
          </div>
          <div
            className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1.5"
            aria-label={`기본 출연료 ${formatKRW(entry.baseFee)}${entry.adjustments.length > 0 ? `, 최종 ${formatKRW(entry.finalAmount)}` : ""}`}
          >
            <span>기본 {formatKRW(entry.baseFee)}</span>
            {entry.adjustments.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span
                  className={
                    entry.finalAmount >= entry.baseFee
                      ? "text-blue-600"
                      : "text-red-500"
                  }
                >
                  최종 {formatKRW(entry.finalAmount)}
                </span>
              </>
            )}
            {entry.settledAt && (
              <>
                <span aria-hidden="true">·</span>
                <time dateTime={entry.settledAt}>{entry.settledAt} 정산</time>
              </>
            )}
          </div>
        </div>

        {/* 최종 금액 */}
        <span
          className="text-xs font-semibold flex-shrink-0 tabular-nums"
          aria-label={`최종 정산 금액 ${formatKRW(entry.finalAmount)}`}
        >
          {formatKRW(entry.finalAmount)}
        </span>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-1 flex-shrink-0" role="toolbar" aria-label={`${entry.memberName} 액션`}>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-controls={detailPanelId}
            aria-label={expanded ? "상세 접기" : "상세 보기"}
            title={expanded ? "상세 접기" : "상세 보기"}
          >
            {expanded ? (
              <ChevronUp className="h-3 w-3" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onEdit}
            aria-label={`${entry.memberName} 수정`}
            title="수정"
          >
            <Pencil className="h-3 w-3" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            onClick={onDelete}
            aria-label={`${entry.memberName} 삭제`}
            title="삭제"
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* 펼침 영역: 수당/공제 상세 */}
      {expanded && (
        <div
          id={detailPanelId}
          className="border-t bg-muted/20 px-3 py-2 space-y-2"
          role="region"
          aria-label={`${entry.memberName} 수당/공제 상세`}
        >
          {/* 수당 */}
          {allowances.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground">
                추가 수당
              </p>
              <dl role="list" className="space-y-1">
                {allowances.map((adj) => (
                  <div
                    key={adj.id}
                    className="flex items-center justify-between gap-1"
                    role="listitem"
                  >
                    <dt className="text-xs text-blue-700 flex-1 truncate">
                      + {adj.label}
                    </dt>
                    <dd className="text-xs text-blue-700 tabular-nums flex-shrink-0">
                      {formatKRW(adj.amount)}
                    </dd>
                    <button
                      type="button"
                      onClick={() => onDeleteAdj(adj.id)}
                      className="text-muted-foreground hover:text-destructive flex-shrink-0"
                      aria-label={`${adj.label} 항목 삭제`}
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* 공제 */}
          {deductions.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground">
                공제 항목
              </p>
              <dl role="list" className="space-y-1">
                {deductions.map((adj) => (
                  <div
                    key={adj.id}
                    className="flex items-center justify-between gap-1"
                    role="listitem"
                  >
                    <dt className="text-xs text-red-600 flex-1 truncate">
                      - {adj.label}
                    </dt>
                    <dd className="text-xs text-red-600 tabular-nums flex-shrink-0">
                      {formatKRW(Math.abs(adj.amount))}
                    </dd>
                    <button
                      type="button"
                      onClick={() => onDeleteAdj(adj.id)}
                      className="text-muted-foreground hover:text-destructive flex-shrink-0"
                      aria-label={`${adj.label} 항목 삭제`}
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* 합계 */}
          {entry.adjustments.length > 0 && (
            <div className="flex items-center justify-between pt-1 border-t">
              <span className="text-[10px] font-medium text-muted-foreground">
                최종 정산 금액
              </span>
              <span className="text-xs font-semibold tabular-nums">
                {formatKRW(entry.finalAmount)}
              </span>
            </div>
          )}

          {/* 메모 */}
          {entry.notes && (
            <p className="text-[10px] text-muted-foreground pt-1 border-t">
              {entry.notes}
            </p>
          )}

          {/* 항목 추가 버튼 */}
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[10px] w-full"
            onClick={onAddAdj}
            aria-label={`${entry.memberName}에게 수당/공제 항목 추가`}
          >
            <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
            수당/공제 항목 추가
          </Button>
        </div>
      )}
    </div>
  );
});
