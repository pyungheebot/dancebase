"use client";

import { memo } from "react";
import { Clock, ListChecks } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import type { RehearsalScheduleItem } from "@/types";
import { formatMonthDay } from "@/lib/date-utils";
import { TYPE_LABELS, TYPE_BADGE_CLASS } from "./rehearsal-schedule-types";

// ============================================================
// 타입
// ============================================================

export type RehearsalStatsProps = {
  totalRehearsals: number;
  completedCount: number;
  upcomingRehearsals: RehearsalScheduleItem[];
  checklistProgress: number;
  totalCheckItems: number;
  checkedItems: number;
};

// ============================================================
// 통계 요약 컴포넌트
// ============================================================

export const RehearsalScheduleStats = memo(function RehearsalScheduleStats({
  totalRehearsals,
  completedCount,
  upcomingRehearsals,
  checklistProgress,
  totalCheckItems,
  checkedItems,
}: RehearsalStatsProps) {
  if (totalRehearsals === 0) return null;

  const nextRehearsal = upcomingRehearsals[0];

  return (
    <div className="space-y-2 mt-3">
      {/* 카운트 요약 */}
      <dl className="grid grid-cols-3 gap-2" aria-label="리허설 현황">
        <div className="text-center p-2 bg-gray-50 rounded-md">
          <dt className="text-[10px] text-gray-400">전체</dt>
          <dd className="text-xs font-semibold text-gray-700">{totalRehearsals}</dd>
        </div>
        <div className="text-center p-2 bg-blue-50 rounded-md">
          <dt className="text-[10px] text-blue-400">예정</dt>
          <dd className="text-xs font-semibold text-blue-700">
            {upcomingRehearsals.length}
          </dd>
        </div>
        <div className="text-center p-2 bg-green-50 rounded-md">
          <dt className="text-[10px] text-green-400">완료</dt>
          <dd className="text-xs font-semibold text-green-700">{completedCount}</dd>
        </div>
      </dl>

      {/* 체크리스트 전체 진행률 */}
      {totalCheckItems > 0 && (
        <div
          className="space-y-1"
          role="group"
          aria-label="체크리스트 전체 진행률"
        >
          <div className="flex justify-between text-[10px] text-gray-500">
            <span className="flex items-center gap-1">
              <ListChecks className="h-3 w-3" aria-hidden="true" />
              체크리스트 진행률 ({checkedItems}/{totalCheckItems})
            </span>
            <span className="font-medium text-gray-700" aria-live="polite">
              {checklistProgress}%
            </span>
          </div>
          <div
            className="h-1.5 bg-gray-100 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={checklistProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`전체 체크리스트 ${checklistProgress}% 완료`}
          >
            <div
              className="h-full bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${checklistProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* 다음 리허설 알림 */}
      {nextRehearsal && (
        <div
          className="p-2 bg-indigo-50 border border-indigo-200 rounded-md"
          aria-label="다음 리허설 정보"
        >
          <p className="text-[10px] font-medium text-indigo-700 mb-0.5">
            다음 리허설
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 ${TYPE_BADGE_CLASS[nextRehearsal.type]}`}
            >
              {TYPE_LABELS[nextRehearsal.type]}
            </Badge>
            <span className="text-[10px] font-medium text-indigo-700">
              {nextRehearsal.title}
            </span>
            <time
              dateTime={nextRehearsal.date}
              className="text-[10px] text-indigo-500"
            >
              {formatMonthDay(nextRehearsal.date)}
            </time>
            <span className="text-[10px] text-indigo-400 flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" aria-hidden="true" />
              <span>{nextRehearsal.startTime}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
});
