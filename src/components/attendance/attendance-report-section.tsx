"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Loader2,
  Download,
  FileBarChart2,
  Sun,
  Sunset,
  Moon,
  Trophy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAttendanceReport, type ReportPeriod } from "@/hooks/use-attendance-report";
import { exportToCsv } from "@/lib/export/csv-exporter";
import { toast } from "sonner";
import { TOAST } from "@/lib/toast-messages";
import { AttendanceExportButton } from "@/components/attendance/attendance-export-button";
import type { EntityContext } from "@/types/entity-context";

type Props = {
  ctx: EntityContext;
};

const PERIOD_LABELS: Record<ReportPeriod, string> = {
  "1m": "1개월",
  "3m": "3개월",
  "6m": "6개월",
  "1y": "1년",
};

// 출석률 색상 클래스
function rateColor(rate: number) {
  if (rate >= 80) return "text-green-600";
  if (rate >= 50) return "text-yellow-600";
  return "text-red-500";
}

function rateBarColor(rate: number) {
  if (rate >= 80) return "bg-green-500";
  if (rate >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

// 요일 순서 재배열 (월~일)
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // 월화수목금토일

// 순위 배지
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <Badge className="text-[10px] px-1.5 py-0 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
        금
      </Badge>
    );
  if (rank === 2)
    return (
      <Badge className="text-[10px] px-1.5 py-0 bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
        은
      </Badge>
    );
  if (rank === 3)
    return (
      <Badge className="text-[10px] px-1.5 py-0 bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200">
        동
      </Badge>
    );
  return null;
}

export function AttendanceReportSection({ ctx }: Props) {
  const [period, setPeriod] = useState<ReportPeriod>("3m");

  const { report, loading } = useAttendanceReport(
    ctx.groupId,
    ctx.members,
    period,
    ctx.projectId
  );

  // CSV 내보내기
  const handleExportCsv = () => {
    if (!report) {
      toast.error(TOAST.ATTENDANCE.EXPORT_NO_DATA);
      return;
    }

    const dateStr = format(new Date(), "yyyy-MM-dd");
    const filename = `출석리포트_${PERIOD_LABELS[period]}_${dateStr}`;

    const headers = [
      "멤버",
      "출석",
      "지각",
      "결석",
      "전체 일정",
      "출석률(%)",
      "지각률(%)",
    ];

    const rows = report.memberStats.map((stat) => [
      stat.name,
      stat.present,
      stat.late,
      stat.absent,
      stat.total,
      stat.rate,
      stat.lateRate,
    ]);

    exportToCsv(filename, headers, rows);
    toast.success(TOAST.ATTENDANCE.CSV_DOWNLOADED);
  };

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FileBarChart2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">출석 요약 리포트</span>
        </div>
        <div className="flex items-center gap-2">
          {/* 기간 선택 */}
          <Select
            value={period}
            onValueChange={(v) => setPeriod(v as ReportPeriod)}
          >
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PERIOD_LABELS) as ReportPeriod[]).map((key) => (
                <SelectItem key={key} value={key} className="text-xs">
                  {PERIOD_LABELS[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* CSV 내보내기 */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={handleExportCsv}
            disabled={loading || !report || report.totalSchedules === 0}
          >
            <Download className="h-3 w-3" />
            CSV
          </Button>

          {/* PDF 내보내기 */}
          <AttendanceExportButton
            groupId={ctx.groupId}
            groupName={ctx.header.name}
            members={ctx.members}
            projectId={ctx.projectId}
          />
        </div>
      </div>

      {/* 로딩 */}
      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* 데이터 없음 */}
      {!loading && report && report.totalSchedules === 0 && (
        <div className="text-center py-10 border rounded-md">
          <FileBarChart2 className="h-8 w-8 mx-auto text-muted-foreground opacity-40 mb-2" />
          <p className="text-sm text-muted-foreground">
            선택한 기간({PERIOD_LABELS[period]})에 출석 데이터가 없습니다
          </p>
        </div>
      )}

      {/* 리포트 내용 */}
      {!loading && report && report.totalSchedules > 0 && (
        <div className="space-y-5">
          {/* ===== 요일별 출석 패턴 ===== */}
          <div className="rounded-md border p-4 space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              요일별 출석 패턴
            </h3>
            <div className="space-y-2">
              {DAY_ORDER.map((dayIndex) => {
                const stat = report.dayOfWeekStats[dayIndex];
                const isMax =
                  stat.scheduleCount > 0 &&
                  stat.rate ===
                    Math.max(
                      ...report.dayOfWeekStats
                        .filter((d) => d.scheduleCount > 0)
                        .map((d) => d.rate)
                    );
                return (
                  <div key={dayIndex} className="flex items-center gap-3">
                    <span
                      className={`text-xs w-5 shrink-0 text-center font-medium ${
                        isMax ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"
                      }`}
                    >
                      {stat.label}
                    </span>
                    {stat.scheduleCount === 0 ? (
                      <span className="text-xs text-muted-foreground italic">
                        일정 없음
                      </span>
                    ) : (
                      <>
                        <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isMax
                                ? "bg-blue-500"
                                : rateBarColor(stat.rate)
                            }`}
                            style={{ width: `${stat.rate}%` }}
                          />
                        </div>
                        <span
                          className={`text-xs font-semibold tabular-nums w-9 text-right ${
                            isMax
                              ? "text-blue-600 dark:text-blue-400"
                              : rateColor(stat.rate)
                          }`}
                        >
                          {stat.rate}%
                        </span>
                        <span className="text-[11px] text-muted-foreground w-10 shrink-0 text-right">
                          {stat.scheduleCount}회
                        </span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ===== 시간대별 출석 분포 ===== */}
          <div className="grid grid-cols-3 gap-3">
            {report.timeSlotStats.map((slot) => {
              const Icon =
                slot.slot === "morning"
                  ? Sun
                  : slot.slot === "afternoon"
                  ? Sunset
                  : Moon;
              const iconColor =
                slot.slot === "morning"
                  ? "text-amber-500"
                  : slot.slot === "afternoon"
                  ? "text-orange-500"
                  : "text-indigo-500";

              return (
                <Card key={slot.slot}>
                  <CardHeader className="pb-1 pt-3 px-3">
                    <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                      <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
                      {slot.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3">
                    {slot.scheduleCount === 0 ? (
                      <p className="text-xs text-muted-foreground">일정 없음</p>
                    ) : (
                      <>
                        <p
                          className={`text-2xl font-bold tabular-nums ${rateColor(slot.rate)}`}
                        >
                          {slot.rate}%
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {slot.range} · {slot.scheduleCount}회
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* ===== 월별 출석 추이 ===== */}
          {report.monthlyStats.length > 1 && (
            <div className="rounded-md border p-4 space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                월별 출석 추이
              </h3>
              <div className="space-y-2">
                {report.monthlyStats.map((stat) => (
                  <div key={stat.yearMonth} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-20 shrink-0">
                      {stat.label}
                    </span>
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${rateBarColor(stat.avgRate)}`}
                        style={{ width: `${stat.avgRate}%` }}
                      />
                    </div>
                    <span
                      className={`text-xs font-semibold tabular-nums w-9 text-right ${rateColor(stat.avgRate)}`}
                    >
                      {stat.avgRate}%
                    </span>
                    <span className="text-[11px] text-muted-foreground w-10 shrink-0 text-right">
                      {stat.scheduleCount}회
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== 멤버별 순위 ===== */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">멤버별 출석 순위</h3>
              <span className="text-xs text-muted-foreground font-normal">
                (최근 {PERIOD_LABELS[period]})
              </span>
            </div>

            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs w-8 text-center">#</TableHead>
                    <TableHead className="text-xs">멤버</TableHead>
                    <TableHead className="text-xs text-center w-14">출석</TableHead>
                    <TableHead className="text-xs text-center w-14">지각</TableHead>
                    <TableHead className="text-xs text-center w-14">결석</TableHead>
                    <TableHead className="text-xs text-right w-28">출석률</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.memberStats.map((stat, idx) => (
                    <TableRow key={stat.userId}>
                      <TableCell className="text-center py-2.5">
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {idx + 1}
                        </span>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium">{stat.name}</span>
                          <RankBadge rank={idx + 1} />
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
                        <span className="text-sm tabular-nums text-red-500 font-medium">
                          {stat.absent}
                        </span>
                      </TableCell>
                      <TableCell className="text-right py-2.5">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-14 bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${rateBarColor(stat.rate)}`}
                              style={{ width: `${stat.rate}%` }}
                            />
                          </div>
                          <span
                            className={`text-sm font-semibold tabular-nums w-10 text-right ${rateColor(stat.rate)}`}
                          >
                            {stat.rate}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <p className="text-[11px] text-muted-foreground">
              * 출석률 = (출석 + 지각) / 전체 일정 수 × 100. 조퇴는 결석으로
              집계됩니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
