"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Users,
} from "lucide-react";
import { useScheduleAttendanceSummary } from "@/hooks/use-schedule-attendance-summary";
import type { ScheduleAttendanceMember } from "@/types";

interface ScheduleAttendanceSummaryCardProps {
  scheduleId: string;
}

// 도넛 차트: pure CSS conic-gradient
function DonutChart({
  present,
  late,
  absent,
  noResponse,
  total,
  rate,
}: {
  present: number;
  late: number;
  absent: number;
  noResponse: number;
  total: number;
  rate: number;
}) {
  if (total === 0) {
    return (
      <div className="relative flex h-20 w-20 items-center justify-center">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: "conic-gradient(#e5e7eb 0deg 360deg)",
            maskImage: "radial-gradient(circle, transparent 55%, black 55%)",
            WebkitMaskImage:
              "radial-gradient(circle, transparent 55%, black 55%)",
          }}
        />
        <span className="relative z-10 text-sm font-bold text-muted-foreground">
          0%
        </span>
      </div>
    );
  }

  // 각 슬라이스의 deg 계산
  const presentDeg = (present / total) * 360;
  const lateDeg = (late / total) * 360;
  const absentDeg = (absent / total) * 360;
  const noResponseDeg = (noResponse / total) * 360;

  let cursor = 0;
  const p1 = cursor;
  cursor += presentDeg;
  const p2 = cursor;
  cursor += lateDeg;
  const p3 = cursor;
  cursor += absentDeg;
  const p4 = cursor;
  cursor += noResponseDeg;

  const gradient = [
    `#22c55e ${p1}deg ${p2}deg`,   // green - 참석
    `#eab308 ${p2}deg ${p3}deg`,   // yellow - 지각
    `#ef4444 ${p3}deg ${p4}deg`,   // red - 결석
    `#d1d5db ${p4}deg 360deg`,     // gray - 미응답
  ].join(", ");

  return (
    <div className="relative flex h-20 w-20 items-center justify-center">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(${gradient})`,
          maskImage: "radial-gradient(circle, transparent 55%, black 55%)",
          WebkitMaskImage:
            "radial-gradient(circle, transparent 55%, black 55%)",
        }}
      />
      <span className="relative z-10 text-sm font-bold">{rate}%</span>
    </div>
  );
}

// 멤버 목록 섹션
function MemberList({
  members,
  label,
  color,
}: {
  members: ScheduleAttendanceMember[];
  label: string;
  color: string;
}) {
  if (members.length === 0) return null;
  return (
    <div className="space-y-0.5">
      <p className={`text-[10px] font-semibold uppercase tracking-wide ${color}`}>
        {label} ({members.length})
      </p>
      <div className="flex flex-wrap gap-1">
        {members.map((m) => (
          <span
            key={m.userId}
            className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
          >
            {m.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ScheduleAttendanceSummaryCard({
  scheduleId,
}: ScheduleAttendanceSummaryCardProps) {
  const [open, setOpen] = useState(false);
  const summary = useScheduleAttendanceSummary(scheduleId);

  if (summary.loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const presentMembers = summary.members.filter((m) => m.status === "present");
  const lateMembers = summary.members.filter((m) => m.status === "late");
  const absentMembers = summary.members.filter((m) => m.status === "absent");
  const noResponseMembers = summary.members.filter(
    (m) => m.status === "no_response"
  );

  const stats = [
    {
      label: "참석",
      count: summary.presentCount,
      icon: CheckCircle2,
      iconColor: "text-green-500",
      bgColor: "bg-green-50",
      textColor: "text-green-700",
    },
    {
      label: "결석",
      count: summary.absentCount,
      icon: XCircle,
      iconColor: "text-red-500",
      bgColor: "bg-red-50",
      textColor: "text-red-700",
    },
    {
      label: "지각",
      count: summary.lateCount,
      icon: Clock,
      iconColor: "text-yellow-500",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-700",
    },
    {
      label: "미응답",
      count: summary.noResponseCount,
      icon: HelpCircle,
      iconColor: "text-gray-400",
      bgColor: "bg-gray-50",
      textColor: "text-gray-500",
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
          <Users className="h-4 w-4 text-muted-foreground" />
          참석 현황 요약
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 상단: 도넛 차트 + 출석률 */}
        <div className="flex items-center gap-4">
          <DonutChart
            present={summary.presentCount}
            late={summary.lateCount}
            absent={summary.absentCount}
            noResponse={summary.noResponseCount}
            total={summary.totalMembers}
            rate={summary.attendanceRate}
          />
          <div className="flex-1">
            <p className="text-2xl font-bold leading-none">
              {summary.attendanceRate}
              <span className="ml-0.5 text-sm font-normal text-muted-foreground">
                %
              </span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              전체 {summary.totalMembers}명 중 참석{" "}
              {summary.presentCount + summary.lateCount}명
            </p>
            {/* 범례 */}
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
              {[
                { color: "bg-green-500", label: "참석" },
                { color: "bg-yellow-400", label: "지각" },
                { color: "bg-red-500", label: "결석" },
                { color: "bg-gray-300", label: "미응답" },
              ].map((l) => (
                <span key={l.label} className="flex items-center gap-1">
                  <span className={`inline-block h-2 w-2 rounded-full ${l.color}`} />
                  <span className="text-[10px] text-muted-foreground">
                    {l.label}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 4칸 그리드 */}
        <div className="grid grid-cols-4 gap-2">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className={`flex flex-col items-center rounded-lg py-2 ${s.bgColor}`}
              >
                <Icon className={`h-4 w-4 ${s.iconColor}`} />
                <span className={`mt-0.5 text-base font-bold ${s.textColor}`}>
                  {s.count}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* 펼치기: 상태별 멤버 이름 목록 */}
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-full gap-1 text-xs text-muted-foreground"
            >
              {open ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  멤버 목록 접기
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  멤버 목록 펼치기
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 space-y-3 rounded-lg border bg-muted/30 p-3">
              <MemberList
                members={presentMembers}
                label="참석"
                color="text-green-600"
              />
              <MemberList
                members={lateMembers}
                label="지각"
                color="text-yellow-600"
              />
              <MemberList
                members={absentMembers}
                label="결석"
                color="text-red-600"
              />
              <MemberList
                members={noResponseMembers}
                label="미응답"
                color="text-gray-500"
              />
              {summary.members.length === 0 && (
                <p className="text-center text-xs text-muted-foreground">
                  멤버 정보가 없습니다.
                </p>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
