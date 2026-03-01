"use client";

import { useState } from "react";
import { BarChart3, Clock, Users, TrendingUp, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { usePracticeStats } from "@/hooks/use-practice-stats";

interface PracticeStatsCardProps {
  groupId: string;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}분`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
}

export function PracticeStatsCard({ groupId }: PracticeStatsCardProps) {
  const { monthly, summary, loading } = usePracticeStats(groupId);
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxCount = Math.max(...monthly.map((m) => m.scheduleCount), 1);
  const maxAttendees = Math.max(...monthly.map((m) => m.avgAttendees), 1);
  const hasData = summary.totalSchedules > 0;

  return (
    <Card className="mb-3">
      <CardHeader className="px-3 py-2.5 pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold">연습 통계</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={collapsed ? "펼치기" : "접기"}
          >
            <ChevronDown
              className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200"
              style={{ transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)" }}
            />
          </Button>
        </div>

        {/* 요약 배지 바 */}
        <div className="flex flex-wrap gap-1.5 pt-2 pb-2.5">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
            <TrendingUp className="h-2.5 w-2.5" />
            총 {summary.totalSchedules}회
          </Badge>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
            <Clock className="h-2.5 w-2.5" />
            총 {formatMinutes(summary.totalMinutes)}
          </Badge>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
            <Users className="h-2.5 w-2.5" />
            평균 {summary.avgAttendees}명 참석
          </Badge>
        </div>
      </CardHeader>

      {!collapsed && (
        <CardContent className="px-3 pb-3 pt-0">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : !hasData ? (
            <div className="flex items-center justify-center h-16">
              <span className="text-xs text-muted-foreground">
                아직 연습 기록이 없습니다
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              {/* 막대 그래프 영역 */}
              <div className="relative">
                {/* 막대 + X축 */}
                <div className="flex items-end gap-1 h-28">
                  {monthly.map((stat, idx) => {
                    const heightPct =
                      maxCount > 0 ? (stat.scheduleCount / maxCount) * 100 : 0;
                    const isHovered = hoveredIndex === idx;

                    return (
                      <div
                        key={stat.month}
                        className="flex-1 flex flex-col items-center gap-0.5 relative"
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      >
                        {/* 횟수 숫자 */}
                        <span className="text-[9px] text-muted-foreground tabular-nums leading-none h-3">
                          {stat.scheduleCount > 0 ? stat.scheduleCount : ""}
                        </span>

                        {/* 막대 컨테이너 */}
                        <div className="w-full flex-1 flex items-end">
                          <div
                            className="w-full rounded-t transition-all duration-300"
                            style={{
                              height:
                                stat.scheduleCount > 0
                                  ? `${Math.max(heightPct, 4)}%`
                                  : "4%",
                              backgroundColor: isHovered
                                ? "hsl(var(--primary) / 0.85)"
                                : stat.scheduleCount > 0
                                ? "hsl(var(--primary) / 0.7)"
                                : "hsl(var(--muted))",
                            }}
                          />
                        </div>

                        {/* 툴팁 */}
                        {isHovered && stat.scheduleCount > 0 && (
                          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-10 bg-popover border rounded shadow-md px-2 py-1 whitespace-nowrap pointer-events-none">
                            <p className="text-[10px] font-semibold text-popover-foreground">
                              {stat.label}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {stat.scheduleCount}회 연습
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {formatMinutes(stat.totalMinutes)}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              평균 {stat.avgAttendees}명 참석
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* X축 레이블 */}
                <div className="flex gap-1 mt-1">
                  {monthly.map((stat) => (
                    <div
                      key={stat.month}
                      className="flex-1 flex items-center justify-center"
                    >
                      <span className="text-[9px] text-muted-foreground">
                        {stat.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 평균 참석 인원 라인 (점 + 연결선) */}
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Users className="h-2.5 w-2.5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">
                    월별 평균 참석 인원
                  </span>
                </div>

                {/* 참석 인원 점-선 그래프 */}
                <div className="relative h-8">
                  {/* SVG 연결선 */}
                  <svg
                    className="absolute inset-0 w-full h-full overflow-visible"
                    preserveAspectRatio="none"
                  >
                    {monthly.map((stat, idx) => {
                      if (idx === 0 || stat.scheduleCount === 0) return null;
                      const prev = monthly[idx - 1];
                      if (prev.scheduleCount === 0) return null;

                      const segW = 100 / monthly.length;
                      const x1 = (idx - 1) * segW + segW / 2;
                      const x2 = idx * segW + segW / 2;
                      const y1 =
                        100 -
                        (maxAttendees > 0
                          ? (prev.avgAttendees / maxAttendees) * 80
                          : 0) -
                        10;
                      const y2 =
                        100 -
                        (maxAttendees > 0
                          ? (stat.avgAttendees / maxAttendees) * 80
                          : 0) -
                        10;

                      return (
                        <line
                          key={`line-${idx}`}
                          x1={`${x1}%`}
                          y1={`${y1}%`}
                          x2={`${x2}%`}
                          y2={`${y2}%`}
                          stroke="hsl(var(--primary) / 0.5)"
                          strokeWidth="1.5"
                        />
                      );
                    })}
                  </svg>

                  {/* 점 + 숫자 */}
                  <div className="absolute inset-0 flex">
                    {monthly.map((stat) => {
                      const pct =
                        maxAttendees > 0
                          ? (stat.avgAttendees / maxAttendees) * 80
                          : 0;
                      const bottomPct = pct + 10;

                      return (
                        <div
                          key={stat.month}
                          className="flex-1 relative"
                        >
                          {stat.scheduleCount > 0 && (
                            <div
                              className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5"
                              style={{ bottom: `${bottomPct}%` }}
                            >
                              <span className="text-[8px] text-primary font-semibold leading-none">
                                {stat.avgAttendees}
                              </span>
                              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
