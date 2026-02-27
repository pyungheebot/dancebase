"use client";

import { useState } from "react";
import { BarChart3, Users, TrendingUp, AlertCircle, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useScheduleAttendancePredictor } from "@/hooks/use-schedule-attendance-predictor";
import { DAY_OF_WEEK_LABELS, TIME_SLOTS } from "@/types/index";
import type { ScheduleAttendancePrediction } from "@/types/index";

// ────────────────────────────────────────────────────────────────────────────
// 확률별 색상 유틸
// ────────────────────────────────────────────────────────────────────────────

function getProbabilityColors(probability: number): {
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
// 아바타 이니셜 추출 유틸
// ────────────────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  // 한글 이름: 첫 글자만
  if (/[가-힣]/.test(trimmed[0])) {
    return trimmed[0];
  }
  // 영문 이름: 첫 두 글자 대문자
  const parts = trimmed.split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

// ────────────────────────────────────────────────────────────────────────────
// 단일 멤버 예측 행
// ────────────────────────────────────────────────────────────────────────────

function MemberPredictionRow({
  prediction,
}: {
  prediction: ScheduleAttendancePrediction;
}) {
  const colors = getProbabilityColors(prediction.probability);

  return (
    <div className="flex items-center gap-2">
      {/* 아바타 */}
      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-muted flex items-center justify-center">
        <span className="text-[9px] font-semibold text-muted-foreground">
          {getInitials(prediction.name)}
        </span>
      </div>

      {/* 이름 + 바 */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs text-foreground truncate">{prediction.name}</span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* 추천 라벨 배지 */}
            <span
              className={`text-[9px] px-1 py-0 rounded border ${colors.badge}`}
            >
              {prediction.label}
            </span>
            {/* 확률 % */}
            <span className={`text-xs font-semibold tabular-nums ${colors.text}`}>
              {prediction.probability}%
            </span>
          </div>
        </div>
        {/* CSS 바 */}
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${colors.bar}`}
            style={{ width: `${prediction.probability}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Props
// ────────────────────────────────────────────────────────────────────────────

interface ScheduleAttendancePredictionProps {
  groupId: string;
  scheduleId: string;
}

// ────────────────────────────────────────────────────────────────────────────
// 컴포넌트
// ────────────────────────────────────────────────────────────────────────────

export function ScheduleAttendancePrediction({
  groupId,
  scheduleId,
}: ScheduleAttendancePredictionProps) {
  const [collapsed, setCollapsed] = useState(false);

  const {
    predictions,
    expectedCount,
    totalCount,
    analysisSummary,
    dayOfWeek,
    timeSlot,
    hasData,
    loading,
  } = useScheduleAttendancePredictor(groupId, scheduleId);

  const dayLabel = DAY_OF_WEEK_LABELS[dayOfWeek] ?? "";
  const slotLabel = TIME_SLOTS.find((s) => s.key === timeSlot)?.label ?? "";

  // 예상 참석 비율 (바 차트용)
  const expectedRatio = totalCount > 0 ? Math.round((expectedCount / totalCount) * 100) : 0;

  return (
    <Card className="mb-3">
      {/* 헤더 */}
      <CardHeader className="px-3 py-2.5 pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold">일정 출석 예측</span>
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

        {/* 상단 요약: 예상 참석 N명 / 전체 N명 + 바 차트 */}
        <div className="pt-2 pb-2.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Users className="h-3 w-3 text-muted-foreground" />
              {loading ? (
                <Skeleton className="h-3.5 w-24" />
              ) : (
                <span className="text-xs text-muted-foreground">
                  예상 참석{" "}
                  <span className="font-semibold text-foreground">{expectedCount}명</span>
                  {" "}/ 전체{" "}
                  <span className="font-semibold text-foreground">{totalCount}명</span>
                </span>
              )}
            </div>
            {!loading && hasData && (
              <div className="flex items-center gap-1">
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
                  <TrendingUp className="h-2.5 w-2.5" />
                  {dayLabel}요일 {slotLabel}
                </Badge>
              </div>
            )}
          </div>

          {/* 바 차트 (전체 대비 예상 참석 비율) */}
          {!loading && totalCount > 0 && (
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-300"
                style={{ width: `${expectedRatio}%` }}
              />
            </div>
          )}
        </div>
      </CardHeader>

      {/* 본문 */}
      {!collapsed && (
        <CardContent className="px-3 pb-3 pt-0 space-y-2">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : !hasData ? (
            <div className="flex items-center justify-center gap-1.5 py-4">
              <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                최근 3개월 출석 기록이 없습니다
              </span>
            </div>
          ) : predictions.length === 0 ? (
            <div className="flex items-center justify-center gap-1.5 py-4">
              <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                멤버 데이터가 없습니다
              </span>
            </div>
          ) : (
            <>
              {/* 멤버 리스트 */}
              <div className="space-y-2">
                {predictions.map((prediction) => (
                  <MemberPredictionRow
                    key={prediction.userId}
                    prediction={prediction}
                  />
                ))}
              </div>

              {/* 하단 분석 기반 설명 */}
              {analysisSummary && (
                <div className="pt-2 border-t mt-1">
                  <div className="flex items-start gap-1">
                    <AlertCircle className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="text-[10px] text-muted-foreground leading-relaxed">
                      {analysisSummary}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
