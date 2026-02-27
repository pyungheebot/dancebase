"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useScheduleEngagement } from "@/hooks/use-schedule-engagement";

interface ScheduleEngagementStatsCardProps {
  scheduleId: string;
}

export function ScheduleEngagementStatsCard({
  scheduleId,
}: ScheduleEngagementStatsCardProps) {
  const { engagement, loading } = useScheduleEngagement(scheduleId);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-3 w-full rounded-full" />
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-md" />
            ))}
          </div>
          <Skeleton className="h-5 w-28" />
        </CardContent>
      </Card>
    );
  }

  if (!engagement) return null;

  const { rsvp, actual_attended, rsvp_accuracy, attendance_rate } = engagement;
  const { going, maybe, not_going, no_response, total } = rsvp;

  // 비율 막대용 백분율 계산 (total 0 방어)
  const pctGoing = total > 0 ? (going / total) * 100 : 0;
  const pctMaybe = total > 0 ? (maybe / total) * 100 : 0;
  const pctNotGoing = total > 0 ? (not_going / total) * 100 : 0;
  const pctNoResponse = total > 0 ? (no_response / total) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-foreground">
          일정 참여도 통계
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* RSVP 분포 비율 바 */}
        <div>
          <p className="text-xs text-muted-foreground mb-1.5">RSVP 분포</p>
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
            {pctGoing > 0 && (
              <div
                className="bg-green-500 transition-all"
                style={{ width: `${pctGoing}%` }}
                title={`참석 ${going}명`}
              />
            )}
            {pctMaybe > 0 && (
              <div
                className="bg-orange-400 transition-all"
                style={{ width: `${pctMaybe}%` }}
                title={`미정 ${maybe}명`}
              />
            )}
            {pctNotGoing > 0 && (
              <div
                className="bg-red-400 transition-all"
                style={{ width: `${pctNotGoing}%` }}
                title={`불참 ${not_going}명`}
              />
            )}
            {pctNoResponse > 0 && (
              <div
                className="bg-gray-300 transition-all"
                style={{ width: `${pctNoResponse}%` }}
                title={`미응답 ${no_response}명`}
              />
            )}
          </div>
          {/* 범례 */}
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
              참석
            </span>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="inline-block h-2 w-2 rounded-full bg-orange-400" />
              미정
            </span>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
              불참
            </span>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="inline-block h-2 w-2 rounded-full bg-gray-300" />
              미응답
            </span>
          </div>
        </div>

        {/* 숫자 그리드 */}
        <div className="grid grid-cols-4 gap-2">
          <StatBox label="참석" value={going} colorClass="text-green-600" />
          <StatBox label="미정" value={maybe} colorClass="text-orange-500" />
          <StatBox label="불참" value={not_going} colorClass="text-red-500" />
          <StatBox
            label="미응답"
            value={no_response}
            colorClass="text-muted-foreground"
          />
        </div>

        {/* 실제 출석 + RSVP 정확도 */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">실제 출석</span>
            <span className="text-sm font-semibold text-foreground">
              {actual_attended}명
            </span>
            {attendance_rate !== null && (
              <span className="text-[10px] text-muted-foreground">
                ({attendance_rate}%)
              </span>
            )}
          </div>

          {rsvp_accuracy !== null && (
            <Badge
              className={`text-[10px] px-1.5 py-0 ${
                rsvp_accuracy >= 80
                  ? "bg-green-100 text-green-700 hover:bg-green-100"
                  : rsvp_accuracy >= 50
                  ? "bg-orange-100 text-orange-700 hover:bg-orange-100"
                  : "bg-red-100 text-red-700 hover:bg-red-100"
              }`}
            >
              RSVP 정확도 {rsvp_accuracy}%
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// 개별 숫자 박스 서브 컴포넌트
function StatBox({
  label,
  value,
  colorClass,
}: {
  label: string;
  value: number;
  colorClass: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border bg-muted/40 py-2 gap-0.5">
      <span className={`text-base font-bold leading-none ${colorClass}`}>
        {value}
      </span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}
