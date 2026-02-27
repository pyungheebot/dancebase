"use client";

import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { usePreExcuse } from "@/hooks/use-pre-excuse";
import type { PreExcuseReason } from "@/types";

// ============================================================
// 사유 레이블 맵
// ============================================================

const REASON_LABEL: Record<PreExcuseReason, string> = {
  personal: "개인 사정",
  health: "건강 문제",
  conflict: "일정 충돌",
  other: "기타",
};

const REASON_COLOR: Record<PreExcuseReason, string> = {
  personal: "text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400",
  health: "text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400",
  conflict: "text-orange-600 bg-orange-50 dark:bg-orange-950/30 dark:text-orange-400",
  other: "text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400",
};

// ============================================================
// Props
// ============================================================

type Props = {
  groupId: string;
  scheduleId: string;
  currentUserId: string;
  isLeader?: boolean;
};

// ============================================================
// 컴포넌트
// ============================================================

export function PreExcuseSummary({
  groupId,
  scheduleId,
  currentUserId,
  isLeader = false,
}: Props) {
  const { getExcusesBySchedule, getMyExcuse, getExcuseCount } =
    usePreExcuse(groupId);

  const totalCount = getExcuseCount(scheduleId);

  // 신고가 없으면 렌더링하지 않음
  if (totalCount === 0) return null;

  // 리더: 전체 목록 / 일반 멤버: 내 신고만
  const displayEntries = isLeader
    ? getExcusesBySchedule(scheduleId)
    : (() => {
        const mine = getMyExcuse(scheduleId, currentUserId);
        return mine ? [mine] : [];
      })();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 focus:outline-none"
          aria-label={`사전 결석 ${totalCount}명 목록 보기`}
        >
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 gap-1 border-orange-300 text-orange-600 bg-orange-50 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-400 dark:bg-orange-950/30 cursor-pointer transition-colors"
          >
            <AlertCircle className="h-3 w-3" />
            사전 결석 {totalCount}명
          </Badge>
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-64 p-0 overflow-hidden"
        align="start"
        side="top"
      >
        {/* 헤더 */}
        <div className="px-3 py-2 border-b bg-muted/40">
          <p className="text-xs font-semibold flex items-center gap-1.5">
            <AlertCircle className="h-3 w-3 text-orange-500" />
            {isLeader ? `사전 결석 신고 (${totalCount}명)` : "내 사전 결석 신고"}
          </p>
        </div>

        {/* 신고자 목록 */}
        {displayEntries.length === 0 ? (
          <div className="px-3 py-4 text-center">
            <p className="text-xs text-muted-foreground">신고 내역이 없습니다</p>
          </div>
        ) : (
          <ul className="divide-y max-h-56 overflow-y-auto">
            {displayEntries.map((entry) => (
              <li key={entry.id} className="px-3 py-2 space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium truncate">
                    {entry.userName}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${REASON_COLOR[entry.reason]}`}
                  >
                    {REASON_LABEL[entry.reason]}
                  </span>
                </div>
                {entry.memo && (
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {entry.memo}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* 일반 멤버에게 전체 신고 수 안내 */}
        {!isLeader && totalCount > 0 && (
          <div className="px-3 py-2 border-t bg-muted/30">
            <p className="text-[10px] text-muted-foreground text-center">
              총 {totalCount}명이 사전 결석 신고를 했습니다
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
