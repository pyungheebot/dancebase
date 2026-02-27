"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Flame, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useGroupActivityHeatmap } from "@/hooks/use-group-activity-heatmap";
import type { HeatmapCell } from "@/types";

// 요일 라벨 (0=월 ~ 6=일)
const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

// 시간대 슬롯 (2시간 단위: 6~24시)
const HOUR_SLOTS = [6, 8, 10, 12, 14, 16, 18, 20, 22];

// 시간 라벨 (슬롯 시작 시각)
function hourLabel(slot: number): string {
  return `${slot}시`;
}

// 출석률에 따른 셀 배경 색상 (CSS 클래스)
// avgAttendanceRate: 0(없음) ~ 높을수록 진한 초록
function cellColorClass(cell: HeatmapCell | undefined): string {
  if (!cell || cell.scheduleCount === 0) return "bg-muted/40";
  const rate = cell.avgAttendanceRate; // 0 ~ 최대 멤버수/일정 비율
  // 실용적 임계값: 클수록 진한 초록 (0.5, 1, 2, 3 명 이상을 기준으로)
  if (rate >= 3) return "bg-green-700";
  if (rate >= 2) return "bg-green-500";
  if (rate >= 1) return "bg-green-400";
  if (rate >= 0.5) return "bg-green-300";
  if (rate > 0) return "bg-green-200";
  return "bg-muted/40";
}

// 셀 툴팁 텍스트
function cellTitle(dayIndex: number, hourSlot: number, cell: HeatmapCell | undefined): string {
  const day = DAY_LABELS[dayIndex];
  const time = `${hourSlot}~${hourSlot + 2}시`;
  if (!cell || cell.scheduleCount === 0) return `${day} ${time} - 데이터 없음`;
  return `${day} ${time} - 일정 ${cell.scheduleCount}회, 출석 ${cell.attendanceCount}건 (평균 ${cell.avgAttendanceRate.toFixed(1)}명/일정)`;
}

interface GroupActivityHeatmapCardProps {
  groupId: string;
}

export function GroupActivityHeatmapCard({ groupId }: GroupActivityHeatmapCardProps) {
  const { heatmap, loading } = useGroupActivityHeatmap(groupId);
  const [open, setOpen] = useState(true);

  // 셀 데이터 인덱싱: dayIndex-hourSlot -> HeatmapCell
  const cellMap = new Map<string, HeatmapCell>();
  if (heatmap) {
    for (const cell of heatmap.cells) {
      cellMap.set(`${cell.dayIndex}-${cell.hourSlot}`, cell);
    }
  }

  const hasData = heatmap && heatmap.cells.length > 0;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-orange-500" />
              그룹 활동 히트맵
            </CardTitle>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                {open ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            최근 90일 일정 출석 데이터 기반 (2시간 단위)
          </p>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {loading ? (
              <HeatmapSkeleton />
            ) : !hasData ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                최근 90일 내 출석 기록이 없습니다
              </div>
            ) : (
              <>
                {/* 히트맵 그리드 */}
                <div className="overflow-x-auto">
                  <div className="min-w-[320px]">
                    {/* 시간 라벨 헤더 */}
                    <div className="flex items-center mb-1">
                      {/* 요일 라벨 공간 */}
                      <div className="w-6 shrink-0" />
                      <div className="flex flex-1 gap-0.5">
                        {HOUR_SLOTS.map((slot) => (
                          <div
                            key={slot}
                            className="flex-1 text-center text-[9px] text-muted-foreground leading-none"
                          >
                            {hourLabel(slot)}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 요일별 행 */}
                    {DAY_LABELS.map((dayLabel, dayIndex) => (
                      <div key={dayIndex} className="flex items-center gap-0.5 mb-0.5">
                        {/* 요일 라벨 */}
                        <div className="w-6 shrink-0 text-[10px] text-muted-foreground text-right pr-1">
                          {dayLabel}
                        </div>
                        {/* 슬롯 셀 */}
                        {HOUR_SLOTS.map((slot) => {
                          const cell = cellMap.get(`${dayIndex}-${slot}`);
                          const colorClass = cellColorClass(cell);
                          const title = cellTitle(dayIndex, slot, cell);
                          return (
                            <div
                              key={slot}
                              title={title}
                              className={`
                                flex-1 aspect-square rounded-[3px] cursor-default transition-colors
                                ${colorClass}
                                ${cell && cell.scheduleCount > 0 ? "hover:opacity-80" : ""}
                              `}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 색상 범례 */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-muted-foreground">출석 낮음</span>
                  {["bg-green-200", "bg-green-300", "bg-green-400", "bg-green-500", "bg-green-700"].map(
                    (cls, i) => (
                      <div
                        key={i}
                        className={`h-3 w-3 rounded-[2px] ${cls}`}
                      />
                    )
                  )}
                  <span className="text-[10px] text-muted-foreground">출석 높음</span>
                  <div className="h-3 w-3 rounded-[2px] bg-muted/40 border border-border ml-1" />
                  <span className="text-[10px] text-muted-foreground">데이터 없음</span>
                </div>

                {/* 추천 시간대 */}
                {heatmap.bestSlots.length > 0 && (
                  <div className="border-t pt-3 space-y-1.5">
                    <p className="text-[11px] font-medium text-foreground flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-400" />
                      최적 연습 시간대 추천
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {heatmap.bestSlots.map((slot, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 bg-green-50 text-green-700 border-green-200"
                        >
                          <span className="font-medium">{DAY_LABELS[slot.dayIndex]}</span>
                          <span className="mx-0.5 text-muted-foreground">/</span>
                          {slot.hourSlot}~{slot.hourSlot + 2}시
                          <span className="ml-1 text-green-600 font-semibold">
                            ({slot.rate.toFixed(1)}명)
                          </span>
                        </Badge>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      일정당 평균 출석 인원이 가장 많은 시간대입니다
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function HeatmapSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex items-center gap-0.5">
          <Skeleton className="h-3 w-5 mr-1" />
          {Array.from({ length: 9 }).map((_, j) => (
            <Skeleton key={j} className="flex-1 aspect-square rounded-[3px]" />
          ))}
        </div>
      ))}
      <Skeleton className="h-3 w-48 mt-2" />
    </div>
  );
}
