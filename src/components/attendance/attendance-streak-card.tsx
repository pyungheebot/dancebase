"use client";

import { useState } from "react";
import { Flame, Trophy, CalendarDays, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useAttendanceStreak } from "@/hooks/use-attendance-streak";
import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";

type AttendanceStreakCardProps = {
  groupId: string;
  userId: string;
};

export function AttendanceStreakCard({ groupId, userId }: AttendanceStreakCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { currentStreak, longestStreak, totalPresent, monthlyGrid, loading } =
    useAttendanceStreak(groupId, userId);

  const isHighStreak = currentStreak >= 10;
  const isMediumStreak = currentStreak >= 5 && currentStreak < 10;
  const showFlameAnimation = currentStreak >= 5;

  return (
    <Card
      className={
        isHighStreak
          ? "bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 border-amber-200"
          : isMediumStreak
          ? "border-amber-200"
          : ""
      }
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5">
              <Flame
                className={`h-4 w-4 ${
                  showFlameAnimation ? "text-amber-500" : "text-muted-foreground"
                }`}
              />
              나의 출석 스트릭
              {showFlameAnimation && (
                <Badge
                  className={`text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 border-amber-300 ${
                    isHighStreak ? "animate-pulse" : ""
                  }`}
                  variant="outline"
                >
                  🔥 {currentStreak}일 연속
                </Badge>
              )}
            </div>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                aria-label={isOpen ? "달력 접기" : "달력 펼치기"}
              >
                {isOpen ? (
                  <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </Button>
            </CollapsibleTrigger>
          </CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* 상단 통계 3개 */}
              <div className="grid grid-cols-3 gap-3">
                {/* 현재 연속 */}
                <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-background/60">
                  <div className="flex items-center gap-1">
                    <Flame
                      className={`h-3.5 w-3.5 ${
                        showFlameAnimation ? "text-amber-500" : "text-muted-foreground"
                      }`}
                    />
                    <span className="text-[10px] text-muted-foreground font-medium">현재 연속</span>
                  </div>
                  <span
                    className={`text-2xl font-bold tabular-nums leading-none ${
                      isHighStreak
                        ? "text-amber-600"
                        : isMediumStreak
                        ? "text-amber-500"
                        : "text-foreground"
                    }`}
                  >
                    {currentStreak}
                  </span>
                  <span className="text-[10px] text-muted-foreground">일</span>
                </div>

                {/* 최장 기록 */}
                <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-background/60">
                  <div className="flex items-center gap-1">
                    <Trophy className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground font-medium">최장 기록</span>
                  </div>
                  <span className="text-2xl font-bold tabular-nums leading-none text-foreground">
                    {longestStreak}
                  </span>
                  <span className="text-[10px] text-muted-foreground">일</span>
                </div>

                {/* 총 출석 */}
                <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-background/60">
                  <div className="flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground font-medium">총 출석</span>
                  </div>
                  <span
                    className={`text-2xl font-bold tabular-nums leading-none ${
                      totalPresent >= 20
                        ? "text-green-600"
                        : totalPresent >= 10
                        ? "text-blue-600"
                        : "text-foreground"
                    }`}
                  >
                    {totalPresent}
                  </span>
                  <span className="text-[10px] text-muted-foreground">회</span>
                </div>
              </div>

              {/* 하단 Collapsible: 90일 달력 그리드 */}
              <CollapsibleContent>
                <div className="mt-4 pt-3 border-t border-border/50">
                  <div className="flex items-center gap-1.5 mb-3">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground font-medium">
                      최근 90일 출석 현황
                    </span>
                    <div className="ml-auto flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <span className="inline-block w-2.5 h-2.5 rounded-sm bg-green-500" />
                        출석
                      </span>
                      <span className="flex items-center gap-0.5">
                        <span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-400" />
                        결석
                      </span>
                      <span className="flex items-center gap-0.5">
                        <span className="inline-block w-2.5 h-2.5 rounded-sm bg-muted" />
                        일정없음
                      </span>
                    </div>
                  </div>

                  {monthlyGrid.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground text-center py-3">
                      최근 90일 내 출석 데이터가 없습니다.
                    </p>
                  ) : (
                    <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(15, 1fr)" }}>
                      {monthlyGrid.map(({ date, present }) => {
                        const parsed = parseISO(date);
                        const label = format(parsed, "M/d", { locale: ko });
                        return (
                          <div
                            key={date}
                            title={`${label} - ${present ? "출석" : "결석"}`}
                            className={`aspect-square rounded-sm cursor-default transition-opacity hover:opacity-80 ${
                              present
                                ? "bg-green-500"
                                : "bg-red-400"
                            }`}
                          />
                        );
                      })}
                    </div>
                  )}

                  {monthlyGrid.length > 0 && (
                    <p className="text-[10px] text-muted-foreground text-center mt-2">
                      총 {monthlyGrid.length}회 일정 중 {totalPresent}회 출석
                    </p>
                  )}
                </div>
              </CollapsibleContent>
            </>
          )}
        </CardContent>
      </Collapsible>
    </Card>
  );
}
