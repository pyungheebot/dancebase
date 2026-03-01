"use client";

import React from "react";
import {
  Flame,
  Star,
  AlertTriangle,
  CheckCircle2,
  Clock,
  LogOut,
  XCircle,
} from "lucide-react";
import type { MemberAttendStatSummary, MemberAttendStatStatus } from "@/types";
import {
  ALL_STATUSES,
  STATUS_BADGE_CLASS,
  getRateColor,
  getRateTextColor,
} from "./types";

const STATUS_LABEL_SHORT: Record<MemberAttendStatStatus, string> = {
  present: "출석",
  late: "지각",
  early_leave: "조퇴",
  absent: "결석",
};

const STATUS_ICON_NODE: Record<MemberAttendStatStatus, React.ReactNode> = {
  present: <CheckCircle2 className="h-3 w-3" aria-hidden="true" />,
  late: <Clock className="h-3 w-3" aria-hidden="true" />,
  early_leave: <LogOut className="h-3 w-3" aria-hidden="true" />,
  absent: <XCircle className="h-3 w-3" aria-hidden="true" />,
};

export interface MemberRateBarProps {
  summary: MemberAttendStatSummary;
  rank: number;
  isTopAttendee: boolean;
  isMostAbsentee: boolean;
}

export const MemberRateBar = React.memo(function MemberRateBar({
  summary: s,
  rank,
  isTopAttendee,
  isMostAbsentee,
}: MemberRateBarProps) {
  const rankColors = ["text-yellow-500", "text-gray-400", "text-orange-400"];
  const rankColor = rank <= 3 ? rankColors[rank - 1] : "text-gray-300";

  const statusCounts: Record<MemberAttendStatStatus, number> = {
    present: s.presentCount,
    late: s.lateCount,
    early_leave: s.earlyLeaveCount,
    absent: s.absentCount,
  };

  const ariaLabel = [
    `${rank}위 ${s.memberName}`,
    `출석률 ${s.attendanceRate}%`,
    isTopAttendee ? "최다 출석" : "",
    isMostAbsentee && !isTopAttendee ? "최다 결석" : "",
    s.currentStreak > 2 ? `${s.currentStreak}회 연속 출석` : "",
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      className="space-y-0.5"
      role="listitem"
      aria-label={ariaLabel}
    >
      <div className="flex items-center gap-2">
        <span
          className={`text-[10px] font-bold w-4 shrink-0 ${rankColor}`}
          aria-hidden="true"
        >
          {rank}
        </span>
        <span className="text-[11px] text-gray-700 w-20 truncate shrink-0 font-medium">
          {s.memberName}
        </span>
        {isTopAttendee && (
          <Star
            className="h-3 w-3 text-yellow-500 shrink-0"
            aria-label="최다 출석"
          />
        )}
        {isMostAbsentee && !isTopAttendee && (
          <AlertTriangle
            className="h-3 w-3 text-red-400 shrink-0"
            aria-label="최다 결석"
          />
        )}
        {s.currentStreak > 2 && (
          <span
            className="flex items-center gap-0.5 text-[9px] text-orange-500 shrink-0"
            aria-label={`${s.currentStreak}회 연속 출석`}
          >
            <Flame className="h-2.5 w-2.5" aria-hidden="true" />
            {s.currentStreak}연속
          </span>
        )}
        <div
          className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden"
          role="progressbar"
          aria-valuenow={s.attendanceRate}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${s.memberName} 출석률 ${s.attendanceRate}%`}
        >
          <div
            className={`h-full rounded-full transition-all ${getRateColor(s.attendanceRate)}`}
            style={{ width: `${s.attendanceRate}%` }}
          />
        </div>
        <span
          className={`text-[10px] font-bold w-8 text-right shrink-0 ${getRateTextColor(s.attendanceRate)}`}
          aria-hidden="true"
        >
          {s.attendanceRate}%
        </span>
      </div>

      {/* 상태별 세부 수치 */}
      <div className="flex items-center gap-2 pl-6" aria-hidden="true">
        {ALL_STATUSES.map((st) => {
          const cnt = statusCounts[st];
          if (cnt === 0) return null;
          return (
            <span
              key={st}
              className={`flex items-center gap-0.5 text-[9px] ${
                STATUS_BADGE_CLASS[st].split(" ")[1]
              }`}
              title={`${STATUS_LABEL_SHORT[st]} ${cnt}회`}
            >
              {STATUS_ICON_NODE[st]}
              {cnt}
            </span>
          );
        })}
        <span className="text-[9px] text-gray-400 ml-auto">
          총 {s.totalCount}회
        </span>
      </div>
    </div>
  );
});
