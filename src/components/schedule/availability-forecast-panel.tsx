"use client";

import { useState } from "react";
import { Clock, Calendar, Users, TrendingUp, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAvailabilityForecast } from "@/hooks/use-availability-forecast";
import { type TimeSlot, TIME_SLOTS, DAY_OF_WEEK_LABELS } from "@/types/index";

// ────────────────────────────────────────────────────────────────────────────
// 상수
// ────────────────────────────────────────────────────────────────────────────

// 월~일 순서로 버튼 표시 (월=1, 화=2, ..., 일=0)
const DAY_ORDER: number[] = [1, 2, 3, 4, 5, 6, 0];

// ────────────────────────────────────────────────────────────────────────────
// 확률에 따른 색상 유틸
// ────────────────────────────────────────────────────────────────────────────

function getProbabilityColor(probability: number): {
  bar: string;
  text: string;
  badge: string;
} {
  if (probability >= 80) {
    return {
      bar: "bg-green-500",
      text: "text-green-600",
      badge: "bg-green-100 text-green-700 border-green-200",
    };
  }
  if (probability >= 50) {
    return {
      bar: "bg-yellow-400",
      text: "text-yellow-600",
      badge: "bg-yellow-100 text-yellow-700 border-yellow-200",
    };
  }
  return {
    bar: "bg-red-400",
    text: "text-red-600",
    badge: "bg-red-100 text-red-700 border-red-200",
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Props
// ────────────────────────────────────────────────────────────────────────────

interface AvailabilityForecastPanelProps {
  groupId: string;
}

// ────────────────────────────────────────────────────────────────────────────
// 컴포넌트
// ────────────────────────────────────────────────────────────────────────────

export function AvailabilityForecastPanel({ groupId }: AvailabilityForecastPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(1); // 월요일 기본
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot>("afternoon");

  const { getForecast, hasData, loading } = useAvailabilityForecast(groupId);

  const forecasts = getForecast(selectedDay, selectedSlot);

  // 80% 이상 예상 참석 인원
  const expectedCount = forecasts.filter((f) => f.probability >= 50).length;

  return (
    <Card className="mb-3">
      {/* 헤더 */}
      <CardHeader className="px-3 py-2.5 pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold">스케줄 가용성 예측</span>
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

        {/* 요약 배지 */}
        <div className="flex flex-wrap gap-1.5 pt-2 pb-2.5">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
            <Calendar className="h-2.5 w-2.5" />
            {DAY_OF_WEEK_LABELS[selectedDay]}요일
          </Badge>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
            <Clock className="h-2.5 w-2.5" />
            {TIME_SLOTS.find((s) => s.key === selectedSlot)?.label ?? ""}
          </Badge>
          {!loading && hasData && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
              <Users className="h-2.5 w-2.5" />
              예상 {expectedCount}명 참석
            </Badge>
          )}
        </div>
      </CardHeader>

      {/* 본문 */}
      {!collapsed && (
        <CardContent className="px-3 pb-3 pt-0 space-y-3">
          {/* 요일 선택 버튼 그룹 */}
          <div>
            <span className="text-[10px] text-muted-foreground mb-1.5 block">요일 선택</span>
            <div className="flex gap-1 flex-wrap">
              {DAY_ORDER.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={[
                    "text-[11px] px-2 py-0.5 rounded border transition-colors",
                    selectedDay === day
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:bg-muted",
                  ].join(" ")}
                >
                  {DAY_OF_WEEK_LABELS[day]}
                </button>
              ))}
            </div>
          </div>

          {/* 시간대 선택 버튼 그룹 */}
          <div>
            <span className="text-[10px] text-muted-foreground mb-1.5 block">시간대 선택</span>
            <div className="flex gap-1 flex-wrap">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot.key}
                  onClick={() => setSelectedSlot(slot.key)}
                  className={[
                    "text-[11px] px-2 py-0.5 rounded border transition-colors",
                    selectedSlot === slot.key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:bg-muted",
                  ].join(" ")}
                >
                  {slot.label}
                  <span className="ml-1 opacity-60">{slot.range}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 결과 영역 */}
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : !hasData ? (
            <div className="flex items-center justify-center h-16">
              <span className="text-xs text-muted-foreground">
                최근 3개월 출석 기록이 없습니다
              </span>
            </div>
          ) : forecasts.length === 0 ? (
            <div className="flex items-center justify-center h-16">
              <span className="text-xs text-muted-foreground">
                멤버 데이터가 없습니다
              </span>
            </div>
          ) : (
            <div className="space-y-1.5">
              {forecasts.map((forecast) => {
                const colors = getProbabilityColor(forecast.probability);
                return (
                  <div key={forecast.userId} className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-foreground truncate max-w-[60%]">
                        {forecast.name}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {forecast.sampleCount > 0 && (
                          <span className="text-[9px] text-muted-foreground tabular-nums">
                            n={forecast.sampleCount}
                          </span>
                        )}
                        <span className={`text-xs font-semibold tabular-nums ${colors.text}`}>
                          {forecast.probability}%
                        </span>
                      </div>
                    </div>
                    {/* 신뢰도 바 */}
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${colors.bar}`}
                        style={{ width: `${forecast.probability}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {/* 하단 예상 참석 인원 합계 */}
              <div className="pt-2 border-t mt-2 flex items-center justify-between">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>예상 참석 인원 (50% 이상)</span>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20"
                >
                  {expectedCount}명 / {forecasts.length}명
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
