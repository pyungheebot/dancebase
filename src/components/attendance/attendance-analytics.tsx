"use client";

import { useEffect } from "react";
import { Loader2, TrendingUp, Users, BarChart3, AlertTriangle, BarChart2 } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAttendanceAnalytics } from "@/hooks/use-attendance-analytics";
import type { EntityContext } from "@/types/entity-context";

type AttendanceAnalyticsProps = {
  ctx: EntityContext;
};

export function AttendanceAnalytics({ ctx }: AttendanceAnalyticsProps) {
  const { data, loading, refetch } = useAttendanceAnalytics(ctx);

  useEffect(() => {
    refetch();
  }, [refetch]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">분석 데이터를 불러올 수 없습니다</p>
      </div>
    );
  }

  const { memberStats, monthlyStats, overallAvgRate, totalSchedules } = data;

  const atRiskMembers = memberStats.filter((m) => m.rate <= 50 && m.total > 0);
  const highAttendanceMembers = memberStats.filter((m) => m.rate >= 80 && m.total > 0);

  return (
    <div className="space-y-5">
      {/* ===== 요약 카드 ===== */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* 전체 평균 출석률 */}
        <Card className="col-span-2 sm:col-span-2">
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              전체 평균 출석률
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="flex items-end gap-2">
              <span
                className={`text-3xl font-bold tabular-nums ${
                  overallAvgRate >= 80
                    ? "text-green-600"
                    : overallAvgRate >= 50
                    ? "text-yellow-600"
                    : "text-red-500"
                }`}
              >
                {overallAvgRate}%
              </span>
              <span className="text-xs text-muted-foreground mb-1">
                최근 6개월 기준
              </span>
            </div>
            <div className="mt-2 w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  overallAvgRate >= 80
                    ? "bg-green-500"
                    : overallAvgRate >= 50
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${overallAvgRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* 전체 일정 수 */}
        <Card>
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />
              총 일정 수
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-bold tabular-nums">{totalSchedules}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">최근 6개월</p>
          </CardContent>
        </Card>

        {/* 멤버 수 */}
        <Card>
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              멤버 수
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-bold tabular-nums">{memberStats.length}</p>
            <div className="flex gap-1.5 mt-0.5">
              {highAttendanceMembers.length > 0 && (
                <span className="text-[10px] text-green-600">
                  우수 {highAttendanceMembers.length}명
                </span>
              )}
              {atRiskMembers.length > 0 && (
                <span className="text-[10px] text-red-500">
                  주의 {atRiskMembers.length}명
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== 월별 출석 추이 ===== */}
      <div className="rounded-md border p-4 space-y-3">
        <h3 className="text-sm font-medium flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          월별 출석 추이
          <span className="text-xs text-muted-foreground font-normal">(최근 6개월)</span>
        </h3>

        {monthlyStats.every((m) => m.totalSchedules === 0) ? (
          <EmptyState
            icon={BarChart2}
            title="출석 데이터가 없습니다"
            description="최근 6개월간 일정 출석 기록이 없습니다"
            className="border-0 bg-transparent py-4"
          />
        ) : (
          <div className="space-y-2">
            {monthlyStats.map((stat) => (
              <div key={stat.yearMonth} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-20 shrink-0">
                  {stat.month}
                </span>
                {stat.totalSchedules === 0 ? (
                  <span className="text-xs text-muted-foreground italic">일정 없음</span>
                ) : (
                  <>
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          stat.avgRate >= 80
                            ? "bg-green-500"
                            : stat.avgRate >= 50
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${stat.avgRate}%` }}
                      />
                    </div>
                    <span
                      className={`text-xs font-semibold tabular-nums w-9 text-right ${
                        stat.avgRate >= 80
                          ? "text-green-600"
                          : stat.avgRate >= 50
                          ? "text-yellow-600"
                          : "text-red-500"
                      }`}
                    >
                      {stat.avgRate}%
                    </span>
                    <span className="text-[11px] text-muted-foreground w-12 shrink-0">
                      {stat.totalSchedules}회
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== 출석률 주의 멤버 ===== */}
      {atRiskMembers.length > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 p-4 space-y-2">
          <h3 className="text-sm font-medium text-red-700 dark:text-red-400 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" />
            출석률 주의 멤버
            <Badge className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 ml-1">
              50% 이하
            </Badge>
          </h3>
          <div className="flex flex-wrap gap-2">
            {atRiskMembers.map((m) => (
              <div
                key={m.userId}
                className="flex items-center gap-1.5 bg-white dark:bg-red-950/40 rounded px-2.5 py-1 border border-red-200 dark:border-red-800"
              >
                <span className="text-xs font-medium text-red-700 dark:text-red-300">
                  {m.name}
                </span>
                <span className="text-xs font-bold tabular-nums text-red-500">
                  {m.rate}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== 멤버별 출석률 테이블 ===== */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium flex items-center gap-1.5">
          <Users className="h-4 w-4 text-muted-foreground" />
          멤버별 출석률
          <span className="text-xs text-muted-foreground font-normal">(최근 6개월)</span>
        </h3>

        {memberStats.length === 0 ? (
          <div className="text-center py-8 border rounded-md">
            <p className="text-sm text-muted-foreground">출석 데이터가 없습니다</p>
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs w-8 text-center">#</TableHead>
                  <TableHead className="text-xs">멤버</TableHead>
                  <TableHead className="text-xs text-center w-14">출석</TableHead>
                  <TableHead className="text-xs text-center w-14">지각</TableHead>
                  <TableHead className="text-xs text-center w-14">조퇴</TableHead>
                  <TableHead className="text-xs text-center w-14">결석</TableHead>
                  <TableHead className="text-xs text-center w-16">전체</TableHead>
                  <TableHead className="text-xs text-right w-28">출석률</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberStats.map((stat, idx) => {
                  const isLow = stat.rate <= 50 && stat.total > 0;
                  const isHigh = stat.rate >= 80 && stat.total > 0;

                  return (
                    <TableRow
                      key={stat.userId}
                      className={
                        isLow
                          ? "bg-red-50 dark:bg-red-950/10 hover:bg-red-100 dark:hover:bg-red-950/20"
                          : isHigh
                          ? "bg-green-50 dark:bg-green-950/10 hover:bg-green-100 dark:hover:bg-green-950/20"
                          : ""
                      }
                    >
                      <TableCell className="text-center py-2.5">
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {idx + 1}
                        </span>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{stat.name}</span>
                          {isHigh && (
                            <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                              우수
                            </Badge>
                          )}
                          {isLow && (
                            <Badge className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                              주의
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-2.5">
                        <span className="text-sm tabular-nums text-green-600 font-medium">
                          {stat.present}
                        </span>
                      </TableCell>
                      <TableCell className="text-center py-2.5">
                        <span className="text-sm tabular-nums text-yellow-600 font-medium">
                          {stat.late}
                        </span>
                      </TableCell>
                      <TableCell className="text-center py-2.5">
                        <span className="text-sm tabular-nums text-orange-600 font-medium">
                          {stat.earlyLeave}
                        </span>
                      </TableCell>
                      <TableCell className="text-center py-2.5">
                        <span className="text-sm tabular-nums text-red-500 font-medium">
                          {stat.absent}
                        </span>
                      </TableCell>
                      <TableCell className="text-center py-2.5">
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {stat.total}회
                        </span>
                      </TableCell>
                      <TableCell className="text-right py-2.5">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isHigh
                                  ? "bg-green-500"
                                  : isLow
                                  ? "bg-red-500"
                                  : "bg-yellow-500"
                              }`}
                              style={{ width: `${stat.rate}%` }}
                            />
                          </div>
                          <span
                            className={`text-sm font-semibold tabular-nums w-10 text-right ${
                              isHigh
                                ? "text-green-600"
                                : isLow
                                ? "text-red-500"
                                : "text-yellow-600"
                            }`}
                          >
                            {stat.rate}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {memberStats.length > 0 && (
          <div className="space-y-1">
            <p className="text-[11px] text-muted-foreground">
              * 출석률 = (출석 + 지각) / 전체 일정 수 × 100. 조퇴는 결석으로 집계됩니다.
            </p>
            <div className="flex gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                80% 이상: 우수
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-yellow-500" />
                51~79%: 보통
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
                50% 이하: 주의
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
