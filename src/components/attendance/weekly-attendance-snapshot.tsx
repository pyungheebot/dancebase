"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CalendarDays } from "lucide-react";
import { useWeeklyAttendanceStats } from "@/hooks/use-weekly-attendance-stats";

// 금/은/동 아이콘 (텍스트 기반)
const MEDAL_ICONS = ["1위", "2위", "3위"];
const MEDAL_COLORS = [
  "text-yellow-500",   // 금
  "text-slate-400",    // 은
  "text-amber-600",    // 동
];
const MEDAL_BG = [
  "bg-yellow-50 border-yellow-200",
  "bg-slate-50 border-slate-200",
  "bg-amber-50 border-amber-200",
];

type WeeklyAttendanceSnapshotProps = {
  groupId: string;
  projectId?: string | null;
};

export function WeeklyAttendanceSnapshot({
  groupId,
  projectId,
}: WeeklyAttendanceSnapshotProps) {
  const { data, loading } = useWeeklyAttendanceStats(groupId, projectId);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            이번 주 출석 현황
          </CardTitle>
          {data && (
            <span className="text-[11px] text-muted-foreground">
              일정 {data.scheduleCount}건
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4">
        {!data || data.scheduleCount === 0 ? (
          <p className="text-xs text-muted-foreground py-2 text-center">
            이번 주 일정이 없습니다
          </p>
        ) : (
          <div className="space-y-3">
            {/* 출석률 + 증감 */}
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold tabular-nums">
                {data.thisWeekRate}%
              </span>
              {data.diff > 0 ? (
                <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200 font-semibold">
                  ↑ {data.diff}%
                </Badge>
              ) : data.diff < 0 ? (
                <Badge className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700 border-red-200 font-semibold">
                  ↓ {Math.abs(data.diff)}%
                </Badge>
              ) : (
                <span className="text-[11px] text-muted-foreground">
                  → 변동없음
                </span>
              )}
              <span className="text-[11px] text-muted-foreground ml-auto">
                지난주 {data.lastWeekRate}%
              </span>
            </div>

            {/* 출석률 진행 바 */}
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  data.thisWeekRate >= 80
                    ? "bg-green-500"
                    : data.thisWeekRate >= 50
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${Math.min(100, data.thisWeekRate)}%` }}
              />
            </div>

            {/* Top 3 멤버 */}
            {data.topMembers.length > 0 && (
              <div className="pt-1">
                <p className="text-[11px] text-muted-foreground mb-2 font-medium">
                  출석 Top 3
                </p>
                <div className="flex flex-col gap-1.5">
                  {data.topMembers.map((member, idx) => (
                    <div
                      key={member.userId}
                      className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 ${MEDAL_BG[idx]}`}
                    >
                      <span
                        className={`text-[10px] font-bold w-6 shrink-0 ${MEDAL_COLORS[idx]}`}
                      >
                        {MEDAL_ICONS[idx]}
                      </span>
                      <span className="text-xs font-medium flex-1 truncate">
                        {member.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
                        {member.count}회
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
