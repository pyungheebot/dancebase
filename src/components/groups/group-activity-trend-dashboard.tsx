"use client";

import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  MessageSquare,
  Users,
  Minus,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGroupActivityTrends } from "@/hooks/use-group-activity-trends";
import type { MonthlyActivityTrend, ActivityTrendChange } from "@/types/index";

// ============================================
// 유틸 함수
// ============================================

/**
 * 변화율에 따른 아이콘과 색상 클래스를 반환합니다.
 */
function ChangeIndicator({ change }: { change: number | null }) {
  if (change === null) {
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  }
  if (change > 0) {
    return (
      <span className="flex items-center gap-0.5 text-emerald-600">
        <TrendingUp className="h-3 w-3" />
        <span className="text-[10px] font-semibold">+{change}%</span>
      </span>
    );
  }
  if (change < 0) {
    return (
      <span className="flex items-center gap-0.5 text-red-500">
        <TrendingDown className="h-3 w-3" />
        <span className="text-[10px] font-semibold">{change}%</span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-muted-foreground">
      <Minus className="h-3 w-3" />
      <span className="text-[10px]">0%</span>
    </span>
  );
}

// ============================================
// 세로 바 차트 (단일 지표)
// ============================================

interface BarChartProps {
  data: MonthlyActivityTrend[];
  getValue: (item: MonthlyActivityTrend) => number;
  color: string;
  hoveredColor: string;
  formatTooltip: (item: MonthlyActivityTrend) => string;
  unit?: string;
  /** 출석률은 항상 0~100 고정 스케일 */
  fixedMax?: number;
}

function VerticalBarChart({
  data,
  getValue,
  color,
  hoveredColor,
  formatTooltip,
  fixedMax,
}: BarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const values = data.map(getValue);
  const maxVal = fixedMax ?? Math.max(...values, 1);

  return (
    <div className="relative">
      <div className="flex items-end gap-1 h-24">
        {data.map((item, idx) => {
          const val = getValue(item);
          const heightPct = maxVal > 0 ? (val / maxVal) * 100 : 0;
          const isHovered = hoveredIndex === idx;
          const hasData = val > 0;

          return (
            <div
              key={item.month}
              className="flex-1 flex flex-col items-center gap-0.5 relative"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* 수치 표시 */}
              <span className="text-[9px] text-muted-foreground tabular-nums leading-none h-3">
                {hasData ? val : ""}
              </span>

              {/* 막대 컨테이너 */}
              <div className="w-full flex-1 flex items-end">
                <div
                  className="w-full rounded-t transition-all duration-300 cursor-default"
                  style={{
                    height: hasData ? `${Math.max(heightPct, 4)}%` : "4%",
                    backgroundColor: isHovered
                      ? hoveredColor
                      : hasData
                      ? color
                      : "hsl(var(--muted))",
                  }}
                  title={formatTooltip(item)}
                />
              </div>

              {/* 호버 툴팁 */}
              {isHovered && hasData && (
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-20 bg-popover border rounded shadow-md px-2 py-1 whitespace-nowrap pointer-events-none">
                  <p className="text-[10px] font-semibold text-popover-foreground">
                    {item.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatTooltip(item)}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* X축 레이블 */}
      <div className="flex gap-1 mt-1">
        {data.map((item) => (
          <div key={item.month} className="flex-1 flex items-center justify-center">
            <span className="text-[9px] text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// 스택 바 차트 (게시글 + 댓글)
// ============================================

function StackedBarChart({ data }: { data: MonthlyActivityTrend[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxVal = Math.max(...data.map((d) => d.postCount + d.commentCount), 1);

  return (
    <div className="relative">
      <div className="flex items-end gap-1 h-24">
        {data.map((item, idx) => {
          const total = item.postCount + item.commentCount;
          const totalHeightPct = maxVal > 0 ? (total / maxVal) * 100 : 0;
          const postRatio = total > 0 ? item.postCount / total : 0;
          const commentRatio = total > 0 ? item.commentCount / total : 0;
          const isHovered = hoveredIndex === idx;
          const hasData = total > 0;

          return (
            <div
              key={item.month}
              className="flex-1 flex flex-col items-center gap-0.5 relative"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* 총합 수치 */}
              <span className="text-[9px] text-muted-foreground tabular-nums leading-none h-3">
                {hasData ? total : ""}
              </span>

              {/* 스택 막대 컨테이너 */}
              <div className="w-full flex-1 flex items-end">
                {hasData ? (
                  <div
                    className="w-full flex flex-col rounded-t overflow-hidden transition-all duration-300"
                    style={{
                      height: `${Math.max(totalHeightPct, 4)}%`,
                      opacity: isHovered ? 1 : 0.85,
                    }}
                  >
                    {/* 게시글 (위) */}
                    <div
                      className="w-full"
                      style={{
                        flex: postRatio,
                        backgroundColor: isHovered
                          ? "hsl(258 90% 60%)"
                          : "hsl(258 90% 66%)",
                      }}
                    />
                    {/* 댓글 (아래) */}
                    <div
                      className="w-full"
                      style={{
                        flex: commentRatio,
                        backgroundColor: isHovered
                          ? "hsl(258 60% 82%)"
                          : "hsl(258 60% 88%)",
                      }}
                    />
                  </div>
                ) : (
                  <div
                    className="w-full rounded-t"
                    style={{ height: "4%", backgroundColor: "hsl(var(--muted))" }}
                  />
                )}
              </div>

              {/* 호버 툴팁 */}
              {isHovered && hasData && (
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-20 bg-popover border rounded shadow-md px-2 py-1 whitespace-nowrap pointer-events-none">
                  <p className="text-[10px] font-semibold text-popover-foreground">
                    {item.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    게시글 {item.postCount}개
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    댓글 {item.commentCount}개
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* X축 레이블 */}
      <div className="flex gap-1 mt-1">
        {data.map((item) => (
          <div key={item.month} className="flex-1 flex items-center justify-center">
            <span className="text-[9px] text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// 출석률 바 차트 (색상 그라데이션)
// ============================================

function AttendanceBarChart({ data }: { data: MonthlyActivityTrend[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  /** 출석률에 따라 색상 반환 (높을수록 초록, 낮을수록 빨강) */
  function rateColor(rate: number, dimmed: boolean): string {
    const alpha = dimmed ? "/ 0.7" : "";
    if (rate >= 80) return `hsl(142 71% 45% ${alpha})`;
    if (rate >= 60) return `hsl(84 70% 45% ${alpha})`;
    if (rate >= 40) return `hsl(38 92% 50% ${alpha})`;
    return `hsl(0 72% 51% ${alpha})`;
  }

  return (
    <div className="relative">
      <div className="flex items-end gap-1 h-24">
        {data.map((item, idx) => {
          const rate = item.attendanceRate;
          const isHovered = hoveredIndex === idx;
          const hasData = rate > 0;

          return (
            <div
              key={item.month}
              className="flex-1 flex flex-col items-center gap-0.5 relative"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* 수치 표시 */}
              <span className="text-[9px] text-muted-foreground tabular-nums leading-none h-3">
                {hasData ? `${rate}%` : ""}
              </span>

              {/* 막대 컨테이너 (최대 100 고정) */}
              <div className="w-full flex-1 flex items-end">
                <div
                  className="w-full rounded-t transition-all duration-300 cursor-default"
                  style={{
                    height: hasData ? `${Math.max(rate, 4)}%` : "4%",
                    backgroundColor: hasData
                      ? rateColor(rate, !isHovered)
                      : "hsl(var(--muted))",
                  }}
                  title={`${item.label} 출석률: ${rate}%`}
                />
              </div>

              {/* 호버 툴팁 */}
              {isHovered && hasData && (
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-20 bg-popover border rounded shadow-md px-2 py-1 whitespace-nowrap pointer-events-none">
                  <p className="text-[10px] font-semibold text-popover-foreground">
                    {item.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    출석률 {rate}%
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* X축 레이블 */}
      <div className="flex gap-1 mt-1">
        {data.map((item) => (
          <div key={item.month} className="flex-1 flex items-center justify-center">
            <span className="text-[9px] text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// 섹션 헤더
// ============================================

function SectionHeader({
  icon: Icon,
  title,
  iconClass,
}: {
  icon: React.ElementType;
  title: string;
  iconClass?: string;
}) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <Icon className={`h-3.5 w-3.5 ${iconClass ?? "text-muted-foreground"}`} />
      <span className="text-xs font-semibold">{title}</span>
    </div>
  );
}

// ============================================
// 종합 트렌드 요약 카드
// ============================================

function TrendSummarySection({
  monthly,
  change,
}: {
  monthly: MonthlyActivityTrend[];
  change: ActivityTrendChange;
}) {
  const current = monthly[monthly.length - 1];
  if (!current) return null;

  const items = [
    {
      icon: Calendar,
      iconClass: "text-blue-500",
      label: "일정",
      value: `${current.scheduleCount}회`,
      change: change.scheduleChange,
    },
    {
      icon: Users,
      iconClass: "text-emerald-500",
      label: "출석률",
      value: `${current.attendanceRate}%`,
      change: change.attendanceChange,
    },
    {
      icon: MessageSquare,
      iconClass: "text-purple-500",
      label: "게시글",
      value: `${current.postCount}개`,
      change: change.postChange,
    },
    {
      icon: MessageSquare,
      iconClass: "text-violet-400",
      label: "댓글",
      value: `${current.commentCount}개`,
      change: change.commentChange,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map(({ icon: Icon, iconClass, label, value, change: chg }) => (
        <div
          key={label}
          className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2"
        >
          <div className="flex items-center gap-1.5">
            <Icon className={`h-3.5 w-3.5 ${iconClass}`} />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-xs font-semibold">{value}</span>
            <ChangeIndicator change={chg} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// 스켈레톤
// ============================================

function TrendSkeleton() {
  return (
    <div className="space-y-5">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-24 w-full" />
        </div>
      ))}
    </div>
  );
}

// ============================================
// 메인 컴포넌트 (Sheet)
// ============================================

interface GroupActivityTrendDashboardProps {
  groupId: string;
  /** Sheet 트리거로 사용할 자식 요소. 없으면 기본 버튼 표시 */
  children?: React.ReactNode;
}

export function GroupActivityTrendDashboard({
  groupId,
  children,
}: GroupActivityTrendDashboardProps) {
  const { monthly, change, loading } = useGroupActivityTrends(groupId);

  const hasData = monthly.some(
    (m) =>
      m.scheduleCount > 0 ||
      m.attendanceRate > 0 ||
      m.postCount > 0 ||
      m.commentCount > 0
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children ?? (
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
            <BarChart3 className="h-3 w-3" />
            활동 트렌드
          </Button>
        )}
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            그룹 활동 트렌드
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            최근 6개월간 그룹 활동 현황을 시각화합니다.
          </p>
        </SheetHeader>

        {loading ? (
          <TrendSkeleton />
        ) : !hasData ? (
          <div className="flex items-center justify-center h-40">
            <span className="text-xs text-muted-foreground">
              아직 집계된 활동 데이터가 없습니다.
            </span>
          </div>
        ) : (
          <div className="space-y-5">
            {/* 1. 월별 일정 수 */}
            <section>
              <SectionHeader
                icon={Calendar}
                title="월별 일정 수"
                iconClass="text-blue-500"
              />
              <VerticalBarChart
                data={monthly}
                getValue={(m) => m.scheduleCount}
                color="hsl(217 91% 60% / 0.7)"
                hoveredColor="hsl(217 91% 60%)"
                formatTooltip={(m) => `일정 ${m.scheduleCount}회`}
              />
            </section>

            {/* 구분선 */}
            <div className="border-t" />

            {/* 2. 월별 출석률 */}
            <section>
              <SectionHeader
                icon={Users}
                title="월별 출석률"
                iconClass="text-emerald-500"
              />
              <AttendanceBarChart data={monthly} />
              {/* 범례 */}
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  { label: "80% 이상", color: "hsl(142 71% 45%)" },
                  { label: "60~79%", color: "hsl(84 70% 45%)" },
                  { label: "40~59%", color: "hsl(38 92% 50%)" },
                  { label: "40% 미만", color: "hsl(0 72% 51%)" },
                ].map(({ label, color }) => (
                  <div key={label} className="flex items-center gap-1">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[9px] text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* 구분선 */}
            <div className="border-t" />

            {/* 3. 월별 게시판 활동 */}
            <section>
              <SectionHeader
                icon={MessageSquare}
                title="월별 게시판 활동"
                iconClass="text-purple-500"
              />
              <StackedBarChart data={monthly} />
              {/* 범례 */}
              <div className="flex gap-3 mt-2">
                <div className="flex items-center gap-1">
                  <div
                    className="h-2 w-3 rounded-sm"
                    style={{ backgroundColor: "hsl(258 90% 66%)" }}
                  />
                  <span className="text-[9px] text-muted-foreground">게시글</span>
                </div>
                <div className="flex items-center gap-1">
                  <div
                    className="h-2 w-3 rounded-sm"
                    style={{ backgroundColor: "hsl(258 60% 88%)" }}
                  />
                  <span className="text-[9px] text-muted-foreground">댓글</span>
                </div>
              </div>
            </section>

            {/* 구분선 */}
            <div className="border-t" />

            {/* 4. 종합 트렌드 요약 */}
            <section>
              <SectionHeader
                icon={TrendingUp}
                title="이번 달 현황 (전월 대비)"
                iconClass="text-orange-500"
              />
              <TrendSummarySection monthly={monthly} change={change} />
              <p className="text-[9px] text-muted-foreground mt-2">
                * 화살표는 직전 월 대비 변화율입니다.
              </p>
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
