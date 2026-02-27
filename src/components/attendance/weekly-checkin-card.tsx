"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronUp,
  Flame,
  Loader2,
  Target,
} from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useWeeklyAttendanceCheckin } from "@/hooks/use-weekly-attendance-checkin";
import type { WeeklyCheckinRecord } from "@/types";

// -------------------------------------------------------
// SVG 원형 프로그레스
// -------------------------------------------------------
function CircularProgress({
  actual,
  goal,
  size = 88,
}: {
  actual: number;
  goal: number;
  size?: number;
}) {
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = goal > 0 ? Math.min(actual / goal, 1) : 0;
  const strokeDashoffset = circumference - progress * circumference;
  const isAchieved = actual >= goal;

  const strokeColor = isAchieved ? "#22c55e" : "#6366f1";

  return (
    <svg
      width={size}
      height={size}
      className="rotate-[-90deg]"
      aria-hidden="true"
    >
      {/* 배경 트랙 */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={strokeWidth}
      />
      {/* 진행 바 */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
    </svg>
  );
}

// -------------------------------------------------------
// 미니 막대 차트 (최근 8주)
// -------------------------------------------------------
function MiniBarChart({ history }: { history: WeeklyCheckinRecord[] }) {
  // 날짜 오름차순 정렬 (왼쪽=오래된 주, 오른쪽=최근 주)
  const sorted = [...history].sort(
    (a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime()
  );

  if (sorted.length === 0) {
    return (
      <p className="text-[11px] text-muted-foreground">
        아직 히스토리가 없습니다
      </p>
    );
  }

  return (
    <div className="flex items-end gap-1.5" aria-label="최근 8주 출석 히스토리">
      {sorted.map((record) => {
        const ratio = record.goal > 0 ? Math.min(record.actual / record.goal, 1) : 0;
        const barH = Math.max(6, Math.round(ratio * 32)); // 최소 6px, 최대 32px
        const isCurrentWeek =
          record.weekStart ===
          format(
            new Date(
              new Date().setDate(
                new Date().getDate() - ((new Date().getDay() + 6) % 7)
              )
            ),
            "yyyy-MM-dd"
          );
        const label = format(new Date(record.weekStart + "T00:00:00"), "M/d", {
          locale: ko,
        });

        return (
          <div
            key={record.weekStart}
            className="flex flex-col items-center gap-0.5 flex-1"
            title={`${label} 주: ${record.actual}/${record.goal}회${record.achieved ? " (달성)" : ""}`}
          >
            <div className="w-full flex items-end justify-center" style={{ height: 32 }}>
              <div
                className={`w-full rounded-sm transition-all duration-300 ${
                  record.achieved
                    ? "bg-green-400"
                    : isCurrentWeek
                    ? "bg-indigo-400"
                    : "bg-gray-300"
                }`}
                style={{ height: barH }}
              />
            </div>
            <span className="text-[9px] text-muted-foreground leading-none">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

// -------------------------------------------------------
// 메인 컴포넌트
// -------------------------------------------------------
type WeeklyCheckinCardProps = {
  groupId: string;
  userId: string;
};

export function WeeklyCheckinCard({ groupId, userId }: WeeklyCheckinCardProps) {
  const [open, setOpen] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    currentGoal,
    currentActual,
    isAchieved,
    remaining,
    history,
    streak,
    setGoal,
    resetGoal,
    loading,
  } = useWeeklyAttendanceCheckin(groupId, userId);

  const handleSetGoal = async (goal: number) => {
    setSaving(true);
    try {
      await setGoal(goal);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        {/* 헤더 */}
        <CardHeader className="pb-2 pt-4 px-4">
          <CollapsibleTrigger asChild>
            <button
              className="flex items-center justify-between w-full text-left"
              aria-expanded={open}
            >
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <Target className="h-4 w-4 text-muted-foreground" />
                주간 출석 체크인
              </CardTitle>
              <div className="flex items-center gap-2">
                {streak > 0 && (
                  <span className="flex items-center gap-0.5 text-[11px] text-orange-500 font-medium">
                    <Flame className="h-3 w-3" />
                    {streak}주 연속
                  </span>
                )}
                {open ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </button>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="px-4 pb-4 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : currentGoal === null ? (
              /* ---- 목표 미설정 상태 ---- */
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  이번 주 출석 목표를 설정하세요
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <Button
                      key={n}
                      variant="outline"
                      size="sm"
                      className="h-7 w-8 text-xs px-0"
                      disabled={saving}
                      onClick={() => handleSetGoal(n)}
                    >
                      {saving ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        n
                      )}
                    </Button>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  주당 목표 출석 횟수 (1~7회)
                </p>
              </div>
            ) : (
              /* ---- 목표 설정 후 상태 ---- */
              <div className="space-y-4">
                {/* 원형 프로그레스 + 정보 */}
                <div className="flex items-center gap-4">
                  {/* SVG 원형 */}
                  <div className="relative shrink-0">
                    <CircularProgress
                      actual={currentActual}
                      goal={currentGoal}
                      size={88}
                    />
                    {/* 중앙 텍스트 */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span
                        className={`text-lg font-bold tabular-nums leading-tight ${
                          isAchieved ? "text-green-600" : "text-indigo-600"
                        }`}
                      >
                        {currentActual}
                      </span>
                      <span className="text-[10px] text-muted-foreground leading-none">
                        / {currentGoal}회
                      </span>
                    </div>
                  </div>

                  {/* 우측 텍스트 정보 */}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">이번 주 목표</span>
                      <span className="text-sm font-semibold">{currentGoal}회</span>
                      {isAchieved && (
                        <Badge className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200">
                          목표 달성!
                        </Badge>
                      )}
                    </div>

                    {isAchieved ? (
                      <p className="text-[11px] text-green-600">
                        훌륭해요! 이번 주 목표를 달성했습니다
                      </p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">
                        목표 달성까지 {remaining}회 더 출석 필요
                      </p>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[11px] px-1.5 text-muted-foreground hover:text-foreground"
                      onClick={() => resetGoal()}
                    >
                      목표 변경
                    </Button>
                  </div>
                </div>

                {/* 구분선 */}
                <div className="border-t" />

                {/* 최근 8주 막대 차트 */}
                <div className="space-y-1.5">
                  <p className="text-[11px] text-muted-foreground font-medium">
                    최근 {history.length}주 기록
                  </p>
                  <MiniBarChart history={history} />
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span className="inline-block w-2 h-2 rounded-sm bg-green-400" />
                      달성
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span className="inline-block w-2 h-2 rounded-sm bg-indigo-400" />
                      진행중
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span className="inline-block w-2 h-2 rounded-sm bg-gray-300" />
                      미달성
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
