"use client";

import { useMemo } from "react";
import { Users, Calendar, ClipboardCheck, Clock } from "lucide-react";
import type { EntityContext } from "@/types/entity-context";
import type { Schedule } from "@/types";

interface ProjectSummaryCardsProps {
  ctx: EntityContext;
  schedules: Schedule[];
}

// D-day 계산 (종료일 기준)
function getDdayInfo(endDate: string | null, startDate: string | null): {
  label: string;
  sublabel: string;
  color: string;
} {
  if (!endDate && !startDate) {
    return { label: "-", sublabel: "기간 미설정", color: "text-muted-foreground" };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (endDate) {
    const end = new Date(endDate + "T00:00:00");
    end.setHours(0, 0, 0, 0);
    const start = startDate ? new Date(startDate + "T00:00:00") : null;
    if (start) start.setHours(0, 0, 0, 0);

    const diffMs = end.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: "종료", sublabel: `${Math.abs(diffDays)}일 전 종료`, color: "text-gray-500" };
    }
    if (start && today >= start && today <= end) {
      return {
        label: "진행 중",
        sublabel: diffDays === 0 ? "오늘 종료" : `${diffDays}일 남음`,
        color: "text-green-600",
      };
    }
    if (diffDays === 0) {
      return { label: "D-day", sublabel: "오늘 종료", color: "text-red-600" };
    }
    return { label: `D-${diffDays}`, sublabel: `${diffDays}일 남음`, color: "text-blue-600" };
  }

  // endDate 없고 startDate만 있는 경우
  const start = new Date(startDate! + "T00:00:00");
  start.setHours(0, 0, 0, 0);
  if (today >= start) {
    return { label: "진행 중", sublabel: "종료일 미설정", color: "text-green-600" };
  }
  const diffMs = start.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return { label: `D-${diffDays}`, sublabel: `${diffDays}일 후 시작`, color: "text-blue-600" };
}

// 이번 달 일정 수 계산
function getThisMonthScheduleCount(schedules: Schedule[]): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return schedules.filter((s) => {
    const d = new Date(s.starts_at);
    return d.getFullYear() === year && d.getMonth() === month;
  }).length;
}

export function ProjectSummaryCards({ ctx, schedules }: ProjectSummaryCardsProps) {
  const project = ctx.raw.project;
  const memberCount = ctx.members.length;
  const thisMonthCount = useMemo(() => getThisMonthScheduleCount(schedules), [schedules]);

  const ddayInfo = useMemo(
    () => getDdayInfo(project?.end_date ?? null, project?.start_date ?? null),
    [project?.end_date, project?.start_date]
  );

  // 출석률 계산: 전체 일정 중 출석 기록이 있는 비율 (approximation)
  // 실제 출석률은 별도 쿼리가 필요하므로 현재는 멤버 수 기반 표시
  const pastScheduleCount = useMemo(() => {
    const now = new Date();
    return schedules.filter((s) => new Date(s.ends_at) < now).length;
  }, [schedules]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
      {/* 멤버 수 */}
      <div className="rounded border bg-card px-3 py-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">멤버</span>
        </div>
        <p className="text-lg font-bold tabular-nums leading-none">
          {memberCount}
          <span className="text-xs font-normal text-muted-foreground ml-0.5">명</span>
        </p>
      </div>

      {/* 이번 달 일정 */}
      <div className="rounded border bg-card px-3 py-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">이번 달 일정</span>
        </div>
        <p className="text-lg font-bold tabular-nums leading-none">
          {thisMonthCount}
          <span className="text-xs font-normal text-muted-foreground ml-0.5">개</span>
        </p>
      </div>

      {/* 누적 일정 */}
      <div className="rounded border bg-card px-3 py-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <ClipboardCheck className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">완료 일정</span>
        </div>
        <p className="text-lg font-bold tabular-nums leading-none">
          {pastScheduleCount}
          <span className="text-xs font-normal text-muted-foreground ml-0.5">회</span>
        </p>
      </div>

      {/* D-day */}
      <div className="rounded border bg-card px-3 py-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">D-day</span>
        </div>
        <p className={`text-lg font-bold tabular-nums leading-none ${ddayInfo.color}`}>
          {ddayInfo.label}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{ddayInfo.sublabel}</p>
      </div>
    </div>
  );
}
