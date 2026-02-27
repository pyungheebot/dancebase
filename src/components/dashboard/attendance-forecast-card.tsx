"use client";

import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Users,
  CalendarCheck,
  CalendarX,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { useAttendanceForecast } from "@/hooks/use-attendance-forecast";
import type { DayOfWeek, AttendanceMemberForecast } from "@/types";

// ─── 상수 ──────────────────────────────────────────────────────

const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: "월",
  tue: "화",
  wed: "수",
  thu: "목",
  fri: "금",
  sat: "토",
  sun: "일",
};

const DAYS: DayOfWeek[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

// ─── 유틸 ──────────────────────────────────────────────────────

function trendStyle(
  trend: "improving" | "stable" | "declining"
): { badge: string; icon: string; label: string } {
  switch (trend) {
    case "improving":
      return {
        badge: "bg-green-100 text-green-700 border-green-200",
        icon: "text-green-500",
        label: "상승",
      };
    case "declining":
      return {
        badge: "bg-red-100 text-red-700 border-red-200",
        icon: "text-red-500",
        label: "하락",
      };
    default:
      return {
        badge: "bg-blue-100 text-blue-700 border-blue-200",
        icon: "text-blue-500",
        label: "안정",
      };
  }
}

function TrendIcon({
  trend,
  className,
}: {
  trend: "improving" | "stable" | "declining";
  className?: string;
}) {
  switch (trend) {
    case "improving":
      return <TrendingUp className={className} aria-label="상승" />;
    case "declining":
      return <TrendingDown className={className} aria-label="하락" />;
    default:
      return <Minus className={className} aria-label="안정" />;
  }
}

function rateColor(rate: number): string {
  if (rate >= 75) return "text-green-600";
  if (rate >= 50) return "text-blue-600";
  if (rate >= 30) return "text-yellow-600";
  return "text-red-600";
}

function rateBarColor(rate: number): string {
  if (rate >= 75) return "bg-green-500";
  if (rate >= 50) return "bg-blue-500";
  if (rate >= 30) return "bg-yellow-500";
  return "bg-red-500";
}

// ─── 서브 컴포넌트: 요일별 출석률 바 차트 ──────────────────────

function DayRateChart({
  dayAvgRates,
  bestDay,
  worstDay,
}: {
  dayAvgRates: Record<DayOfWeek, number>;
  bestDay: DayOfWeek;
  worstDay: DayOfWeek;
}) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground mb-2 font-medium">
        요일별 평균 출석률
      </p>
      <div className="flex items-end gap-1" style={{ height: 64 }}>
        {DAYS.map((day) => {
          const rate = dayAvgRates[day] ?? 0;
          const isBest = day === bestDay;
          const isWorst = day === worstDay;
          const barH = Math.max(4, (rate / 100) * 52); // 최소 4px, 최대 52px

          return (
            <div
              key={day}
              className="flex-1 flex flex-col items-center gap-0.5"
              title={`${DAY_LABELS[day]}요일: ${rate}%`}
            >
              {/* 레이블 (최적/최악) */}
              <div className="h-3 flex items-center justify-center">
                {isBest && (
                  <span className="text-[8px] text-green-600 font-bold leading-none">
                    최고
                  </span>
                )}
                {isWorst && (
                  <span className="text-[8px] text-red-500 font-bold leading-none">
                    최저
                  </span>
                )}
              </div>
              {/* 바 */}
              <div
                className={`w-full rounded-t ${rateBarColor(rate)} transition-all`}
                style={{ height: barH }}
              />
              {/* 요일 라벨 */}
              <span
                className={`text-[9px] font-medium leading-none ${
                  isBest
                    ? "text-green-600"
                    : isWorst
                    ? "text-red-500"
                    : "text-muted-foreground"
                }`}
              >
                {DAY_LABELS[day]}
              </span>
              {/* 퍼센트 */}
              <span className="text-[8px] text-muted-foreground/70 tabular-nums">
                {rate}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 서브 컴포넌트: 멤버 예측 행 ───────────────────────────────

function AttendanceMemberForecastRow({ forecast }: { forecast: AttendanceMemberForecast }) {
  const ts = trendStyle(forecast.trend);

  return (
    <div className="flex items-center gap-2 py-1.5 border-b last:border-b-0">
      {/* 이름 */}
      <span className="text-xs font-medium flex-1 truncate min-w-0">
        {forecast.memberName}
      </span>

      {/* 전체 출석률 */}
      <div className="flex items-center gap-1 w-14 justify-end shrink-0">
        <span
          className={`text-xs font-bold tabular-nums ${rateColor(
            forecast.overallRate
          )}`}
        >
          {forecast.overallRate}%
        </span>
      </div>

      {/* 추세 아이콘 */}
      <div className="w-8 flex justify-center shrink-0">
        <TrendIcon
          trend={forecast.trend}
          className={`h-3.5 w-3.5 ${ts.icon}`}
        />
      </div>

      {/* 다음 예측 */}
      <div className="flex items-center gap-1 w-14 justify-end shrink-0">
        <span
          className={`text-[11px] tabular-nums ${rateColor(
            forecast.predictedNextRate
          )}`}
        >
          {forecast.predictedNextRate}%
        </span>
      </div>
    </div>
  );
}

// ─── 서브 컴포넌트: 스켈레톤 ───────────────────────────────────

function ForecastSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Skeleton className="h-8 w-24 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-md" />
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>
      <Skeleton className="h-16 w-full rounded-md" />
      <div className="space-y-1.5">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-8 w-full rounded" />
        ))}
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────────

interface AttendanceForecastCardProps {
  groupId: string;
}

export function AttendanceForecastCard({
  groupId,
}: AttendanceForecastCardProps) {
  const { data, loading, sortedByHighest, sortedByLowest, dayAvgRates, refreshForecast } =
    useAttendanceForecast(groupId);

  const [isOpen, setIsOpen] = useState(true);
  const [sortOrder, setSortOrder] = useState<"highest" | "lowest">("highest");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const sortedForecasts =
    sortOrder === "highest" ? sortedByHighest : sortedByLowest;

  const groupTrendStyle = data ? trendStyle(data.groupTrend) : null;

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      // 데모 멤버 6명으로 재생성
      refreshForecast();
      toast.success("출석 예측 데이터를 재계산했습니다.");
    } catch {
      toast.error("재계산에 실패했습니다.");
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleGenerateDemo() {
    setIsRefreshing(true);
    try {
      // 커스텀 데모 멤버 8명
      const demoMembers = [
        { id: "c-1", name: "강하늘" },
        { id: "c-2", name: "오세연" },
        { id: "c-3", name: "임지호" },
        { id: "c-4", name: "서보람" },
        { id: "c-5", name: "나은솔" },
        { id: "c-6", name: "문태준" },
        { id: "c-7", name: "신유빈" },
        { id: "c-8", name: "백지원" },
      ];
      refreshForecast(demoMembers);
      toast.success("새로운 데모 데이터를 생성했습니다.");
    } catch {
      toast.error("데이터 생성에 실패했습니다.");
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        {/* 헤더 */}
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4" aria-hidden="true" />
              멤버 출석 예측
            </CardTitle>
            <div className="flex items-center gap-1.5">
              {/* 그룹 추세 배지 */}
              {!loading && groupTrendStyle && (
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 border flex items-center gap-0.5 ${groupTrendStyle.badge}`}
                >
                  {data?.groupTrend === "improving" ? (
                    <TrendingUp className="h-2.5 w-2.5" />
                  ) : data?.groupTrend === "declining" ? (
                    <TrendingDown className="h-2.5 w-2.5" />
                  ) : (
                    <Minus className="h-2.5 w-2.5" />
                  )}
                  {groupTrendStyle.label}
                </Badge>
              )}
              {/* 접기/펼치기 */}
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  aria-label={isOpen ? "접기" : "펼치기"}
                >
                  {isOpen ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>

        {/* 콘텐츠 */}
        <CollapsibleContent>
          <CardContent className="space-y-4" aria-live="polite" aria-atomic="false">
            {loading ? (
              <ForecastSkeleton />
            ) : !data ? (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <Users className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">
                  예측 데이터가 없습니다.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={handleGenerateDemo}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  ) : null}
                  데모 데이터 생성
                </Button>
              </div>
            ) : (
              <>
                {/* 그룹 요약 */}
                <div className="grid grid-cols-3 gap-2">
                  {/* 최적 요일 */}
                  <div className="flex flex-col items-center gap-0.5 rounded-lg bg-green-50/70 border border-green-100 px-2 py-2">
                    <CalendarCheck className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-[9px] text-muted-foreground leading-none mt-0.5">
                      최적 요일
                    </span>
                    <span className="text-sm font-bold text-green-700">
                      {DAY_LABELS[data.bestDay]}요일
                    </span>
                    <span className="text-[9px] text-green-600 tabular-nums">
                      {dayAvgRates[data.bestDay]}%
                    </span>
                  </div>

                  {/* 최악 요일 */}
                  <div className="flex flex-col items-center gap-0.5 rounded-lg bg-red-50/70 border border-red-100 px-2 py-2">
                    <CalendarX className="h-3.5 w-3.5 text-red-500" />
                    <span className="text-[9px] text-muted-foreground leading-none mt-0.5">
                      최저 요일
                    </span>
                    <span className="text-sm font-bold text-red-600">
                      {DAY_LABELS[data.worstDay]}요일
                    </span>
                    <span className="text-[9px] text-red-500 tabular-nums">
                      {dayAvgRates[data.worstDay]}%
                    </span>
                  </div>

                  {/* 그룹 추세 */}
                  <div
                    className={`flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2 ${
                      data.groupTrend === "improving"
                        ? "bg-green-50/70 border-green-100"
                        : data.groupTrend === "declining"
                        ? "bg-red-50/70 border-red-100"
                        : "bg-blue-50/70 border-blue-100"
                    }`}
                  >
                    <TrendIcon
                      trend={data.groupTrend}
                      className={`h-3.5 w-3.5 ${trendStyle(data.groupTrend).icon}`}
                    />
                    <span className="text-[9px] text-muted-foreground leading-none mt-0.5">
                      그룹 추세
                    </span>
                    <span
                      className={`text-xs font-bold ${
                        data.groupTrend === "improving"
                          ? "text-green-700"
                          : data.groupTrend === "declining"
                          ? "text-red-600"
                          : "text-blue-700"
                      }`}
                    >
                      {trendStyle(data.groupTrend).label}
                    </span>
                    <span className="text-[9px] text-muted-foreground/60">
                      전체 패턴
                    </span>
                  </div>
                </div>

                {/* 요일별 출석률 바 차트 */}
                <DayRateChart
                  dayAvgRates={dayAvgRates}
                  bestDay={data.bestDay}
                  worstDay={data.worstDay}
                />

                {/* 멤버별 예측 테이블 */}
                <div>
                  {/* 테이블 헤더 + 정렬 버튼 */}
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] text-muted-foreground font-medium">
                      멤버별 출석 예측
                    </p>
                    <div className="flex rounded border overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setSortOrder("highest")}
                        className={[
                          "px-2 py-0.5 text-[10px] font-medium transition-colors",
                          sortOrder === "highest"
                            ? "bg-primary text-primary-foreground"
                            : "bg-background text-muted-foreground hover:bg-muted",
                        ].join(" ")}
                      >
                        높은 순
                      </button>
                      <button
                        type="button"
                        onClick={() => setSortOrder("lowest")}
                        className={[
                          "px-2 py-0.5 text-[10px] font-medium transition-colors",
                          sortOrder === "lowest"
                            ? "bg-primary text-primary-foreground"
                            : "bg-background text-muted-foreground hover:bg-muted",
                        ].join(" ")}
                      >
                        낮은 순
                      </button>
                    </div>
                  </div>

                  {/* 컬럼 헤더 */}
                  <div className="flex items-center gap-2 py-1 border-b">
                    <span className="text-[10px] text-muted-foreground flex-1">
                      이름
                    </span>
                    <span className="text-[10px] text-muted-foreground w-14 text-right shrink-0">
                      출석률
                    </span>
                    <span className="text-[10px] text-muted-foreground w-8 text-center shrink-0">
                      추세
                    </span>
                    <span className="text-[10px] text-muted-foreground w-14 text-right shrink-0">
                      다음 예측
                    </span>
                  </div>

                  {/* 멤버 행 */}
                  <div>
                    {sortedForecasts.map((forecast) => (
                      <AttendanceMemberForecastRow
                        key={forecast.memberId}
                        forecast={forecast}
                      />
                    ))}
                  </div>
                </div>

                {/* 액션 버튼 + 갱신 시각 */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                    >
                      {isRefreshing ? (
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3 mr-1" />
                      )}
                      재계산
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-muted-foreground"
                      onClick={handleGenerateDemo}
                      disabled={isRefreshing}
                    >
                      데모 생성
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground/50">
                    {new Date(data.updatedAt).toLocaleString("ko-KR", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
