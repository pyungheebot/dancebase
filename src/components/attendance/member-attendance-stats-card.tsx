"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  XCircle,
  Clock,
  Flame,
  Trophy,
  Star,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useMemberAttendanceStats } from "@/hooks/use-member-attendance-stats";

// 요일 이름 (0=일, 1=월 ... 6=토)
const DOW_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

// 막대 색상 (출석률 구간별)
function getBarColor(rate: number): string {
  if (rate >= 80) return "bg-green-500";
  if (rate >= 50) return "bg-yellow-400";
  return "bg-red-400";
}

// 출석률 텍스트 색상
function getRateTextColor(rate: number): string {
  if (rate >= 80) return "text-green-600";
  if (rate >= 50) return "text-yellow-600";
  return "text-red-500";
}

type MemberAttendanceStatsCardProps = {
  groupId: string;
  userId: string;
};

export function MemberAttendanceStatsCard({
  groupId,
  userId,
}: MemberAttendanceStatsCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { stats, loading } = useMemberAttendanceStats(groupId, userId);

  const diff =
    stats != null ? stats.overallRate - stats.groupAverageRate : 0;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer select-none hover:bg-muted/40 transition-colors rounded-t-xl">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                출석 통계
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 space-y-4">
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : stats == null ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                출석 데이터가 없습니다.
              </p>
            ) : (
              <>
                {/* 전체 출석률 + 그룹 평균 비교 */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-0.5">
                      전체 출석률
                    </p>
                    <p
                      className={`text-3xl font-bold tabular-nums leading-none ${getRateTextColor(
                        stats.overallRate
                      )}`}
                    >
                      {stats.overallRate}
                      <span className="text-base font-medium ml-0.5">%</span>
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <p className="text-[10px] text-muted-foreground">
                      그룹 평균 {stats.groupAverageRate}%
                    </p>
                    <div className="flex items-center gap-1">
                      {diff > 0 ? (
                        <>
                          <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                          <span className="text-xs font-semibold text-green-600">
                            +{diff}%
                          </span>
                        </>
                      ) : diff < 0 ? (
                        <>
                          <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                          <span className="text-xs font-semibold text-red-500">
                            {diff}%
                          </span>
                        </>
                      ) : (
                        <>
                          <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs font-semibold text-muted-foreground">
                            평균
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* 출석 / 결석 / 지각 3칸 그리드 */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col items-center gap-0.5 p-2 rounded-lg bg-green-50 dark:bg-green-950/30">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-lg font-bold tabular-nums text-green-700 leading-none mt-0.5">
                      {stats.presentCount}
                    </span>
                    <span className="text-[10px] text-green-600 font-medium">
                      출석
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5 p-2 rounded-lg bg-red-50 dark:bg-red-950/30">
                    <XCircle className="h-3.5 w-3.5 text-red-500" />
                    <span className="text-lg font-bold tabular-nums text-red-600 leading-none mt-0.5">
                      {stats.absentCount}
                    </span>
                    <span className="text-[10px] text-red-500 font-medium">
                      결석
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/30">
                    <Clock className="h-3.5 w-3.5 text-yellow-600" />
                    <span className="text-lg font-bold tabular-nums text-yellow-700 leading-none mt-0.5">
                      {stats.lateCount}
                    </span>
                    <span className="text-[10px] text-yellow-600 font-medium">
                      지각
                    </span>
                  </div>
                </div>

                {/* 12주 추이 막대 차트 */}
                <div>
                  <p className="text-[10px] text-muted-foreground mb-2">
                    최근 12주 출석 추이
                  </p>
                  <div className="flex items-end gap-[3px] h-10">
                    {stats.weeklyRates.map((w, i) => {
                      const heightPct = Math.max(w.rate, 4);
                      return (
                        <div
                          key={i}
                          className="flex-1 flex flex-col items-center gap-0.5 group relative"
                          title={`${w.week}: ${w.rate}%`}
                        >
                          <div className="flex-1 flex items-end w-full">
                            <div
                              className={`w-full rounded-sm transition-all ${getBarColor(
                                w.rate
                              )} group-hover:opacity-80`}
                              style={{ height: `${heightPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-1">
                    {stats.weeklyRates.length > 0 && (
                      <>
                        <span className="text-[9px] text-muted-foreground">
                          {stats.weeklyRates[0].week}
                        </span>
                        <span className="text-[9px] text-muted-foreground">
                          이번 주
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* 연속 출석 스트릭 */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 flex-1">
                    <Flame
                      className={`h-3.5 w-3.5 ${
                        stats.currentStreak >= 5
                          ? "text-amber-500"
                          : "text-muted-foreground"
                      }`}
                    />
                    <span className="text-xs text-muted-foreground">
                      현재 연속
                    </span>
                    <Badge
                      className={`text-[10px] px-1.5 py-0 ${
                        stats.currentStreak >= 10
                          ? "bg-amber-100 text-amber-700 border-amber-200"
                          : stats.currentStreak >= 5
                          ? "bg-orange-100 text-orange-700 border-orange-200"
                          : "bg-gray-100 text-gray-600 border-gray-200"
                      }`}
                      variant="outline"
                    >
                      {stats.currentStreak}회
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 flex-1">
                    <Trophy className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      최장 기록
                    </span>
                    <Badge
                      className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 border-blue-200"
                      variant="outline"
                    >
                      {stats.longestStreak}회
                    </Badge>
                  </div>
                </div>

                {/* 선호 요일 */}
                {stats.bestDayOfWeek !== null && (
                  <div className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      출석률 높은 요일
                    </span>
                    <Badge
                      className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 border-purple-200"
                      variant="outline"
                    >
                      {DOW_LABELS[stats.bestDayOfWeek]}요일
                    </Badge>
                  </div>
                )}

                {/* 총 일정 수 요약 */}
                <p className="text-[10px] text-muted-foreground text-right">
                  총 {stats.totalSchedules}개 일정 기준
                </p>
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
